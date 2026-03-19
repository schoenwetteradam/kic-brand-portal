import type { GenerateContentRequest } from "@/src/types/brand";

export const ROLE_LABELS: Record<string, string> = {
  cosmetologist: "cosmetologists",
  esthetician: "estheticians",
  massage_therapist: "massage therapists",
  lash_artist: "lash artists",
  nail_tech: "nail technicians",
  general: "beauty professionals",
};

export const ROLE_LABEL_SINGULAR: Record<string, string> = {
  cosmetologist: "cosmetologist",
  esthetician: "esthetician",
  massage_therapist: "massage therapist",
  lash_artist: "lash artist",
  nail_tech: "nail tech",
  general: "beauty professional",
};

const THEME_HOOKS: Record<string, string[]> = {
  "private suite": [
    "Your space. Your clients. Your rules.",
    "Private suite vibes inside a supportive salon family.",
    "Finally — a space that feels like yours.",
    "A booth that's actually a sanctuary.",
  ],
  "be your own boss": [
    "Run your own book. Set your own hours.",
    "Independent but never alone.",
    "Your business. Our space.",
    "The freedom you've been building toward.",
  ],
  "grow your clientele": [
    "Ready to grow? We've got the traffic.",
    "Join a brand people already love.",
    "High-traffic location. Your clients.",
    "Walk into a room that already has fans.",
  ],
  "upscale environment": [
    "Elevate your brand. Elevate your space.",
    "Modern salon. Serious professionals.",
    "This isn't just a booth. It's your brand home.",
    "Where your professionalism finally matches your space.",
  ],
  "community and culture": [
    "Beauty is better together.",
    "The salon community you've always wanted.",
    "Collaborative culture. Individual success.",
    "Success doesn't have to be lonely.",
  ],
  "flexible lease": [
    "Booth rental terms built for your real life.",
    "Flexible lease. Consistent clients.",
    "No long-term lock-in. Just long-term growth.",
  ],
  default: [
    "Now leasing beauty booths in Dodge County.",
    "Is your next chapter at Keeping It Cute?",
    "Beautiful space. Incredible community.",
    "The booth you've been looking for.",
  ],
};

export function getHook(theme: string): string {
  const options = THEME_HOOKS[theme] ?? THEME_HOOKS.default;
  return options[Math.floor(Math.random() * options.length)];
}

export function buildOpenAIPrompt(req: GenerateContentRequest): string {
  const role = ROLE_LABELS[req.audience] ?? "beauty professionals";
  const hook = getHook(req.theme);

  return `You are a marketing copywriter for Keeping It Cute (KIC), a modern upscale salon in ${req.location}, Dodge County, Wisconsin. Your goal is to generate compelling recruiting content to attract ${role} as booth renters.

Brand voice: ${req.tone}
Campaign theme: ${req.theme}
Content type: ${req.content_type.replace(/_/g, " ")}
Platform: ${req.platform}
Call to action: ${req.cta}${req.offer ? `\nSpecial offer: ${req.offer}` : ""}

Opening hook to build from: "${hook}"

Salon key selling points:
- Private, beautifully designed booth/suite spaces
- Flexible scheduling and lease terms
- Supportive community of experienced beauty professionals
- Established local brand with strong walk-in traffic
- Modern booking systems and salon management tools
- Located in Dodge County, WI — serving Juneau, Beaver Dam, Watertown, and surrounding areas
- Upscale, clean, professional environment

Return ONLY a valid JSON object — no markdown, no extra text:
{
  "title": "short descriptive content title (max 60 chars)",
  "caption": "full post caption with emojis and line breaks where appropriate",
  "hashtags": ["array", "of", "10-15", "relevant", "hashtags", "no", "pound", "sign"],
  "cta": "clear call to action phrase",
  "script": "full video script with hook, body, and CTA (only if content_type is reel_script, otherwise empty string)"
}`;
}

