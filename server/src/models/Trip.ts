import mongoose, { Schema } from "mongoose";

const tripSchema = new Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  titleEn: { type: String, default: "" },
  lead: { type: String, required: true },
  leadEn: { type: String, default: "" },
  stops: { type: [String], required: true },
  cafeTitle: { type: String, required: true },
  cafeTitleEn: { type: String, default: "" },
  cafeNote: { type: String, required: true },
  cafeNoteEn: { type: String, default: "" },
  cafeLat: { type: Number, required: true },
  cafeLng: { type: Number, required: true },
  order: { type: Number, required: true, default: 0 },
  oblast: { type: String, default: "gomel", index: true },
});

export const Trip = mongoose.model("Trip", tripSchema);
