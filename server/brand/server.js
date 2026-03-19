/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

const brandRoutes = require("./routes_brand");
app.use("/brand", brandRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Brand API listening on ${port}`);
});
