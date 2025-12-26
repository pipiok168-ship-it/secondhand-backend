const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// =======================
//  Mongo 連線
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
//  資料模型
// =======================
const ProductSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    imageUrl: String,
  },
  { timestamps: true }
);

const Product = mongoose.model("products", ProductSchema);


// =======================
//  Multer 記憶體暫存
// =======================
const upload = multer({ storage: multer.memoryStorage() });


// =======================
//  Cloudinary Upload Route
// =======================
const uploadRoute = require("./routes/upload");
app.use("/api/upload", uploadRoute);


// =======================
//  商品列表
// =======================
app.get("/api/products", async (req, res) => {
  const products = await Product.find().sort({ _id: -1 });
  res.json(products);
});


// =======================
//  新增商品（暫用 placeholder 圖片）
// =======================
app.post("/api/products", async (req, res) => {
  try {
    const { name, price, imageUrl } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "缺少資料" });
    }

    const product = await Product.create({
      name,
      price: Number(price),
      imageUrl: imageUrl || "https://via.placeholder.com/300"
    });

    res.json(product);

  } catch (e) {
    console.log("❌ Add product error", e);
    res.status(500).json({ message: "新增失敗" });
  }
});


// =======================
//  健康檢查
// =======================
app.get("/", (req, res) => {
  res.send("Secondhand backend running");
});


// =======================
//  啟動服務
// =======================
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
