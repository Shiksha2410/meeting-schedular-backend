import express from "express";
import { getAvailableSlots, bookMeeting, getMeetingDetails } from "../controllers/bookingController";

const router = express.Router();

router.get("/availability/:date", getAvailableSlots); // Get available time slots for a date
router.post("/book", bookMeeting); // Allow anonymous users to book a meeting
router.get("/meeting/:id", getMeetingDetails); // Get meeting details for confirmation

export default router;
