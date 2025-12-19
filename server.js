const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   Debug ENV (超重要)
================================ */
console.log("ENV CHECK:", {
  CLOUD_NAME: !!process.env.CLOUD_NAME,
  CLOUD_KEY: !!process.env.CLOUD_KEY,
  CLOUD_SECRET: !!process.env.CLOUD_SECRET,
  JWT_SECRET: !!process.env.JWT_SECRET,
  MONGO_URI: !!process.env.MONGO_URI,
});

/* ===============================
   MongoDB
================================ */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ Mongo error:", err));

/* ===============================
   Cloudinary
================================ */
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

/* ===============================
   Multer
================================ */
const upload = multer({ storage: multer.memoryStorage() });

/* ===============================
   Admin
================================ */
const ADMIN = {
  username: "admin",
  passwordHash: bcrypt.hashSync("123456", 10),
};

/* ===============================
   JWT Middleware
================================ */
function adminOnly(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") throw new Error();
    next();
  } catch (err) {
    console.error("JWT ERROR:", err);
    res.status(401).json({ error: "Invalid token" });
  }
}

/* ===============================
   Admin Login
================================ */
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username !== ADMIN.username ||
    !bcrypt.compareSync(password, ADMIN.passwordHash)
  ) {
    return res.status(401).json({ error: "帳號或密碼錯誤" });
  }

  const token = jwt.sign(
    { role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token });
});

/* ===============================
   Item Schema
================================ */
const itemSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    description: String,
    images: [String],
  },
  { timestamps: true }
);

const Item = mongoose.model("Item", itemSchema);

/* ===============================
   Cloudinary Upload Helper
================================ */
function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "secondhand-app" },
      (err, result) => {
        if (err) {
          console.error("❌ Cloudinary error:", err);
          return reject(err);
        }
        resolve(result.secure_url);
      }
    ).end(buffer);
  });
}

/* ===============================
   ADD ITEM (防爆版)
================================ */
app.post(
  "/api/items",
  adminOnly,
  upload.array("images", 6),
  async (req, res) => {
    try {
      console.log("=== ADD ITEM START ===");
      console.log("BODY:", req.body);
      console.log("FILES:", req.files?.length);

      const images = [];

      for (const file of req.files || []) {
        console.log("Uploading image, size:", file.buffer.length);
        const url = await uploadBufferToCloudinary(file.buffer);
        images.push(url);
      }

      const item = await Item.create({
        name: req.body.name,
        price: Number(req.body.price),
        description: req.body.description,
        images,
      });

      console.log("✅ ITEM CREATED:", item._id);
      res.json(item);
    } catch (err) {
      console.error("🔥 ADD ITEM FAILED:", err);
      res.status(500).json({
        error: err.message || err.toString(),
      });
    }
  }
);

/* ===============================
   Server
================================ */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ secondhand-backend running on port ${PORT}`);
});
