import express from "express";
import {
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  proposeMeeting,
  acceptMeeting,
  declineMeeting,
  bookMeeting,
} from "../controllers/meetingController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, getMeetings);
router.post("/", authMiddleware, createMeeting);
router.put("/:id", authMiddleware, updateMeeting);
router.delete("/:id", authMiddleware, deleteMeeting);
router.post("/propose", authMiddleware, proposeMeeting); // Add propose meeting route
router.put("/:id/accept", authMiddleware, acceptMeeting); // Add accept meeting route
router.put("/:id/decline", authMiddleware, declineMeeting); // Add decline meeting route
router.post("/book", bookMeeting); // Add route to book meetings

export default router;
