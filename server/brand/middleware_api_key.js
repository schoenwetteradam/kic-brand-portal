function requireInternalApiKey(req, res, next) {
  const expected = process.env.INTERNAL_API_KEY || process.env.PI_API_KEY || "";
  const provided = req.headers["x-api-key"];

  if (!expected) {
    return res.status(500).json({ ok: false, error: "INTERNAL_API_KEY not configured" });
  }

  if (!provided || provided !== expected) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  next();
}

module.exports = { requireInternalApiKey };
