/**
 * Meta Graph API client for posting to Instagram and Facebook.
 *
 * Required env vars:
 *   META_ACCESS_TOKEN      – long-lived page access token
 *   META_PAGE_ID           – Facebook Page ID
 *   INSTAGRAM_USER_ID      – Instagram Business Account ID
 */

const BASE = "https://graph.facebook.com/v19.0";

function token() {
  const t = process.env.META_ACCESS_TOKEN;
  if (!t) throw new Error("META_ACCESS_TOKEN not configured");
  return t;
}

export type MetaPostResult = {
  platform: "facebook" | "instagram";
  external_post_id: string;
  permalink?: string;
};

// ── Instagram ─────────────────────────────────────────────────────────────────

export async function postToInstagram(
  caption: string,
  imageUrl?: string
): Promise<MetaPostResult> {
  const igUserId = process.env.INSTAGRAM_USER_ID;
  if (!igUserId) throw new Error("INSTAGRAM_USER_ID not configured");

  // Step 1: Create media container
  const containerParams = new URLSearchParams({
    caption,
    access_token: token(),
    ...(imageUrl ? { image_url: imageUrl } : { media_type: "REELS" }),
  });

  const containerRes = await fetch(
    `${BASE}/${igUserId}/media?${containerParams}`,
    { method: "POST" }
  );
  if (!containerRes.ok) {
    const err = await containerRes.text();
    throw new Error(`Instagram media container failed: ${err}`);
  }
  const { id: creationId } = await containerRes.json();

  // Step 2: Publish
  const publishParams = new URLSearchParams({
    creation_id: creationId,
    access_token: token(),
  });
  const publishRes = await fetch(
    `${BASE}/${igUserId}/media_publish?${publishParams}`,
    { method: "POST" }
  );
  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`Instagram publish failed: ${err}`);
  }
  const { id: postId } = await publishRes.json();

  return {
    platform: "instagram",
    external_post_id: postId,
    permalink: `https://www.instagram.com/p/${postId}/`,
  };
}

// ── Facebook ──────────────────────────────────────────────────────────────────

export async function postToFacebook(
  message: string,
  link?: string
): Promise<MetaPostResult> {
  const pageId = process.env.META_PAGE_ID;
  if (!pageId) throw new Error("META_PAGE_ID not configured");

  const body: Record<string, string> = {
    message,
    access_token: token(),
  };
  if (link) body.link = link;

  const res = await fetch(`${BASE}/${pageId}/feed`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Facebook post failed: ${err}`);
  }

  const { id: postId } = await res.json();
  return {
    platform: "facebook",
    external_post_id: postId,
    permalink: `https://www.facebook.com/${postId}`,
  };
}

// ── Unified publish ───────────────────────────────────────────────────────────

export async function publishContent(opts: {
  platform: "instagram" | "facebook";
  caption: string;
  imageUrl?: string;
  link?: string;
}): Promise<MetaPostResult> {
  if (opts.platform === "instagram") {
    return postToInstagram(opts.caption, opts.imageUrl);
  }
  return postToFacebook(opts.caption, opts.link);
}

export function isMetaConfigured(): boolean {
  return !!(
    process.env.META_ACCESS_TOKEN &&
    (process.env.META_PAGE_ID || process.env.INSTAGRAM_USER_ID)
  );
}
