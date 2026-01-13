// src/routes/products.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const upload = require("../middlewares/upload");
const cloudinary = require("../utils/cloudinary");
const streamifier = require("streamifier");

// 取得商品列表
router.get("/", async (req, res) => {
  const list = await Product.find().sort({ _id: -1 });
  res.json(list);
});

// 新增商品（多張圖片）
router.post(
  "/",
  upload.array("images", 5), // 最多 5 張
  async (req, res) => {
    try {
      const { name, price, description } = req.body;

      if (!name || !price) {
        return res.status(400).json({ message: "name & price required" });
      }

      let imageUrls = [];

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "secondhand_products" },
              (err, result) => (err ? reject(err) : resolve(result))
            );
            streamifier.createReadStream(file.buffer).pipe(stream);
          });

          imageUrls.push(result.secure_url);
        }
      }

      const product = await Product.create({
        name,
        price: Number(price),
        description: description || "",
        imageUrls,
      });

      res.json(product);
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ message: "upload failed" });
    }
  }
);

// 刪除商品（你已 OK）
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "product not found" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "delete failed" });
  }
});

module.exports = router;
