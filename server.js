const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// =======================
//  1️⃣ Mongo 連線
// =======================
const mongoUri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URL;

console.log("📌 使用的 Mongo 連線字串 =>", mongoUri);

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ Mongo connected"))
  .catch(err => console.log("❌ Mongo error", err));

// =======================
//  2️⃣ 商品 Model
// =======================
const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  imageUrl: String,
}, { timestamps: true });

const Product = mongoose.model("products", ProductSchema);

// =======================
//  3️⃣ 取得商品列表
// =======================
app.get("/api/products", async (req, res) => {
  const items = await Product.find().sort({ _id: -1 });
  res.json(items);
});

// =======================
//  4️⃣ 新增商品
// =======================
app.post("/api/products", async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "缺少資料" });
    }

    const product = await Product.create({
      name,
      price: Number(price),
      imageUrl: "https://via.placeholder.com/300"
    });

    res.json(product);

  } catch (err) {
    console.log("❌ Add product error", err);
    res.status(500).json({ message: "新增失敗" });
  }
});

// =======================
//  5️⃣ 健康檢查
// =======================
app.get("/", (req, res) => {
  res.send("Secondhand backend running");
});

// =======================
//  6️⃣ 啟動服務
// =======================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("🚀 Backend running on port", PORT);
});
