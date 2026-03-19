import { NextResponse } from "next/server";

export const PI_BASE_URL =
  process.env.PI_API_BASE_URL || process.env.PI_BASE_URL || "";
export const PI_API_KEY = process.env.PI_API_KEY || "";

export function isPiConfigured() {
  return Boolean(PI_BASE_URL && PI_API_KEY);
}

export async function piRequest(path: string, options?: RequestInit) {
  if (!isPiConfigured()) {
    throw new Error("Pi not configured");
  }

  const res = await fetch(`${PI_BASE_URL}${path}`, {
    ...options,
    headers: {
      "x-api-key": PI_API_KEY,
      "content-type": "application/json",
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pi ${res.status}: ${text}`);
  }

  return res.json();
}

export function okJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
