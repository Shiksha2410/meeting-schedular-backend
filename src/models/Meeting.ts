import mongoose from "mongoose";

const MeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true }, // Ensure this is a valid Date type
  time: { type: String, required: true }, // Ensure this is a valid time string (e.g., "10:30")
  name: { type: String, required: true }, // Ensure this is required
  email: { type: String, required: true }, // Ensure this is required
  notes: { type: String }, // Optional field
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Ensure organizer is required
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["proposed", "accepted", "declined"], default: "proposed" },
});

export const Meeting = mongoose.model("Meeting", MeetingSchema);
