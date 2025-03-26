import { Document } from "mongoose";

export interface UserDocument extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  timeZone?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument; // Add the user property to the Request type
    }
  }
}
