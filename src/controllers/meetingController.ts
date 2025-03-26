import { Request, Response } from "express";
import { Meeting } from "../models/Meeting";
import { Availability } from "../models/Availability"; // Add missing import
import { UserDocument } from "../types/express"; // Import UserDocument from the types file

interface AuthenticatedRequest extends Request {
  user?: UserDocument; // Use the UserDocument type from the types file
}

export const getMeetings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    

    const meetings = await Meeting.find()
      .populate("organizer", "name email timeZone")
      .populate("participants", "name email timeZone");

  

    // Adjust meeting times for the user's time zone
    const adjustedMeetings = meetings.map((meeting) => {
      const userTimeZone = req.user?.timeZone || "UTC";
      const meetingDate = new Date(meeting.date);

      // Validate and use a fallback time zone if invalid
      const validTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone === userTimeZone
        ? userTimeZone
        : "UTC";

      const adjustedDate = meetingDate.toLocaleString("en-US", { timeZone: validTimeZone });
      return { ...meeting.toObject(), adjustedDate };
    });

    res.status(200).json(adjustedMeetings);
  } catch (error) {
    const err = error as Error; // Explicitly cast error to Error
    console.error("Failed to fetch meetings:", err.message);
    res.status(500).json({ message: "Failed to fetch meetings" });
  }
};

export const createMeeting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { title, description, date, time } = req.body;

  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!title || !date || !time) {
      res.status(400).json({ message: "Title, date, and time are required" });
      return;
    }

    const meeting = new Meeting({
      title,
      description,
      date,
      time,
      organizer: req.user._id, // Use the user ID from the request object
    });
    await meeting.save();
    res.status(201).json(meeting);
  } catch (error) {
    const err = error as Error; // Explicitly cast error to Error
    console.error("Failed to create meeting:", err.message);
    res.status(500).json({ message: "Failed to create meeting" });
  }
};

export const updateMeeting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, description, date, time } = req.body;
  try {
    const meeting = await Meeting.findByIdAndUpdate(
      id,
      { title, description, date, time },
      { new: true }
    );
    if (!meeting) {
      res.status(404).json({ message: "Meeting not found" });
      return;
    }
    res.status(200).json(meeting);
  } catch (error) {
    const err = error as Error; // Explicitly cast error to Error
    console.error("Failed to update meeting:", err.message);
    res.status(500).json({ message: "Failed to update meeting" });
  }
};

export const deleteMeeting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const meeting = await Meeting.findByIdAndDelete(id);
    if (!meeting) {
      res.status(404).json({ message: "Meeting not found" });
      return;
    }
    res.status(200).json({ message: "Meeting deleted successfully" });
  } catch (error) {
    const err = error as Error; // Explicitly cast error to Error
    console.error("Failed to delete meeting:", err.message);
    res.status(500).json({ message: "Failed to delete meeting" });
  }
};

export const proposeMeeting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { title, description, date, time, participantId } = req.body;

  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const meeting = new Meeting({
      title,
      description,
      date,
      time,
      organizer: req.user._id,
      participants: [participantId],
      status: "proposed",
    });

    await meeting.save();
    res.status(201).json({ message: "Meeting proposed successfully", meeting });
  } catch (error) {
    const err = error as Error; // Explicitly cast error to Error
    console.error("Failed to propose meeting:", err.message);
    res.status(500).json({ message: "Failed to propose meeting" });
  }
};

export const acceptMeeting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const meeting = await Meeting.findByIdAndUpdate(
      id,
      { status: "accepted" },
      { new: true }
    );

    if (!meeting) {
      res.status(404).json({ message: "Meeting not found" });
      return;
    }

    res.status(200).json({ message: "Meeting accepted successfully", meeting });
  } catch (error) {
    const err = error as Error; // Explicitly cast error to Error
    console.error("Failed to accept meeting:", err.message);
    res.status(500).json({ message: "Failed to accept meeting" });
  }
};

export const declineMeeting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const meeting = await Meeting.findByIdAndUpdate(
      id,
      { status: "declined" },
      { new: true }
    );

    if (!meeting) {
      res.status(404).json({ message: "Meeting not found" });
      return;
    }

    res.status(200).json({ message: "Meeting declined successfully", meeting });
  } catch (error) {
    const err = error as Error; // Explicitly cast error to Error
    console.error("Failed to decline meeting:", err.message);
    res.status(500).json({ message: "Failed to decline meeting" });
  }
};


export const bookMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
  

    // Extract variables from the payload
    const { title, date, time, name, email, notes, userId } = req.body;

    

    // Validate required fields
    if (!title || !date || !time || !name || !email || !userId) {
      
      res.status(400).json({ message: "Title, date, time, name, email, and userId are required" });
      return;
    }

    // Validate date format
    const meetingDate = new Date(date);
    if (isNaN(meetingDate.getTime())) {
      console.error("Invalid date format:", date);
      res.status(400).json({ message: "Invalid date format" });
      return;
    }
  

    // Validate time format
    if (!/^\d{2}:\d{2}$/.test(time)) {
      console.error("Invalid time format:", time);
      res.status(400).json({ message: "Invalid time format" });
      return;
    }
  

    // Check if the time slot is already booked
    const existingMeeting = await Meeting.findOne({ date, time, organizer: userId });
    if (existingMeeting) {
     
      res.status(400).json({ message: "This time slot is already booked" });
      return;
    }
    console.log("No existing meeting found for the time slot.");

    // Validate if the time slot falls within the admin's availability
    const dayOfWeek = meetingDate.toLocaleDateString("en-US", { weekday: "long" });
    

    const availability = await Availability.findOne({
      user: userId,
      days: { $in: [dayOfWeek] },
    });

    if (!availability) {
      console.error("No availability found for this day:", dayOfWeek);
      res.status(404).json({ message: "No availability found for this day" });
      return;
    }
 

    const [startHour, startMinute] = availability.startTime.split(":").map(Number);
    const [endHour, endMinute] = availability.endTime.split(":").map(Number);
    const [requestedHour, requestedMinute] = time.split(":").map(Number);

    const isWithinAvailability =
      (requestedHour > startHour || (requestedHour === startHour && requestedMinute >= startMinute)) &&
      (requestedHour < endHour || (requestedHour === endHour && requestedMinute < endMinute));

    if (!isWithinAvailability) {
      console.error("Requested time is outside of availability:", { time, availability });
      res.status(400).json({ message: "Requested time is outside of availability" });
      return;
    }
    

    // Create and save the meeting
    const meeting = new Meeting({
      title, // Include title in the meeting creation
      date,
      time,
      name,
      email,
      notes,
      organizer: userId,
    });
    await meeting.save();

    res.status(201).json({
      message: "Meeting booked successfully",
      meeting: {
        title: meeting.title,
        date: meeting.date,
        time: meeting.time,
        host: name,
        link: `${process.env.FRONTEND_URL}/meeting/${meeting._id}`,
      },
    });
  } catch (error) {
    const err = error as Error; // Explicitly cast error to Error
    console.error("Error in bookMeeting:", err.message);
    res.status(500).json({ message: "Failed to book meeting", error: err.message });
  }
};
