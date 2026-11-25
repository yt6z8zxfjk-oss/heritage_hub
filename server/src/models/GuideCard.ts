import mongoose, { Schema } from "mongoose";

const guideCardSchema = new Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  titleEn: { type: String, default: "" },
  text: { type: String, required: true },
  textEn: { type: String, default: "" },
  photo: { type: String, required: true },
  kind: { type: String, required: true, enum: ["district", "category", "search", "anchor"] },
  target: { type: String, required: true },
  order: { type: Number, required: true, default: 0 },
  oblast: { type: String, default: "gomel", index: true },
});

export const GuideCard = mongoose.model("GuideCard", guideCardSchema);
