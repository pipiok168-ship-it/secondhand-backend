const express = require("express");
const router = express.Router();
const multer = require("multer");
const { Readable } = require("stream");
const cloudinary = require("cloudinary").v2;
const Product = require("../models/Product");

const upload = multer({ storage: multer.memoryStorage() });

// 取得商品列表
router.get("/", async (req, res) => {
  const list = await Product.find().sort({ _id: -1 });
  res.json(list);
});

// 新增商品（含圖片上傳）
router.post("/", upload.single("image"), async (req, res) => {
  try {
    let imageUrl = "";

    // 有圖片才上傳
    if (req.file) {
      const bufferStream = new Readable();
      bufferStream.push(req.file.buffer);
      bufferStream.push(null);

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "secondhand_products" },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        bufferStream.pipe(stream);
      });

      imageUrl = result.secure_url;
    }

    const product = await Product.create({
      name: req.body.name,
      price: req.body.price,
      imageUrl,
      description: req.body.description || ""
    });

    console.log("🟢 已寫入 Mongo =", product._id);

    res.json(product);

  } catch (err) {
    console.log("❌ 新增商品失敗 =", err);
    res.status(500).json({ message: "Create failed" });
  }
});

module.exports = router;
