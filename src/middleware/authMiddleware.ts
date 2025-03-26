import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

interface AuthRequest extends Request {
  user?: any; // Attach user data to the request object
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Access Denied: No Token Provided" });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Access Denied: Token is missing" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

    // Fetch the user from the database using the decoded ID
    const user = await User.findById(decoded.id).select("-password"); // Exclude the password field
    if (!user) {
      res.status(401).json({ message: "User not found, authorization denied" });
      return;
    }

    req.user = user; // Attach the user object to the request
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(401).json({ message: "Invalid or Expired Token" });
  }
};
