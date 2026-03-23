const {
  fetchOpsSummary,
  mapMetrics,
  mapTopServices,
  mapLowStock,
  getOpsSummaryEndpoint,
} = require("./wix_staff_client");

const emptyMetrics = () => ({
  bookings_7d: 0,
  revenue_7d: 0,
  new_customers_7d: 0,
  top_staff: [],
});

const emptyTopServices = () => [];
const emptyLowStock = () => [];

/**
 * Salon dashboard JSON for the Next.js portal (pi-client.ts).
 * Mount after router.use(requireInternalApiKey) so x-api-key is enforced.
 * Tries Wix staff backend first; on failure returns zeros so dashboard always loads.
 */
function registerSalonDashboardRoutes(router) {
  router.get("/metrics", async (_req, res) => {
    const endpoint = getOpsSummaryEndpoint();
    try {
      const s = await fetchOpsSummary();
      return res.json({
        ...mapMetrics(s),
        salon_ops_available: true,
        salon_ops_status: "connected",
        salon_ops_source: "wix_staff_summary",
        salon_ops_error: null,
        salon_ops_endpoint: endpoint,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn("GET /brand/metrics fallback:", message);
      return res.json({
        ...emptyMetrics(),
        salon_ops_available: false,
        salon_ops_status: "fallback",
        salon_ops_source: "fallback_zero",
        salon_ops_error: message,
        salon_ops_endpoint: endpoint,
      });
    }
  });

  router.get("/top-services", async (_req, res) => {
    try {
      const s = await fetchOpsSummary();
      return res.json(mapTopServices(s));
    } catch (e) {
      console.warn("GET /brand/top-services fallback:", e.message || e);
      return res.json(emptyTopServices());
    }
  });

  router.get("/low-stock-products", async (_req, res) => {
    try {
      const s = await fetchOpsSummary();
      return res.json(mapLowStock(s));
    } catch (e) {
      console.warn("GET /brand/low-stock-products fallback:", e.message || e);
      return res.json(emptyLowStock());
    }
  });
}

module.exports = { registerSalonDashboardRoutes };
