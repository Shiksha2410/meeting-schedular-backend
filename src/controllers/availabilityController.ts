import { Request, Response } from "express";
import { Availability } from "../models/Availability";

export const setAvailability = async (req: Request, res: Response): Promise<void> => {
  const { startTime, endTime, days } = req.body;

  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  // Validate startTime and endTime
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  if (startHour > endHour || (startHour === endHour && startMinute >= endMinute)) {
    res.status(400).json({ message: "Start time must be earlier than end time" });
    return;
  }

  try {
    const availability = await Availability.findOneAndUpdate(
      { user: req.user._id },
      { startTime, endTime, days },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Availability updated successfully", availability });
  } catch (error) {
    console.error("Failed to set availability:", error);
    res.status(500).json({ message: "Failed to set availability" });
  }
};

export const getAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    
    const availability = await Availability.findOne({ user: req.user?._id });
    if (!availability) {
      res.status(404).json({ message: "No availability found" });
      return;
    }

   
    res.status(200).json(availability);
  } catch (error) {
    console.error("Failed to fetch availability:", error);
    res.status(500).json({ message: "Failed to fetch availability" });
  }
};

export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  const { day } = req.params; // Use 'day' from the request parameters

  try {
 

    // Validate the day of the week
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    if (!validDays.includes(day)) {
      
      res.status(400).json({ message: "Invalid day of the week" });
      return;
    }

    // Fetch availability for the logged-in user
    const availability = await Availability.findOne({
      user: req.user?._id, // Ensure availability is fetched for the logged-in user
      days: { $in: [day] }, // Match the day of the week
    });

    if (!availability) {
      console.error("No availability found for day:", day); // Debug log
      res.status(404).json({ message: "No availability found for this day" });
      return;
    }



    // Generate time slots based on startTime and endTime
    const timeSlots: string[] = [];
    let [startHour, startMinute] = availability.startTime.split(":").map(Number);
    let [endHour, endMinute] = availability.endTime.split(":").map(Number);

    while (startHour < endHour || (startHour === endHour && startMinute < endMinute)) {
      const formattedTime = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`;
      timeSlots.push(formattedTime);

      // Increment by 30 minutes
      startMinute += 30;
      if (startMinute >= 60) {
        startMinute -= 60;
        startHour += 1;
      }
    }

    res.status(200).json({
      startTime: availability.startTime,
      endTime: availability.endTime,
      timeSlots,
    });
  } catch (error) {
    console.error("Failed to fetch available slots:", error);
    res.status(500).json({ message: "Failed to fetch available slots" });
  }
};

export const setMeetingDuration = async (req: Request, res: Response): Promise<void> => {
  const { duration } = req.body;

  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const availability = await Availability.findOneAndUpdate(
      { user: req.user._id },
      { duration },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Meeting duration updated successfully", availability });
  } catch (error) {
    console.error("Failed to set meeting duration:", error);
    res.status(500).json({ message: "Failed to set meeting duration" });
  }
};

export const generateBookingLink = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const bookingLink = `${process.env.FRONTEND_URL}/book/${req.user._id}`;
    res.status(200).json({ bookingLink });
  } catch (error) {
    console.error("Failed to generate booking link:", error);
    res.status(500).json({ message: "Failed to generate booking link" });
  }
};

export const saveAvailability = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { availability, settings } = req.body;

  try {
    const updatedAvailability = await Availability.findOneAndUpdate(
      { user: userId },
      { ...availability, settings },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Availability saved successfully", updatedAvailability });
  } catch (error) {
    console.error("Failed to save availability:", error);
    res.status(500).json({ message: "Failed to save availability" });
  }
};
