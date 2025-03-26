import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  timeZone: { type: String, default: "Asia/Kolkata" }, // Use a valid IANA time zone name
});

export const User = mongoose.model("User", UserSchema);
