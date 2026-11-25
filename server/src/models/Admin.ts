import mongoose, { Schema } from "mongoose";

const adminSchema = new Schema({
  login: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
});

export const Admin = mongoose.model("Admin", adminSchema);
