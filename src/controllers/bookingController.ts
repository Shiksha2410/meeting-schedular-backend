import { Request, Response } from "express";
import { Availability } from "../models/Availability";
import { Meeting } from "../models/Meeting";

export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  const { date } = req.params;

  try {
    const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "long" });

    const availability = await Availability.findOne({
      days: { $in: [dayOfWeek] },
    });

    if (!availability) {
      res.status(404).json({ message: "No availability found for this date" });
      return;
    }

    const start = new Date(`1970-01-01T${availability.startTime}:00Z`);
    const end = new Date(`1970-01-01T${availability.endTime}:00Z`);
    const timeSlots: string[] = [];
    while (start < end) {
      timeSlots.push(start.toISOString().split("T")[1].slice(0, 5));
      start.setMinutes(start.getMinutes() + 30);
    }

    res.status(200).json({ timeSlots });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: "Failed to fetch available slots", error: err.message });
  }
};

export const bookMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, date, time, name, email, notes, userId } = req.body;

    if (!title || !date || !time || !name || !email || !userId) {
      res.status(400).json({ message: "Title, date, time, name, email, and userId are required" });
      return;
    }

    const meetingDate = new Date(date);
    if (isNaN(meetingDate.getTime())) {
      res.status(400).json({ message: "Invalid date format" });
      return;
    }

    if (!/^\d{2}:\d{2}$/.test(time)) {
      res.status(400).json({ message: "Invalid time format" });
      return;
    }

    const existingMeeting = await Meeting.findOne({ date, time, organizer: userId });
    if (existingMeeting) {
      res.status(400).json({ message: "This time slot is already booked" });
      return;
    }

    const dayOfWeek = meetingDate.toLocaleDateString("en-US", { weekday: "long" });

    const availability = await Availability.findOne({
      user: userId,
      days: { $in: [dayOfWeek] },
    });

    if (!availability) {
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
      res.status(400).json({ message: "Requested time is outside of availability" });
      return;
    }

    const meeting = new Meeting({
      title,
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
    const err = error as Error;
    res.status(500).json({ message: "Failed to book meeting", error: err.message });
  }
};

export const getMeetingDetails = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      res.status(404).json({ message: "Meeting not found" });
      return;
    }

    res.status(200).json(meeting);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: "Failed to fetch meeting details", error: err.message });
  }
};
