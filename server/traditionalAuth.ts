import { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { registerUserSchema, loginUserSchema, RegisterUser, LoginUser } from "@shared/schema";
import { storage } from "./storage";

// Simple email sending simulation (in production, use a real email service)
function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
    : 'http://localhost:5000';
  
  console.log(`📧 Verification email would be sent to: ${email}`);
  console.log(`🔗 Verification link: ${baseUrl}/api/auth/verify-email?token=${token}`);
  console.log(`✨ In production, integrate with SendGrid, AWS SES, or similar service`);
}

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

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

      // Generate verification token
      const verificationToken = generateVerificationToken();

      // Create user
      const user = await storage.upsertUser({
        id: userId,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        password: hashedPassword,
        authProvider: "email",
        isVerified: false, // Require email verification
        verificationToken,
      });

      // Send verification email
      sendVerificationEmail(validatedData.email, verificationToken);

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
      console.log(`🔍 Login attempt for ${validatedData.email}, user found:`, user ? `authProvider=${user.authProvider}` : 'NOT FOUND');
      
      // If user doesn't exist, suggest registration or Google Sign-In
      if (!user) {
        return res.status(401).json({ 
          message: "No account found with this email. Please register a new account or try signing in with Google if you have a Google account." 
        });
      }
      
      // If user exists but uses Google OAuth, direct them to Google Sign-In
      if (user.authProvider === "google") {
        console.log(`🔄 Redirecting Google user to OAuth: ${user.email}`);
        return res.status(401).json({ 
          message: "This email is registered with Google. Please use 'Sign in with Google' instead." 
        });
      }
      
      // If user exists but doesn't have email/password auth set up
      if (user.authProvider !== "email" || !user.password) {
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

  // Email verification endpoint
  app.get("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;
      
      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      // Find user by verification token
      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      // Update user as verified
      await storage.verifyUserEmail(user.id);

      // Redirect to success page or login
      res.redirect('/?verified=true');
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Resend verification email endpoint
  app.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.isVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate new verification token
      const newToken = generateVerificationToken();
      await storage.updateUserVerificationToken(user.id, newToken);
      
      // Send verification email
      sendVerificationEmail(email, newToken);
      
      res.json({ message: "Verification email sent" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}