insert into brand_templates (name, audience, content_type, platform, prompt_template, is_active)
values
(
  'kic_instagram_post_recruiting',
  'Cosmetologist',
  'post',
  'Instagram',
  'Create a recruiting social media post for {{audience}} in {{city}} for Keeping It Cute Salon & Spa. Brand tone: upscale, welcoming, professional, empowering. Include a strong hook, short caption, and CTA: {{cta}}. Mention booth rental or joining the salon team in a tasteful way.',
  true
),
(
  'kic_reel_script_recruiting',
  'Lash Artist',
  'reel',
  'Instagram',
  'Create a short-form reel script for recruiting a {{audience}} in {{city}} to join Keeping It Cute Salon & Spa. Include a 1-line hook, 4-6 shot ideas, brief voiceover or on-screen script, and CTA: {{cta}}.',
  true
),
(
  'kic_meta_ad_recruiting',
  'Esthetician',
  'ad',
  'Facebook',
  'Create a Meta ad for recruiting a {{audience}} in {{city}} to join Keeping It Cute Salon & Spa. Return headline, primary text, CTA text, and 3 short hook variants. Use a polished but local tone.',
  true
)
on conflict (name) do update
set
  audience = excluded.audience,
  content_type = excluded.content_type,
  platform = excluded.platform,
  prompt_template = excluded.prompt_template,
  is_active = excluded.is_active,
  updated_at = now();
