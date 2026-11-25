import mongoose, { Schema } from "mongoose";

const photoSchema = new Schema({
  attraction: { type: Schema.Types.ObjectId, ref: "Attraction", required: true },
  url: { type: String, required: true },
  alt: { type: String, required: true },
});

export const Photo = mongoose.model("Photo", photoSchema);
