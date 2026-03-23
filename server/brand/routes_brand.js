/* eslint-disable @typescript-eslint/no-require-imports */
const express = require("express");
const pool = require("./db");
const { requireInternalApiKey } = require("./middleware_api_key");
const { generateBrandContent } = require("./openai_brand");
const { generateAgentTaskResult } = require("./agent_tasks");
const { registerSalonDashboardRoutes } = require("./salon_dashboard_routes");

const router = express.Router();

router.use(requireInternalApiKey);
registerSalonDashboardRoutes(router);

router.get("/dashboard", async (_req, res) => {
  try {
    const [
      campaignsCount,
      draftsCount,
      scheduledCount,
      newLeadsCount,
      toursCount,
      signedCount,
      recentContent,
      recentLeads,
    ] = await Promise.all([
      pool.query(`select count(*)::int as count from brand_campaigns where status = 'active'`),
      pool.query(`select count(*)::int as count from content_assets where status = 'draft'`),
      pool.query(`
        select count(*)::int as count
        from content_assets
        where status = 'scheduled'
          and scheduled_for >= date_trunc('week', now())
          and scheduled_for < date_trunc('week', now()) + interval '7 days'
      `),
      pool.query(`select count(*)::int as count from recruitment_leads where status = 'new'`),
      pool.query(`select count(*)::int as count from recruitment_leads where status = 'tour_scheduled'`),
      pool.query(`
        select count(*)::int as count
        from recruitment_leads
        where status = 'signed'
          and created_at >= date_trunc('month', now())
      `),
      pool.query(`
        select id, title,
          concat(platform, ' ', content_type, ' • ', status) as subtitle,
          status
        from content_assets
        order by created_at desc
        limit 5
      `),
      pool.query(`
        select id, full_name,
          concat(role_type, coalesce(' • ' || city, '')) as subtitle,
          status
        from recruitment_leads
        order by created_at desc
        limit 5
      `),
    ]);

    return res.json({
      stats: {
        activeCampaigns: campaignsCount.rows[0].count,
        draftsAwaitingApproval: draftsCount.rows[0].count,
        scheduledThisWeek: scheduledCount.rows[0].count,
        newLeads: newLeadsCount.rows[0].count,
        toursBooked: toursCount.rows[0].count,
        signedRenters: signedCount.rows[0].count,
      },
      recentContent: recentContent.rows.map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: r.subtitle,
        status: r.status,
        href: `/content/${r.id}`,
      })),
      recentLeads: recentLeads.rows.map((r) => ({
        id: r.id,
        title: r.full_name,
        subtitle: r.subtitle,
        status: r.status,
        href: `/leads/${r.id}`,
      })),
    });
  } catch (err) {
    console.error("GET /brand/dashboard error:", err);
    res.status(500).json({ ok: false, error: "Failed to load dashboard" });
  }
});

router.get("/recruiting-metrics", async (_req, res) => {
  try {
    const dashboard = await pool.query(`
      select
        (select count(*)::int from recruitment_leads where created_at >= now() - interval '7 days') as new_leads_7d,
        (select count(*)::int from recruitment_leads where status = 'tour_scheduled') as tours_booked,
        (select count(*)::int from recruitment_leads where status = 'signed') as signed_renters,
        (select count(*)::int from brand_campaigns where status = 'active') as active_campaigns,
        (select count(*)::int from content_assets where status = 'draft') as pending_approvals,
        (select count(*)::int from content_assets where status = 'scheduled') as scheduled_posts,
        (select count(*)::int from recruitment_leads where status = 'new') as pipeline_new,
        (select count(*)::int from recruitment_leads where status = 'contacted') as pipeline_contacted
    `);

    const row = dashboard.rows[0] || {};
    res.json({
      new_leads_7d: Number(row.new_leads_7d) || 0,
      tours_booked: Number(row.tours_booked) || 0,
      signed_renters: Number(row.signed_renters) || 0,
      active_campaigns: Number(row.active_campaigns) || 0,
      pending_approvals: Number(row.pending_approvals) || 0,
      scheduled_posts: Number(row.scheduled_posts) || 0,
      pipeline_stage_counts: {
        new: Number(row.pipeline_new) || 0,
        contacted: Number(row.pipeline_contacted) || 0,
        tour_scheduled: Number(row.tours_booked) || 0,
        signed: Number(row.signed_renters) || 0,
      },
    });
  } catch (err) {
    console.error("GET /brand/recruiting-metrics error:", err);
    res.status(500).json({ ok: false, error: "Failed to load recruiting metrics" });
  }
});

