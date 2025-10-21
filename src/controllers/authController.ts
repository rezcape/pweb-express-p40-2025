import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../utils/prisma";
import { generateToken } from "../utils/jwt";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middlewares/authMiddleware";

// POST /auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return sendError(res, "All fields are required", 400);
    }

    if (password.length < 6) {
      return sendError(res, "Password must be at least 6 characters", 400);
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return sendError(res, "Username or email already exists", 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, user, "User registered successfully", 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

// POST /auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return sendError(res, "Username and password are required", 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return sendError(res, "Invalid credentials", 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return sendError(res, "Invalid credentials", 401);
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      },
      "Login successful"
    );
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

// GET /auth/me
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    return sendSuccess(res, user, "User profile retrieved successfully");
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};
