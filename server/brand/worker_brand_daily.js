/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();
const pool = require("./db");
const { generateBrandContent } = require("./openai_brand");

async function run() {
  const brandName = process.env.BRAND_NAME || "Keeping It Cute Salon & Spa";
  const tagline = process.env.BRAND_TAGLINE || "Because You Deserve Better";
  const cta = process.env.BRAND_DEFAULT_CTA || "DM us BOOTH to learn more.";

  const targets = [
    {
      audience: "Cosmetologist",
      city: "Beaver Dam, WI",
      platform: "Instagram",
      contentType: "post",
      hook: "Because you deserve better.",
    },
    {
      audience: "Esthetician",
      city: "Juneau, WI",
      platform: "Facebook",
      contentType: "ad",
      hook: "Looking for a more polished beauty space?",
    },
    {
      audience: "Lash Artist",
      city: "Watertown, WI",
      platform: "Instagram",
      contentType: "reel",
      hook: "Ready for a salon space that matches your talent?",
    },
  ];

  for (const target of targets) {
    try {
      const ai = await generateBrandContent({
        ...target,
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

      console.log(`Generated content for ${target.audience} / ${target.city}`);
    } catch (err) {
      console.error(`Failed for ${target.audience} / ${target.city}:`, err.message);
    }
  }
}

run()
  .then(() => {
    console.log("Brand daily worker complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Brand daily worker fatal error:", err);
    process.exit(1);
  });
