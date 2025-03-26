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
  origin: (origin: string, callback: Function) => {
    // Allow the frontend URL and localhost (for local dev)
    const allowedOrigins = [
      process.env.FRONTEND_URL,  // The production frontend URL (e.g., Vercel)
      "http://localhost:5173",   // Local development URL (if using Vite)
    ];

    // If the origin is in the allowed origins list or it's a local request (no origin)
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);  // Allow the request
    } else {
      callback(new Error("Not allowed by CORS"), false);  // Deny the request
    }
  },
  methods: "GET,POST,PUT,DELETE",  // Allowed HTTP methods
  allowedHeaders: "Content-Type, Authorization",  // Allowed headers
  credentials: true,  // Allow cookies or credentials
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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
