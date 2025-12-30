const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, default: "" },
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("products", ProductSchema);
