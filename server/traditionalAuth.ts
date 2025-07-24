import { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { registerUserSchema, loginUserSchema, RegisterUser, LoginUser } from "@shared/schema";
import { storage } from "./storage";

export function setupTraditionalAuth(app: Express) {
  // Register new user with email/password
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);

      // Generate unique user ID
      const userId = crypto.randomUUID();

      // Create user
      const user = await storage.upsertUser({
        id: userId,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        password: hashedPassword,
        authProvider: "email",
        isVerified: true, // For now, auto-verify. Later add email verification
      });

      // Log the user in
      req.login({
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          profile_image_url: user.profileImageUrl
        },
        access_token: "email-auth-token",
        expires_at: Math.floor(Date.now() / 1000) + 86400 // 24 hours
      }, (err) => {
        if (err) {
          console.error("Registration login error:", err);
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        res.status(201).json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl
        });
      });

    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login with email/password
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginUserSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user || user.authProvider !== "email" || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Log the user in
      req.login({
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          profile_image_url: user.profileImageUrl
        },
        access_token: "email-auth-token",
        expires_at: Math.floor(Date.now() / 1000) + 86400 // 24 hours
      }, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl
        });
      });

    } catch (error: any) {
      console.error("Login error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
}