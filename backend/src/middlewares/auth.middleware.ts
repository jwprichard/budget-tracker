import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided. Please login.',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = AuthService.verifyAccessToken(token);

    // Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid or expired token',
    });
  }
};
