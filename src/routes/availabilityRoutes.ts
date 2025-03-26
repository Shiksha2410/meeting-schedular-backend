import express from "express";
import {
  setAvailability,
  getAvailability,
  getAvailableSlots,
  generateBookingLink,
} from "../controllers/availabilityController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, setAvailability);
router.get("/", authMiddleware, getAvailability);
router.get("/booking-link", authMiddleware, generateBookingLink); // Ensure this route is defined before the dynamic route
router.get("/:day", authMiddleware, getAvailableSlots); // Use ':day' instead of ':date'

export default router;
