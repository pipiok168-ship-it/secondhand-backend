const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");
const Product = require("../models/Product"); // 若你沒有 models，下面有備註

// =======================
// Multer（記憶體）
// =======================
const upload = multer({ storage: multer.memoryStorage() });

// =======================
// 新增商品（單張圖片）
// POST /api/products
// =======================
router.post("/", upload.single("image"), async (req, res) => {
  try {
    console.log("🟡 POST /api/products");
    console.log("body =", req.body);
    console.log("file =", req.file ? req.file.originalname : "no image");

    const { name, price, description } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "缺少 name 或 price" });
    }

    let imageUrl = "";

    if (req.file) {
      const bufferStream = new Readable();
      bufferStream.push(req.file.buffer);
      bufferStream.push(null);

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "secondhand-products" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
        bufferStream.pipe(stream);
      });

      imageUrl = uploadResult.secure_url;
    }

    const product = await Product.create({
      name,
      price: Number(price),
      description: description || "",
      imageUrl
    });

    res.json(product);
  } catch (err) {
    console.error("❌ 新增商品失敗", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =======================
// 取得商品列表
// GET /api/products
// =======================
router.get("/", async (req, res) => {
  try {
    const list = await Product.find().sort({ _id: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
});

module.exports = router;
