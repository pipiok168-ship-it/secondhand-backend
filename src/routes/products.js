const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// =======================
// 取得商品列表
// GET /api/products
// =======================
router.get("/", async (req, res) => {
  try {
    const list = await Product.find().sort({ _id: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Get products failed" });
  }
});

// =======================
// 新增商品（先不含圖片）
// POST /api/products
// =======================
router.post("/", async (req, res) => {
  try {
    const { name, price, imageUrl, description } = req.body;

    const product = new Product({
      name,
      price,
      imageUrl: imageUrl || "",
      description: description || ""
    });

    const saved = await product.save();
    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Create product failed" });
  }
});

// =======================
// 刪除商品（Android 用）
// DELETE /api/products/:id
// =======================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await Product.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;
