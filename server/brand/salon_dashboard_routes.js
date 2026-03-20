const { fetchOpsSummary, mapMetrics, mapTopServices, mapLowStock } = require("./wix_staff_client");

/**
 * Salon dashboard JSON for the Next.js portal (pi-client.ts).
 * Mount after router.use(requireInternalApiKey) so x-api-key is enforced.
 */
function registerSalonDashboardRoutes(router) {
  router.get("/metrics", async (_req, res) => {
    try {
      const s = await fetchOpsSummary();
      res.json(mapMetrics(s));
    } catch (e) {
      console.error("GET /brand/metrics", e);
      res.status(502).json({ ok: false, error: String(e.message || e) });
    }
  });

  router.get("/top-services", async (_req, res) => {
    try {
      const s = await fetchOpsSummary();
      res.json(mapTopServices(s));
    } catch (e) {
      console.error("GET /brand/top-services", e);
      res.status(502).json({ ok: false, error: String(e.message || e) });
    }
  });

  router.get("/low-stock-products", async (_req, res) => {
    try {
      const s = await fetchOpsSummary();
      res.json(mapLowStock(s));
    } catch (e) {
      console.error("GET /brand/low-stock-products", e);
      res.status(502).json({ ok: false, error: String(e.message || e) });
    }
  });
}

module.exports = { registerSalonDashboardRoutes };
