import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
});

export const Category = mongoose.model("Category", categorySchema);
