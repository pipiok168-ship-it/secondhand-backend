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
   Static
================================ */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
   Multer (memory)
================================ */
const upload = multer({ storage: multer.memoryStorage() });

/* ===============================
   Admin（寫死帳號）
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
  if (!auth) {
    console.log("❌ No Authorization header");
    return res.status(401).json({ error: "No token" });
  }

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") throw new Error("Not admin");
    next();
  } catch (err) {
    console.log("❌ JWT error:", err.message);
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
    status: { type: String, default: "on" },
  },
  { timestamps: true }
);

const Item = mongoose.model("Item", itemSchema);

/* ===============================
   Cloudinary Upload Helper（防爆）
================================ */
function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "secondhand-app" },
      (err, result) => {
        if (err) {
          console.log("❌ Cloudinary error:", err);
          reject(err);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    stream.end(buffer);
  });
}

/* ===============================
   新增商品（含圖片）
================================ */
app.post(
  "/api/items",
  adminOnly,
  upload.array("images", 6),
  async (req, res) => {
    try {
      console.log("📦 Body:", req.body);
      console.log("🖼 Files:", req.files?.length || 0);

      const { name, price, description } = req.body;

      if (!name || !price) {
        return res.status(400).json({ error: "name / price required" });
      }

      const images = [];
      for (const file of req.files || []) {
        const url = await uploadBufferToCloudinary(file.buffer);
        images.push(url);
      }

      const item = await Item.create({
        name,
        price: Number(price),
        description,
        images,
      });

      console.log("✅ Item created:", item._id);
      res.json(item);
    } catch (err) {
      console.log("❌ Add item error:", err);
      res.status(500).json({ error: "Server error" });
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
