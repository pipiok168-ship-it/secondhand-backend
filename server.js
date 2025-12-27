// server.js
// ===========================================
// 1. 基本設定
// ===========================================
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json()); // 只會處理 JSON（圖片用 multer）


// ===========================================
// 2. MongoDB 連線
// ===========================================
const mongoUri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URL;

console.log("📌 使用的 Mongo 連線字串 =>", mongoUri);

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ Mongo connected"))
  .catch(err => console.log("❌ Mongo error", err));


// ===========================================
// 3. Mongoose 資料模型
// ===========================================
const ProductSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    imageUrl: String,
  },
  { timestamps: true }
);

const Product = mongoose.model("products", ProductSchema);


// ===========================================
// 4. Cloudinary 設定
// ===========================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("📌 Cloudinary 設定檢查：", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  hasKey: !!process.env.CLOUDINARY_API_KEY,
  hasSecret: !!process.env.CLOUDINARY_API_SECRET,
});


// ===========================================
// 5. Multer（記憶體模式，接收圖片 Buffer）
// ===========================================
const storage = multer.memoryStorage();
const upload = multer({ storage });


// ===========================================
// 6. API：取得商品列表（確認 DB 有沒有東西）
// ===========================================
app.get("/api/products", async (req, res) => {
  try {
    console.log("🟢 GET /api/products 收到請求");
    const products = await Product.find().sort({ _id: -1 });
    console.log("🟢 目前商品數量 =", products.length);
    res.json(products);
  } catch (err) {
    console.log("❌ 讀取商品列表錯誤 =", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});


// ===========================================
// 7. API：新增商品＋圖片（自動寫入 imageUrl）
// ===========================================
app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    console.log("===== 🟡 新商品請求進來 =====");
    console.log("📦 req.body =", req.body);
    console.log("🖼 req.file =", req.file ? req.file.originalname : "沒有收到圖片");

    let imageUrl = "";

    // 有圖片才上傳 Cloudinary
    if (req.file) {
      console.log("🚀 開始上傳到 Cloudinary...");

      const bufferStream = new Readable();
      bufferStream.push(req.file.buffer);
      bufferStream.push(null);

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "secondhand-products" },
          (err, result) => {
            if (err) {
              console.log("❌ Cloudinary 錯誤 =", err);
              reject(err);
            } else {
              console.log("✅ Cloudinary 回傳 URL =", result.secure_url);
              resolve(result);
            }
          }
        );

        bufferStream.pipe(stream);
      });

      imageUrl = uploadResult.secure_url;
    } else {
      console.log("⚠ 沒有圖片要上傳，imageUrl 將會是空字串");
    }

    const productData = {
      name: req.body.name,
      price: req.body.price,
      imageUrl,
    };

    console.log("📝 準備寫入資料庫 =", productData);

    const product = await Product.create(productData);

    console.log("🎯 寫入完成，_id =", product._id);
    res.json(product);
  } catch (err) {
    console.log("🔥 /api/products API 爆錯 =", err);
    res.status(500).json({ message: "Upload failed", error: err });
  }
});


// ===========================================
// 8. 啟動 Server
// ===========================================
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