router.get("/campaigns", async (_req, res) => {
  try {
    const q = await pool.query(`
      select
        id, name, objective, audience, locations, budget, status,
        start_date as "startDate",
        end_date as "endDate",
        created_at as "createdAt"
      from brand_campaigns
      order by created_at desc
    `);

    res.json(q.rows);
  } catch (err) {
    console.error("GET /brand/campaigns error:", err);
    res.status(500).json({ ok: false, error: "Failed to load campaigns" });
  }
});

router.post("/campaigns", async (req, res) => {
  try {
    const {
      name,
      objective = "",
      audience = [],
      locations = [],
      budget = null,
      status = "draft",
      startDate = null,
      endDate = null,
    } = req.body || {};

    if (!name) {
      return res.status(400).json({ ok: false, error: "name is required" });
    }

    const q = await pool.query(
      `
      insert into brand_campaigns
      (name, objective, audience, locations, budget, status, start_date, end_date)
      values ($1,$2,$3::jsonb,$4::jsonb,$5,$6,$7,$8)
      returning
        id, name, objective, audience, locations, budget, status,
        start_date as "startDate",
        end_date as "endDate",
        created_at as "createdAt"
      `,
      [
        name,
        objective,
        JSON.stringify(audience),
        JSON.stringify(locations),
        budget,
        status,
        startDate,
        endDate,
      ]
    );

    res.json({ ok: true, campaign: q.rows[0] });
  } catch (err) {
    console.error("POST /brand/campaigns error:", err);
    res.status(500).json({ ok: false, error: "Failed to create campaign" });
  }
});

router.patch("/campaigns/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = {
      name: "name",
      objective: "objective",
      audience: "audience",
      locations: "locations",
      budget: "budget",
      status: "status",
      startDate: "start_date",
      endDate: "end_date",
    };

    const updates = [];
    const values = [];
    let index = 1;

    for (const [inputKey, column] of Object.entries(allowed)) {
      if (req.body[inputKey] !== undefined) {
        const value = ["audience", "locations"].includes(inputKey)
          ? JSON.stringify(req.body[inputKey])
          : req.body[inputKey];
        const cast = ["audience", "locations"].includes(inputKey) ? "::jsonb" : "";
        updates.push(`${column} = $${index}${cast}`);
        values.push(value);
        index += 1;
      }
    }

    if (!updates.length) {
      return res.status(400).json({ ok: false, error: "No valid fields to update" });
    }

    values.push(id);
    const q = await pool.query(
      `
      update brand_campaigns
      set ${updates.join(", ")}
      where id = $${index}
      returning
        id, name, objective, audience, locations, budget, status,
        start_date as "startDate",
        end_date as "endDate",
        created_at as "createdAt"
      `,
      values
    );

    if (!q.rowCount) {
      return res.status(404).json({ ok: false, error: "Campaign not found" });
    }

    res.json({ ok: true, campaign: q.rows[0] });
  } catch (err) {
    console.error("PATCH /brand/campaigns/:id error:", err);
    res.status(500).json({ ok: false, error: "Failed to update campaign" });
  }
});

