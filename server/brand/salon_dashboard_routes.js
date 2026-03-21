const { fetchOpsSummary, mapMetrics, mapTopServices, mapLowStock } = require("./wix_staff_client");

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
    try {
      const s = await fetchOpsSummary();
      return res.json({ ...mapMetrics(s), salon_ops_available: true });
    } catch (e) {
      console.warn("GET /brand/metrics fallback:", e.message || e);
      return res.json({ ...emptyMetrics(), salon_ops_available: false });
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
