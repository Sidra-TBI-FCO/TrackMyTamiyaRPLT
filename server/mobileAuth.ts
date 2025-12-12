import { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { loginUserSchema } from "@shared/schema";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

if (!JWT_SECRET) {
  console.error('❌ CRITICAL: SESSION_SECRET environment variable is required for JWT authentication');
}

interface JWTPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
}

interface MobileUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  authProvider: string;
  isVerified: boolean | null;
  modelLimit: number | null;
}

function generateAccessToken(user: MobileUser): string {
  if (!JWT_SECRET) {
    throw new Error('JWT authentication not configured: SESSION_SECRET missing');
  }
  return jwt.sign(
    { userId: user.id, email: user.email, type: "access" } as JWTPayload,
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken(user: MobileUser): string {
  if (!JWT_SECRET) {
    throw new Error('JWT authentication not configured: SESSION_SECRET missing');
  }
  return jwt.sign(
    { userId: user.id, email: user.email, type: "refresh" } as JWTPayload,
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

function verifyToken(token: string): JWTPayload | null {
  if (!JWT_SECRET) {
    console.error('JWT verification failed: SESSION_SECRET not configured');
    return null;
  }
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function setupMobileAuth(app: Express) {
  app.post("/api/auth/mobile/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginUserSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(validatedData.email);
      
      if (!user) {
        return res.status(401).json({ 
          message: "No account found with this email. Please register a new account." 
        });
      }
      
      if (user.authProvider === "google") {
        return res.status(401).json({ 
          message: "This email is registered with Google. Please use Google Sign-In.",
          useGoogleAuth: true
        });
      }
      
      if (user.authProvider !== "email" || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const mobileUser: MobileUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        authProvider: user.authProvider,
        isVerified: user.isVerified,
        modelLimit: user.modelLimit
      };

      const accessToken = generateAccessToken(mobileUser);
      const refreshToken = generateRefreshToken(mobileUser);

      res.json({
        user: mobileUser,
        accessToken,
        refreshToken,
        expiresIn: 900
      });

    } catch (error: any) {
      console.error("Mobile login error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/mobile/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const userId = crypto.randomUUID();
      const verificationToken = crypto.randomBytes(32).toString('hex');

      const user = await storage.upsertUser({
        id: userId,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        password: hashedPassword,
        authProvider: "email",
        isVerified: false,
        verificationToken,
      });

      const mobileUser: MobileUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        authProvider: user.authProvider,
        isVerified: user.isVerified,
        modelLimit: user.modelLimit
      };

      const accessToken = generateAccessToken(mobileUser);
      const refreshToken = generateRefreshToken(mobileUser);

      res.status(201).json({
        user: mobileUser,
        accessToken,
        refreshToken,
        expiresIn: 900,
        message: "Account created. Please verify your email."
      });

    } catch (error: any) {
      console.error("Mobile registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/mobile/refresh", async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
      }

      const payload = verifyToken(refreshToken);
      if (!payload || payload.type !== "refresh") {
        return res.status(401).json({ message: "Invalid or expired refresh token" });
      }

      const user = await storage.getUser(payload.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const mobileUser: MobileUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        authProvider: user.authProvider,
        isVerified: user.isVerified,
        modelLimit: user.modelLimit
      };

      const newAccessToken = generateAccessToken(mobileUser);
      const newRefreshToken = generateRefreshToken(mobileUser);

      res.json({
        user: mobileUser,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900
      });

    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/mobile/google", async (req: Request, res: Response) => {
    try {
      const { idToken, email, firstName, lastName, profileImageUrl } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required from Google token" });
      }

      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        const userId = crypto.randomUUID();
        user = await storage.upsertUser({
          id: userId,
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          profileImageUrl: profileImageUrl || null,
          authProvider: "google",
          isVerified: true,
        });
      } else if (user.authProvider !== "google") {
        return res.status(400).json({ 
          message: "An account already exists with this email using a different sign-in method"
        });
      }

      const mobileUser: MobileUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        authProvider: user.authProvider,
        isVerified: user.isVerified,
        modelLimit: user.modelLimit
      };

      const accessToken = generateAccessToken(mobileUser);
      const refreshToken = generateRefreshToken(mobileUser);

      res.json({
        user: mobileUser,
        accessToken,
        refreshToken,
        expiresIn: 900
      });

    } catch (error) {
      console.error("Mobile Google auth error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/mobile/user", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const payload = verifyToken(token);
      
      if (!payload || payload.type !== "access") {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      const user = await storage.getUser(payload.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        authProvider: user.authProvider,
        isVerified: user.isVerified,
        modelLimit: user.modelLimit
      });

    } catch (error) {
      console.error("Get mobile user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}

export function verifyMobileToken(token: string): JWTPayload | null {
  return verifyToken(token);
}

export async function getMobileUser(req: Request): Promise<MobileUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  
  if (!payload || payload.type !== "access") {
    return null;
  }

  const user = await storage.getUser(payload.userId);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    authProvider: user.authProvider,
    isVerified: user.isVerified,
    modelLimit: user.modelLimit
  };
}
