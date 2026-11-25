import mongoose, { Schema } from "mongoose";

const storySchema = new Schema({
  slug: { type: String, required: true, unique: true },
  era: { type: String, required: true },
  eraEn: { type: String, default: "" },
  title: { type: String, required: true },
  titleEn: { type: String, default: "" },
  lead: { type: String, required: true },
  leadEn: { type: String, default: "" },
  body: { type: String, required: true },
  bodyEn: { type: String, default: "" },
  photo: { type: String, required: true },
  oblast: { type: String, default: "gomel", index: true },
  order: { type: Number, required: true, default: 0 },
});

export const Story = mongoose.model("Story", storySchema);