export function buildFallbackContent(req: GenerateContentRequest) {
  const role = ROLE_LABELS[req.audience] ?? "beauty professionals";
  const singular = ROLE_LABEL_SINGULAR[req.audience] ?? "beauty professional";
  const loc = req.location || "Dodge County";

  const captions: Record<string, string> = {
    post: `✨ Calling all ${role} in ${loc}!\n\nKeeping It Cute has booth spaces available — and we want YOU.\n\nPrivate space. Flexible schedule. A salon community that actually has your back.\n\n📍 Located in Dodge County, WI\n💼 Booth rental terms that work for your life\n🌟 Upscale environment, real community\n\n${req.cta}`,

    reel_script: `[HOOK — 0:00–0:03]
"${role} in ${loc} — is this your sign?"

[SCENE — 0:03–0:08]
(Show salon interior: clean stations, good lighting, products, signage)

[VOICEOVER — 0:08–0:20]
"At Keeping It Cute, we rent booth spaces to independent ${role} who want to run their own business — without the overhead of owning a salon."

[SCENE — 0:20–0:28]
(Show a stylist working with a happy client, organized station, KIC logo)

[VOICEOVER — 0:28–0:38]
"Private space. Flexible hours. A brand your clients will love walking into. Located right here in Dodge County."

[CTA — 0:38–0:45]
"${req.cta}"
(Show contact info / link in bio)

[END CARD]
DM us 'BOOTH' | Link in bio | Keeping It Cute Salon`,

    ad_copy: `Headline: Booth Rentals Available — Keeping It Cute Salon

Primary Text:
Are you a ${singular} ready for real independence? Rent a booth at Keeping It Cute in ${loc} and build the business you've always wanted.

✅ Private, modern booth space
✅ Flexible scheduling
✅ Walk-in traffic from an established brand
✅ Supportive salon community
✅ Dodge County's most welcoming beauty home

${req.cta}

CTA Button: Apply Now`,

    email_template: `Subject: A booth space with your name on it — Keeping It Cute

Hi [Name],

I wanted to personally reach out because we have booth space opening up at Keeping It Cute and think you'd be a wonderful fit.

We're an upscale, modern salon in ${loc}, Dodge County — and we support independent ${role} who want to grow their own clientele in a professional, beautiful space.

Here's what comes with your booth:
• Private, fully equipped station in an upscale salon
• Flexible weekly or monthly lease options
• Real walk-in traffic and brand visibility
• A supportive community of experienced pros
• No hidden fees — straightforward terms

If you've been thinking about booth rental, or if you're ready for a better environment, I'd love to chat.

${req.cta}

Warm regards,
The KIC Team
Keeping It Cute Salon | ${loc}, WI`,

    dm_template: `Hey [Name]! Your work is beautiful 🙌 We have booth space opening up at Keeping It Cute in ${loc} and think you'd be a perfect fit for our team. Would love to tell you more — want to grab a quick call or pop in for a tour?`,

    landing_page_copy: `# Your Booth Is Waiting

## Booth Rentals at Keeping It Cute — ${loc}, WI

Are you a ${singular} ready to take real control of your career?

Keeping It Cute is a modern, upscale salon in Dodge County offering private booth rentals for independent beauty professionals who want to grow — without going it completely alone.

---

### What's Included With Your Booth

- **Private, beautifully designed station** in a professional environment
- **Flexible lease terms** — weekly or monthly, built around your life
- **Salon-level foot traffic** from an established local brand
- **Modern booking and scheduling systems**
- **Supportive community** of experienced beauty professionals
- **Clean, upscale space** your clients will love

---

### Who We're Looking For

Experienced ${role} who are ready to build their own clientele, set their own hours, and run their own business — with the support and visibility of an established salon brand behind them.

---

### Locations
Serving Juneau, Beaver Dam, Watertown, and the greater Dodge County area.

---

### ${req.cta}

[Apply for a Booth →]
[Schedule a Tour →]
[Contact Us Directly →]`,
  };

  const caption = captions[req.content_type] ?? captions.post;
  const isReel = req.content_type === "reel_script";

  return {
    title: `${singular.charAt(0).toUpperCase() + singular.slice(1)} Recruiting — ${loc}`,
    caption: isReel ? "" : caption,
    script: isReel ? caption : "",
    hashtags: [
      "KeepingItCute",
      "KICSalon",
      "BoothRental",
      "BeautyPros",
      "SalonLife",
      loc.replace(/\s+/g, ""),
      "DodgeCounty",
      "WisconsinSalon",
      singular.replace(/\s+/g, ""),
      "IndependentBeautyPro",
      "BoothRenter",
      "SalonBooth",
      "BeautyBusiness",
    ],
    cta: req.cta,
  };
}
