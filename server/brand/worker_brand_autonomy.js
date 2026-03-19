/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();
const pool = require("./db");
const { generateBrandContent } = require("./openai_brand");

const DEFAULT_TARGETS = [
  {
    audience: "Cosmetologist",
    city: "Beaver Dam, WI",
    platform: "Instagram",
    contentType: "post",
    hook: "Private suite, polished brand, better environment.",
  },
  {
    audience: "Nail Tech",
    city: "Juneau, WI",
    platform: "Facebook",
    contentType: "ad",
    hook: "Ready for a better booth rental opportunity?",
  },
];

async function markJob(id, status, errorText = null) {
  await pool.query(
    `
    update automation_jobs
    set status = $2,
        completed_at = case when $2 in ('completed','failed') then now() else completed_at end,
        error_text = $3
    where id = $1
    `,
    [id, status, errorText]
  );
}

async function generateContentBatch(payload = {}) {
  const brandName = process.env.BRAND_NAME || "Keeping It Cute Salon & Spa";
  const tagline = process.env.BRAND_TAGLINE || "Because You Deserve Better";
  const cta = process.env.BRAND_DEFAULT_CTA || "DM us BOOTH to learn more.";
  const targets = Array.isArray(payload.targets) && payload.targets.length ? payload.targets : DEFAULT_TARGETS;

  for (const target of targets) {
    const ai = await generateBrandContent({
      audience: target.audience,
      city: target.city,
      platform: target.platform,
      contentType: target.contentType,
      hook: target.hook,
      cta,
      brandName,
      tagline,
    });

    const title = ai.data.title || `${target.audience} recruiting`;
    const caption = ai.data.caption || "";
    const script = ai.data.script || "";
    const hashtags = Array.isArray(ai.data.hashtags) ? ai.data.hashtags : [];
    const notes = ai.data.notes || "";

    await pool.query(
      `
      insert into content_assets
      (
        title, content_type, platform, audience, city, hook,
        caption, script, cta, hashtags, status, source_prompt, ai_model, generation_notes
      )
      values
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,'draft',$11::jsonb,$12,$13)
      `,
      [
        title,
        target.contentType,
        target.platform,
        target.audience,
        target.city,
        target.hook,
        caption,
        script,
        cta,
        JSON.stringify(hashtags),
        JSON.stringify(target),
        ai.model,
        notes,
      ]
    );
  }
}

async function followUpStaleLeads(payload = {}) {
  const followupAfterDays = Number(payload.followup_after_days || 2);
  const messageText =
    payload.message_text ||
    "Hi! Just checking in to see if you'd like to book a tour and learn more about booth rental opportunities at Keeping It Cute Salon & Spa.";

  const leads = await pool.query(
    `
    select id
    from recruitment_leads
    where status in ('new','contacted','interested','tour_scheduled','interviewed')
      and coalesce(last_contacted_at, created_at) <= now() - ($1::text || ' days')::interval
    order by created_at asc
    limit 25
    `,
    [followupAfterDays]
  );

  for (const lead of leads.rows) {
    await pool.query(
      `
      insert into lead_interactions
      (lead_id, interaction_type, channel, direction, subject, message_text)
      values
      ($1, 'follow_up', 'system', 'system', 'Automated follow-up', $2)
      `,
      [lead.id, messageText]
    );

    await pool.query(
      `
      update recruitment_leads
      set last_contacted_at = now(),
          next_follow_up_at = now() + interval '2 days'
      where id = $1
      `,
      [lead.id]
    );
  }
}

async function runJob(job) {
  if (job.job_type === "generate_weekly_content") {
    await generateContentBatch(job.payload || {});
    return;
  }

  if (job.job_type === "follow_up_stale_leads") {
    await followUpStaleLeads(job.payload || {});
    return;
  }

  throw new Error(`Unsupported job_type: ${job.job_type}`);
}

async function run() {
  const dueJobs = await pool.query(
    `
    select id, job_type, payload
    from automation_jobs
    where status = 'pending'
      and run_at <= now()
    order by run_at asc
    limit 20
    `
  );

  if (!dueJobs.rowCount) {
    console.log("No due automation jobs.");
    return;
  }

  for (const job of dueJobs.rows) {
    try {
      await markJob(job.id, "running");
      await runJob(job);
      await markJob(job.id, "completed");
      console.log(`Completed automation job ${job.id} (${job.job_type})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await markJob(job.id, "failed", message);
      console.error(`Failed automation job ${job.id}:`, message);
    }
  }
}

run()
  .then(() => {
    console.log("Autonomy worker complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Autonomy worker fatal error:", err);
    process.exit(1);
  });
