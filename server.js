const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // ✅ 改這裡（重點）

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
   Admin（暫時寫死）
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

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") throw new Error();
    next();
  } catch {
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
    location: String,
    description: String,
    category: String,
    condition: String,
    brand: String,
    model: String,
    quantity: Number,
    city: String,
    district: String,
    phone: String,
    lineId: String,
    email: String,
    status: { type: String, default: "on" },
    tags: [String],
    views: { type: Number, default: 0 },
    sellerId: String,
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
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);

    cloudinary.uploader.upload_stream(
      { folder: "secondhand-app" },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    ).end(buffer);
  });
}

/* ===============================
   Public APIs
================================ */
app.get("/api/items", async (req, res) => {
  try {
    const { q, city, status, minPrice, maxPrice } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
        { brand: new RegExp(q, "i") },
        { model: new RegExp(q, "i") },
      ];
    }

    if (city) filter.city = city;
    if (status) filter.status = status;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const items = await Item.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/items/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    item.views += 1;
    await item.save();
    res.json(item);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

/* ===============================
   Admin APIs
================================ */
app.post(
  "/api/items",
  adminOnly,
  upload.array("images", 6),
  async (req, res) => {
    try {
      const { tags, price, quantity } = req.body;

      const images = [];
      for (const file of req.files || []) {
        const url = await uploadBufferToCloudinary(file.buffer);
        images.push(url);
      }

      const parsedTags =
        typeof tags === "string"
          ? tags.split(",").map(t => t.trim()).filter(Boolean)
          : [];

      const item = await Item.create({
        ...req.body,
        price: price ? Number(price) : undefined,
        quantity: quantity ? Number(quantity) : undefined,
        tags: parsedTags,
        images,
      });

      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

app.put("/api/items/:id", adminOnly, async (req, res) => {
  const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

app.delete("/api/items/:id", adminOnly, async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

/* ===============================
   Server
================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ secondhand-backend running on port ${PORT}`);
});
