import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
  {
    attraction: { type: Schema.Types.ObjectId, ref: "Attraction", required: true },
    authorName: { type: String, required: true },
    text: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    status: { type: String, enum: ["pending", "published"], default: "pending" },
  },
  { timestamps: true }
);

export const Review = mongoose.model("Review", reviewSchema);
