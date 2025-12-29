const express = require("express");
const router = express.Router();
const multer = require("multer");
const { Readable } = require("stream");
const cloudinary = require("cloudinary").v2;
const Product = require("../models/Product"); // 如果你目前放在別處告訴我

const upload = multer({ storage: multer.memoryStorage() });


// ==========================
// 取得商品列表
// ==========================
router.get("/", async (req, res) => {
  const list = await Product.find().sort({ _id: -1 });
  res.json(list);
});


// ==========================
// 新增商品（含圖片上傳）
// ==========================
router.post("/", upload.single("image"), async (req, res) => {
  try {
    let imageUrl = "";

    if (req.file) {
      const bufferStream = new Readable();
      bufferStream.push(req.file.buffer);
      bufferStream.push(null);

      const uploadRes = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "secondhand_products" },
          (err, result) => (err ? reject(err) : resolve(result))
        ).end(req.file.buffer);
      });

      imageUrl = uploadRes.secure_url;
    }

    const product = await Product.create({
      name: req.body.name,
      price: req.body.price,
      imageUrl,
      description: req.body.description || ""
    });

    res.json(product);

  } catch (err) {
    console.log("POST ERR =>", err);
    res.status(500).json({ message: "Create failed" });
  }
});


// ==========================
// 刪除商品
// ==========================
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "Not found" });

    res.json({
      message: "Deleted",
      id: deleted._id
    });

  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});


module.exports = router;