router.get("/content", async (req, res) => {
  try {
    const status = req.query.status;
    const filters = [];
    const values = [];

    if (status) {
      values.push(status);
      filters.push(`status = $${values.length}`);
    }

    const q = await pool.query(`
      select
        id,
        campaign_id as "campaignId",
        title,
        content_type as "contentType",
        platform,
        audience,
        city,
        hook,
        caption,
        script,
        cta,
        hashtags,
        status,
        scheduled_for as "scheduledFor",
        published_at as "publishedAt",
        created_at as "createdAt"
      from content_assets
      ${filters.length ? `where ${filters.join(" and ")}` : ""}
      order by created_at desc
      limit 100
    `, values);

    res.json(q.rows);
  } catch (err) {
    console.error("GET /brand/content error:", err);
    res.status(500).json({ ok: false, error: "Failed to load content" });
  }
});

router.post("/content", async (req, res) => {
  try {
    const {
      campaignId = null,
      title,
      contentType = "post",
      platform = "Instagram",
      audience = null,
      city = null,
      hook = null,
      caption = "",
      script = "",
      cta = process.env.BRAND_DEFAULT_CTA || "DM us BOOTH to learn more.",
      hashtags = [],
      status = "draft",
      sourcePrompt = null,
      aiModel = null,
      generationNotes = null,
    } = req.body || {};

    if (!title) {
      return res.status(400).json({ ok: false, error: "title is required" });
    }

    const insert = await pool.query(
      `
      insert into content_assets
      (
        campaign_id, title, content_type, platform, audience, city, hook,
        caption, script, cta, hashtags, status, source_prompt, ai_model, generation_notes
      )
      values
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13::jsonb,$14,$15)
      returning
        id,
        campaign_id as "campaignId",
        title,
        content_type as "contentType",
        platform,
        audience,
        city,
        hook,
        caption,
        script,
        cta,
        hashtags,
        status,
        scheduled_for as "scheduledFor",
        published_at as "publishedAt",
        created_at as "createdAt"
      `,
      [
        campaignId,
        title,
        contentType,
        platform,
        audience,
        city,
        hook,
        caption,
        script,
        cta,
        JSON.stringify(hashtags),
        status,
        JSON.stringify(sourcePrompt || {}),
        aiModel,
        generationNotes,
      ]
    );

    res.json({ ok: true, content: insert.rows[0] });
  } catch (err) {
    console.error("POST /brand/content error:", err);
    res.status(500).json({ ok: false, error: "Failed to save content" });
  }
});

router.post("/content/generate", async (req, res) => {
  try {
    const {
      campaignId = null,
      audience = "Cosmetologist",
      city = "Juneau, WI",
      platform = "Instagram",
      contentType = "post",
      hook = process.env.BRAND_TAGLINE || "Because You Deserve Better",
      cta = process.env.BRAND_DEFAULT_CTA || "DM us BOOTH to learn more.",
    } = req.body || {};

    const brandName = process.env.BRAND_NAME || "Keeping It Cute Salon & Spa";
    const tagline = process.env.BRAND_TAGLINE || "Because You Deserve Better";

    const ai = await generateBrandContent({
      audience,
      city,
      platform,
      contentType,
      hook,
      cta,
      brandName,
      tagline,
    });

    const title = ai.data.title || `${audience} Recruiting Content`;
    const caption = ai.data.caption || "";
    const script = ai.data.script || "";
    const hashtags = Array.isArray(ai.data.hashtags) ? ai.data.hashtags : [];
    const notes = ai.data.notes || "";

    const insert = await pool.query(
      `
      insert into content_assets
      (
        campaign_id, title, content_type, platform, audience, city, hook,
        caption, script, cta, hashtags, status, source_prompt, ai_model, generation_notes
      )
      values
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,'draft',$12::jsonb,$13,$14)
      returning
        id,
        campaign_id as "campaignId",
        title,
        content_type as "contentType",
        platform,
        audience,
        city,
        caption,
        script,
        cta,
        hashtags,
        status,
        created_at as "createdAt"
      `,
      [
        campaignId,
        title,
        contentType,
        platform,
        audience,
        city,
        hook,
        caption,
        script,
        cta,
        JSON.stringify(hashtags),
        JSON.stringify({
          audience,
          city,
          platform,
          contentType,
          hook,
          cta,
        }),
        ai.model,
        notes,
      ]
    );

    res.json({
      ok: true,
      content: insert.rows[0],
      generated: {
        title,
        caption,
        script,
        cta,
        hashtags,
      },
    });
  } catch (err) {
    console.error("POST /brand/content/generate error:", err);
    res.status(500).json({
      ok: false,
      error: err.message || "Failed to generate content",
    });
  }
});

