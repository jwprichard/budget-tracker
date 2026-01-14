import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator';

/**
 * Register a new user
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);

    // Register user
    const { user, tokens } = await AuthService.register(validatedData);

    res.status(201).json({
      success: true,
      data: {
        user,
        tokens,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    } else if (error.message === 'User with this email already exists') {
      res.status(409).json({
        success: false,
        message: error.message,
      });
    } else {
      next(error);
    }
  }
};

/**
 * Login user
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);

    // Login user
    const { user, tokens } = await AuthService.login(validatedData);

    res.status(200).json({
      success: true,
      data: {
        user,
        tokens,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    } else if (error.message === 'Invalid email or password') {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    } else {
      next(error);
    }
  }
};

/**
 * Refresh access token
 */
export const refresh = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    // Validate input
    const validatedData = refreshTokenSchema.parse(req.body);

    // Refresh tokens
    const tokens = await AuthService.refresh(validatedData.refreshToken);

    res.status(200).json({
      success: true,
      data: { tokens },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    } else {
      res.status(401).json({
        success: false,
        message: error.message || 'Invalid refresh token',
      });
    }
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const user = await AuthService.getUserById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
