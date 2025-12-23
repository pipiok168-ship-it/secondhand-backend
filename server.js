const express = require("express");
const cors = require("cors");

const app = express();

// ===== 中介層 =====
app.use(cors());
app.use(express.json());

// ===== 暫存商品資料（不接 DB）=====
let products = [];

// ===== 健康檢查 =====
app.get("/", (req, res) => {
  res.send("Secondhand backend running");
});

// ===== 新增商品 =====
app.post("/api/products", (req, res) => {
  const { name, price, description } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      message: "name and price are required",
    });
  }

  const product = {
    _id: Date.now().toString(),
    name,
    price,
    description: description || "",
    imageUrl: null,
    createdAt: new Date(),
  };

  products.push(product);

  res.status(201).json(product);
});

// ===== 取得商品列表 =====
app.get("/api/products", (req, res) => {
  res.json(products);
});

// ===== 啟動伺服器 =====
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});