router.post("/content/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const q = await pool.query(
      `
      update content_assets
      set status = 'approved'
      where id = $1
      returning id, status, updated_at as "updatedAt"
      `,
      [id]
    );

    if (!q.rowCount) {
      return res.status(404).json({ ok: false, error: "Content not found" });
    }

    res.json({ ok: true, content: q.rows[0] });
  } catch (err) {
    console.error("POST /brand/content/:id/approve error:", err);
    res.status(500).json({ ok: false, error: "Failed to approve content" });
  }
});

router.post("/content/:id/schedule", async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledFor } = req.body || {};

    if (!scheduledFor) {
      return res.status(400).json({ ok: false, error: "scheduledFor is required" });
    }

    const q = await pool.query(
      `
      update content_assets
      set status = 'scheduled',
          scheduled_for = $2
      where id = $1
      returning id, status, scheduled_for as "scheduledFor", updated_at as "updatedAt"
      `,
      [id, scheduledFor]
    );

    if (!q.rowCount) {
      return res.status(404).json({ ok: false, error: "Content not found" });
    }

    res.json({ ok: true, content: q.rows[0] });
  } catch (err) {
    console.error("POST /brand/content/:id/schedule error:", err);
    res.status(500).json({ ok: false, error: "Failed to schedule content" });
  }
});

router.get("/leads", async (_req, res) => {
  try {
    const q = await pool.query(`
      select
        id,
        full_name as "fullName",
        email,
        phone,
        role_type as "roleType",
        specialty,
        city,
        source,
        status,
        notes,
        created_at as "createdAt",
        last_contacted_at as "lastContactedAt",
        next_follow_up_at as "nextFollowUpAt"
      from recruitment_leads
      order by created_at desc
      limit 200
    `);

    res.json(q.rows);
  } catch (err) {
    console.error("GET /brand/leads error:", err);
    res.status(500).json({ ok: false, error: "Failed to load leads" });
  }
});

