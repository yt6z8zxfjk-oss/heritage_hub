import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    visitorId: { type: String, required: true, index: true },
    authorName: { type: String, required: true },
    text: { type: String, required: true },
    fromAdmin: { type: Boolean, default: false },
    oblast: { type: String, default: "gomel", index: true },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
