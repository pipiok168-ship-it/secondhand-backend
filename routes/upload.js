cat > routes/upload.js <<'EOF'
const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "沒有收到圖片" });
    }

    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "secondhand_products" },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
      bufferStream.pipe(stream);
    });

    res.json({ url: uploadResult.secure_url });

  } catch (err) {
    console.log("❌ Upload error", err);
    res.status(500).json({ message: "上傳失敗" });
  }
});

module.exports = router;
EOF
