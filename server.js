const express = require("express");
const app = express();

app.use(express.json());

// API
app.use("/api/upload", require("./routes/upload"));

// 👇 加這段
app.get("/", (req, res) => {
  res.send("Secondhand backend running");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Backend running on", PORT);
});
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  res.json({
    ok: true,
    filename: req.file.originalname,
    size: req.file.size,
  });
});