router.get("/leads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const q = await pool.query(`
      select
        id,
        full_name as "fullName",
        email,
        phone,
        role_type as "roleType",
        specialty,
        city,
        source,
        status,
        notes,
        created_at as "createdAt",
        last_contacted_at as "lastContactedAt",
        next_follow_up_at as "nextFollowUpAt"
      from recruitment_leads
      where id = $1
    `, [id]);

    if (!q.rowCount) {
      return res.status(404).json({ ok: false, error: "Lead not found" });
    }

    res.json(q.rows[0]);
  } catch (err) {
    console.error("GET /brand/leads/:id error:", err);
    res.status(500).json({ ok: false, error: "Failed to load lead" });
  }
});

router.post("/leads", async (req, res) => {
  try {
    const {
      campaignId = null,
      fullName,
      email = null,
      phone = null,
      roleType,
      specialty = null,
      city = null,
      source = null,
      notes = null,
      status = "new",
    } = req.body || {};

    if (!fullName || !roleType) {
      return res.status(400).json({ ok: false, error: "fullName and roleType are required" });
    }

    const q = await pool.query(
      `
      insert into recruitment_leads
      (
        campaign_id, full_name, email, phone, role_type, specialty, city, source, notes, status
      )
      values
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      returning
        id,
        full_name as "fullName",
        email,
        phone,
        role_type as "roleType",
        specialty,
        city,
        source,
        status,
        notes,
        created_at as "createdAt"
      `,
      [campaignId, fullName, email, phone, roleType, specialty, city, source, notes, status]
    );

    res.json({ ok: true, lead: q.rows[0] });
  } catch (err) {
    console.error("POST /brand/leads error:", err);
    res.status(500).json({ ok: false, error: "Failed to create lead" });
  }
});

router.patch("/leads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const allowed = {
      status: "status",
      notes: "notes",
      nextFollowUpAt: "next_follow_up_at",
      next_follow_up_at: "next_follow_up_at",
      lastContactedAt: "last_contacted_at",
      last_contacted_at: "last_contacted_at",
    };
    const updates = [];
    const values = [];
    let i = 1;

    for (const [key, column] of Object.entries(allowed)) {
      if (body[key] !== undefined) {
        updates.push(`${column} = $${i++}`);
        values.push(body[key]);
      }
    }

    if (!updates.length) {
      return res.status(400).json({ ok: false, error: "No valid fields to update" });
    }

    values.push(id);

    const q = await pool.query(
      `
      update recruitment_leads
      set ${updates.join(", ")}
      where id = $${i}
      returning
        id,
        full_name as "fullName",
        email,
        phone,
        role_type as "roleType",
        specialty,
        city,
        source,
        status,
        notes,
        created_at as "createdAt",
        last_contacted_at as "lastContactedAt",
        next_follow_up_at as "nextFollowUpAt"
      `,
      values
    );

    if (!q.rowCount) {
      return res.status(404).json({ ok: false, error: "Lead not found" });
    }

    res.json({ ok: true, lead: q.rows[0] });
  } catch (err) {
    console.error("PATCH /brand/leads/:id error:", err);
    res.status(500).json({ ok: false, error: "Failed to update lead" });
  }
});

router.post("/leads/:id/followup", async (req, res) => {
  try {
    const { id } = req.params;
    const { messageText = "", channel = "system" } = req.body || {};

    const exists = await pool.query(`select id from recruitment_leads where id = $1`, [id]);
    if (!exists.rowCount) {
      return res.status(404).json({ ok: false, error: "Lead not found" });
    }

    const q = await pool.query(
      `
      insert into lead_interactions
      (lead_id, interaction_type, channel, direction, subject, message_text)
      values
      ($1, 'follow_up', $2, 'system', 'Automated follow-up', $3)
      returning id, created_at as "createdAt"
      `,
      [id, channel, messageText]
    );

    await pool.query(
      `
      update recruitment_leads
      set last_contacted_at = now()
      where id = $1
      `,
      [id]
    );

    res.json({ ok: true, interaction: q.rows[0] });
  } catch (err) {
    console.error("POST /brand/leads/:id/followup error:", err);
    res.status(500).json({ ok: false, error: "Failed to log follow-up" });
  }
});

router.get("/agent/tasks", async (_req, res) => {
  try {
    const q = await pool.query(
      `
      select
        id,
        mode,
        role,
        location,
        message,
        status,
        result,
        error_text as "errorText",
        started_at as "startedAt",
        completed_at as "completedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      from agent_tasks
      order by created_at desc
      limit 100
      `
    );

    res.json(q.rows);
  } catch (err) {
    console.error("GET /brand/agent/tasks error:", err);
    res.status(500).json({ ok: false, error: "Failed to load agent tasks" });
  }
});

router.post("/agent/tasks", async (req, res) => {
  try {
    const {
      mode = "strategy",
      role = "general",
      location = "Juneau, WI",
      message = "",
      runNow = false,
    } = req.body || {};

    const insert = await pool.query(
      `
      insert into agent_tasks (mode, role, location, message, status)
      values ($1, $2, $3, $4, 'queued')
      returning
        id,
        mode,
        role,
        location,
        message,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      `,
      [mode, role, location, message]
    );

    const task = insert.rows[0];

    if (!runNow) {
      return res.status(201).json({ ok: true, task });
    }

    try {
      await pool.query(
        `
        update agent_tasks
        set status = 'running',
            started_at = now()
        where id = $1
        `,
        [task.id]
      );

      const result = await generateAgentTaskResult({
        mode,
        role,
        location,
        message,
      });

      const updated = await pool.query(
        `
        update agent_tasks
        set status = 'completed',
            result = $2::jsonb,
            completed_at = now()
        where id = $1
        returning
          id,
          mode,
          role,
          location,
          message,
          status,
          result,
          error_text as "errorText",
          started_at as "startedAt",
          completed_at as "completedAt",
          created_at as "createdAt",
          updated_at as "updatedAt"
        `,
        [task.id, JSON.stringify(result)]
      );

      return res.status(201).json({ ok: true, task: updated.rows[0] });
    } catch (err) {
      const messageText = err instanceof Error ? err.message : String(err);
      await pool.query(
        `
        update agent_tasks
        set status = 'failed',
            error_text = $2,
            completed_at = now()
        where id = $1
        `,
        [task.id, messageText]
      );

      return res.status(201).json({
        ok: false,
        task: {
          ...task,
          status: "failed",
          errorText: messageText,
        },
      });
    }
  } catch (err) {
    console.error("POST /brand/agent/tasks error:", err);
    res.status(500).json({ ok: false, error: "Failed to create agent task" });
  }
});

router.patch("/agent/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ ok: false, error: "Invalid status" });
    }

    const q = await pool.query(
      `
      update agent_tasks
      set status = $2
      where id = $1
      returning
        id,
        mode,
        role,
        location,
        message,
        status,
        result,
        error_text as "errorText",
        started_at as "startedAt",
        completed_at as "completedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      `,
      [id, status]
    );

    if (!q.rowCount) {
      return res.status(404).json({ ok: false, error: "Agent task not found" });
    }

    res.json({ ok: true, task: q.rows[0] });
  } catch (err) {
    console.error("PATCH /brand/agent/tasks/:id error:", err);
    res.status(500).json({ ok: false, error: "Failed to update agent task" });
  }
});

