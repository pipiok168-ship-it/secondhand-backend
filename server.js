console.log("🚀 RUNNING FROM:", __filename);
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
app.use(express.json()); // 只處理 JSON（圖片靠 multer）


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
    description: String
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
// 5. Multer（圖片用記憶體 Buffer）
// ===========================================
const storage = multer.memoryStorage();
const upload = multer({ storage });


// ===========================================
// 6. 取得商品列表
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
// 7. 新增商品（含圖片上傳）
// ===========================================
app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    console.log("===== 🟡 新商品請求進來 =====");
    console.log("📦 req.body =", req.body);
    console.log("🖼 req.file =", req.file ? req.file.originalname : "沒有圖片");

    let imageUrl = "";

    if (req.file) {
      console.log("🚀 開始上傳 Cloudinary");

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
              console.log("✅ Cloudinary URL =", result.secure_url);
              resolve(result);
            }
          }
        );
        bufferStream.pipe(stream);
      });

      imageUrl = uploadResult.secure_url;
    }

    const product = await Product.create({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description || "",
      imageUrl,
    });

    console.log("🎯 寫入完成 _id =", product._id);

    res.json(product);

  } catch (err) {
    console.log("🔥 /api/products 發生錯誤 =", err);
    res.status(500).json({ message: "Upload failed" });
  }
});


// ===========================================
// 8. 刪除商品（Android 用）
// 路徑：DELETE /api/products/:id
// ===========================================
app.delete("/api/products/:id", async (req, res) => {
  try {
    const id = req.params.id;

    console.log("🟥 收到刪除請求 =>", id);

    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      console.log("⚠ 找不到商品，無法刪除");
      return res.status(404).json({ message: "Product not found" });
    }

    console.log("🟢 已刪除 =>", deleted._id);

    res.json({
      message: "Deleted",
      id: deleted._id
    });

  } catch (err) {
    console.log("🔥 DELETE API 發生錯誤 =", err);
    res.status(500).json({ message: "Delete failed" });
  }
});


// ===========================================
// 9. 啟動服務
// ===========================================
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
