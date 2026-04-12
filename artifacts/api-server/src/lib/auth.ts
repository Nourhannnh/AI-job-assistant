/**
 * Authentication middleware using Clerk.
 * Extracts authenticated user ID and attaches it to the request.
 */
import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Middleware that requires authentication.
 * Extracts the Clerk user ID and attaches it to req.userId.
 * Returns 401 if the user is not authenticated.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId as string | undefined || auth?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.userId = userId;
  next();
};
