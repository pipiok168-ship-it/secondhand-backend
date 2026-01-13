const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    // ✅ 多張圖片（對齊 routes/products.js）
    imageUrls: {
      type: [String],
      default: [],
    },

    // ✅ 未來擴充：問與答（先放好，不影響現在）
    qa: [
      {
        question: String,
        answer: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    strict: true, // 明確，避免 Linux / Atlas 行為差異
  }
);

module.exports = mongoose.model("Product", ProductSchema);
