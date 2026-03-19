/* eslint-disable @typescript-eslint/no-require-imports */
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function generateBrandContent({
  audience,
  city,
  platform,
  contentType,
  hook,
  cta,
  brandName,
  tagline,
}) {
  const model = process.env.OPENAI_MODEL || "gpt-5";

  const prompt = `
You are a beauty-industry recruiting marketer.

Generate marketing content for:
Brand: ${brandName}
Tagline: ${tagline}
Audience: ${audience}
City/Area: ${city}
Platform: ${platform}
Content Type: ${contentType}
Hook/Theme: ${hook}
CTA: ${cta}

Target goal:
Recruit high-quality beauty professionals to rent a booth or join the salon environment at Keeping It Cute Salon & Spa.

Return ONLY valid JSON with this shape:
{
  "title": "string",
  "caption": "string",
  "script": "string",
  "cta": "string",
  "hashtags": ["string","string","string"],
  "notes": "string"
}

Rules:
- Tone: upscale, welcoming, ambitious, polished, local
- Avoid sounding spammy
- Mention the opportunity in a tasteful, attractive way
- Keep caption platform-ready
- For non-video content, script can be an empty string
- Hashtags should be relevant to salon recruiting and local beauty business growth
`;

  const response = await client.responses.create({
    model,
    input: prompt,
  });

  const text = response.output_text || "";
  const parsed = safeJsonParse(text);

  if (!parsed) {
    throw new Error(`Model returned non-JSON output: ${text.slice(0, 500)}`);
  }

  return {
    model,
    rawText: text,
    data: parsed,
  };
}

module.exports = {
  generateBrandContent,
};