router.get("/analytics", async (_req, res) => {
  try {
    const summary = await pool.query(`
      with lead_counts as (
        select count(*)::int as total_leads from recruitment_leads
      ),
      signed_counts as (
        select count(*)::int as signed_this_month
        from recruitment_leads
        where status = 'signed'
          and created_at >= date_trunc('month', now())
      ),
      cost_calc as (
        select coalesce(sum(cost), 0)::numeric as total_cost,
               coalesce(sum(leads), 0)::int as total_metric_leads
        from brand_metrics_daily
        where metric_date >= date_trunc('month', now())::date
      ),
      best_platform as (
        select platform
        from brand_metrics_daily
        group by platform
        order by sum(leads) desc, sum(clicks) desc
        limit 1
      ),
      best_audience as (
        select audience
        from content_assets
        where audience is not null and audience <> ''
        group by audience
        order by count(*) desc
        limit 1
      )
      select
        (select total_leads from lead_counts) as total_leads,
        case
          when (select total_metric_leads from cost_calc) > 0
            then round((select total_cost from cost_calc) / (select total_metric_leads from cost_calc), 2)
          else 0
        end as cost_per_lead,
        coalesce((select platform from best_platform), '—') as best_platform,
        coalesce((select audience from best_audience), '—') as best_audience,
        (select signed_this_month from signed_counts) as signed_this_month
    `);

    const row = summary.rows[0];

    res.json({
      totalLeads: row.total_leads,
      costPerLead: Number(row.cost_per_lead),
      bestPlatform: row.best_platform,
      bestAudience: row.best_audience,
      signedThisMonth: row.signed_this_month,
    });
  } catch (err) {
    console.error("GET /brand/analytics error:", err);
    res.status(500).json({ ok: false, error: "Failed to load analytics" });
  }
});

module.exports = router;
