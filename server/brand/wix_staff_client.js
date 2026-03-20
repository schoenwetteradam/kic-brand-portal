/**
 * Calls the Wix staff backend (e.g. Docker on :4000) /internal/ops/summary.
 * Shape of JSON may vary — mapping helpers accept several common key names.
 */
const DEFAULT_BASE = "http://127.0.0.1:4000";

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function fetchOpsSummary() {
  const base = (process.env.WIX_STAFF_API_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
  const token = process.env.WIX_STAFF_API_TOKEN || "";
  if (!token) {
    throw new Error("WIX_STAFF_API_TOKEN is not set");
  }
  const url = `${base}/internal/ops/summary`;
  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix ops/summary failed: ${res.status} ${text}`);
  }
  return res.json();
}

function mapMetrics(s) {
  const o = s && typeof s === "object" ? s : {};
  return {
    bookings_7d: num(o.bookings_7d ?? o.bookings7d ?? o.bookings_7_days),
    revenue_7d: num(o.revenue_7d ?? o.revenue7d ?? o.revenue_7_days),
    new_customers_7d: num(o.new_customers_7d ?? o.newCustomers7d ?? o.new_customers_7_days),
    top_staff: Array.isArray(o.top_staff)
      ? o.top_staff
      : Array.isArray(o.topStaff)
        ? o.topStaff
        : [],
  };
}

function mapTopServices(s) {
  const o = s && typeof s === "object" ? s : {};
  const list =
    o.top_services ?? o.topServices ?? o.services ?? (Array.isArray(o) ? o : []);
  return Array.isArray(list) ? list : [];
}

function mapLowStock(s) {
  const o = s && typeof s === "object" ? s : {};
  const list =
    o.low_stock ?? o.lowStock ?? o.low_stock_products ?? o.lowStockProducts ?? [];
  return Array.isArray(list) ? list : [];
}

module.exports = {
  fetchOpsSummary,
  mapMetrics,
  mapTopServices,
  mapLowStock,
};
