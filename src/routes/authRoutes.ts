import express, { Request, Response, NextFunction } from "express";
import { register, login } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware"; // Ensure this is correctly imported

const router = express.Router();

// Define a custom type for the request object that includes the 'user' property
interface AuthenticatedRequest extends Request {
    user?: any;
}

router.post("/register", async (req: Request, res: Response) => {
    await register(req, res);
});

router.post("/login", async (req: Request, res: Response) => {
    await login(req, res);
});

// Protected route (requires authentication)
router.get(
    "/profile",
    authMiddleware,
    (req: Request, res: Response, next: NextFunction): void => {
        const authReq = req as AuthenticatedRequest; // Type assertion
        if (!authReq.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        res.json({ message: "Welcome to your profile!", user: authReq.user });
    }
);

export default router;
