const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

// 新增商品（單圖）
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, price, description } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "資料不完整" });
    }

    const product = {
      id: Date.now().toString(),
      name,
      price: Number(price),
      description: description || "",
      imageUrl: req.file
        ? `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
        : ""
    };

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 取得商品列表（暫時回空陣列，確保 API 正常）
router.get("/", (req, res) => {
  res.json([]);
});

module.exports = router;
