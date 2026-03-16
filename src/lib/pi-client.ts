const PI_BASE_URL = process.env.PI_BASE_URL;
const PI_API_KEY = process.env.PI_API_KEY;

async function piFetch(path: string) {
  if (!PI_BASE_URL) throw new Error("Missing PI_BASE_URL");
  if (!PI_API_KEY) throw new Error("Missing PI_API_KEY");

  const res = await fetch(`${PI_BASE_URL}${path}`, {
    headers: {
      "x-brand-api-key": PI_API_KEY,
      "content-type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PI request failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function getMetrics() {
  return piFetch("/brand/metrics");
}

export async function getTopServices() {
  return piFetch("/brand/top-services");
}

export async function getLowStock() {
  return piFetch("/brand/low-stock-products");
}
