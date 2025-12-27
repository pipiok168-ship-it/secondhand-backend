const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

let products = []; // 暫存用（之後可接 DB）

router.post("/", upload.single("image"), (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || !price || !req.file) {
      return res.status(400).json({ message: "資料不完整" });
    }

    const product = {
      id: Date.now().toString(),
      name,
      price: Number(price),
      imageUrl: `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
    };

    products.push(product);

    res.json({ ok: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", (req, res) => {
  res.json(products);
});

module.exports = router;
