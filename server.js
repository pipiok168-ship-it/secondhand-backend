// server.js
// ===========================================
// 完整、乾淨版（Multer 多圖 images）
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

// =======================
// Middleware
// =======================
app.use(cors());
app.use(express.json());

// =======================
// MongoDB
// =======================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Mongo connected"))
  .catch(err => console.error("❌ Mongo error", err));

// =======================
// Model
// =======================
const ProductSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    description: String,
    imageUrls: [String],
  },
  { timestamps: true }
);

const Product = mongoose.model("products", ProductSchema);

// =======================
// Cloudinary
// =======================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =======================
// Multer（⭐ 重點：多圖 images）
// =======================
const upload = multer({
  storage: multer.memoryStorage(),
});

// =======================
// GET 商品列表
// =======================
app.get("/api/products", async (req, res) => {
  try {
    const list = await Product.find().sort({ _id: -1 });
    res.json(list);
  } catch (err) {
    console.error("🔥 get products error", err);
    res.status(500).json({ message: "get products failed" });
  }
});

// =======================
// POST 新增商品（✅ 多圖）
// =======================
app.post(
  "/api/products",
  upload.array("images", 10), // ⭐ 關鍵：欄位名 images
  async (req, res) => {
    try {
      console.log("📦 body =", req.body);
      console.log("🖼 files =", req.files?.length || 0);

      const { name, price, description } = req.body;

      if (!name || !price) {
        return res.status(400).json({ message: "缺少必要欄位" });
      }

      const imageUrls = [];

      for (const file of req.files || []) {
        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);

        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "secondhand_products" },
            (err, result) => (err ? reject(err) : resolve(result))
          );
          bufferStream.pipe(stream);
        });

        imageUrls.push(result.secure_url);
      }

      const product = await Product.create({
        name,
        price: Number(price),
        description: description || "",
        imageUrls,
      });

      res.json(product);
    } catch (err) {
      console.error("🔥 upload error", err);
      res.status(500).json({ message: "upload failed" });
    }
  }
);

// =======================
// Server start
// =======================
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
