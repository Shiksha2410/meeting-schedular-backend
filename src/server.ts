import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import meetingRoutes from "./routes/meetingRoutes";
import availabilityRoutes from "./routes/availabilityRoutes";




const app = express();

// Connect Database
connectDB();

// Middleware

const corsOptions = {
  origin: (requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL, // Allow the frontend URL from the environment variable
      "https://meeting-schedular-frontend.onrender.com", // Explicitly allow the Render frontend domain
    ];

    if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
      callback(null, true); // Allow requests from allowed origins or undefined origins
    } else {
      callback(new Error("Not allowed by CORS")); // Block other origins
    }
  },
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/availability", availabilityRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Handle 404 Errors
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5001; // Port configuration
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
