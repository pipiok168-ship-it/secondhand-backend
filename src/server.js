// src/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

/* ===== 基本中介 ===== */
app.use(cors());
app.use(express.json());

/* ===== 健康檢查（超重要）===== */
app.get("/", (req, res) => {
  res.json({ ok: true });
});

/* ===== Mongo ===== */
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("❌ MONGO_URI not set");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ Mongo connected"))
  .catch(err => {
    console.error("❌ Mongo error", err);
    process.exit(1);
  });

/* ===== Routes ===== */
const productRoutes = require("./routes/products");
app.use("/api/products", productRoutes);

/* ===== Port ===== */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
