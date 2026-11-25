import mongoose, { Schema } from "mongoose";

const attractionSchema = new Schema(
  {
    title: { type: String, required: true },
    titleEn: { type: String, default: "" },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    descriptionEn: { type: String, default: "" },
    history: { type: String, default: "" },
    historyEn: { type: String, default: "" },
    district: { type: String, default: "" },
    oblast: { type: String, default: "gomel", index: true },
    address: { type: String, required: true },
    addressEn: { type: String, default: "" },
    place: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    rating: { type: Number, min: 0, max: 5, default: null },
    workHours: { type: String, required: true },
    workHoursEn: { type: String, default: "" },
  },
  { timestamps: true }
);

attractionSchema.index({ location: "2dsphere" });

export const Attraction = mongoose.model("Attraction", attractionSchema);
