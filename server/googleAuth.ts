import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { logUserActivity } from "./activityLogger";

export function setupGoogleAuth(app: Express) {
  // Require credentials from environment variables only
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.log("Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return;
  }

  console.log("Setting up Google OAuth authentication...");
  
  // Determine callback URL
  // Priority: OAUTH_CALLBACK_URL > REPLIT_DOMAINS > localhost
  let callbackURL: string;
  
  if (process.env.OAUTH_CALLBACK_URL) {
    callbackURL = process.env.OAUTH_CALLBACK_URL;
    console.log(`✅ Using explicit OAUTH_CALLBACK_URL: ${callbackURL}`);
  } else if (process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(',');
    // Find first non-localhost domain
    const domain = domains.find(d => !d.includes('localhost')) || domains[0];
    callbackURL = `https://${domain}/api/auth/google/callback`;
    console.log(`✅ Using REPLIT_DOMAINS: ${callbackURL}`);
  } else {
    callbackURL = 'http://localhost:5000/api/auth/google/callback';
    console.log(`✅ Using localhost: ${callbackURL}`);
  }

  passport.use(new GoogleStrategy({
    clientID: clientId,
    clientSecret: clientSecret,
    callbackURL: callbackURL
  }, async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
    try {
      // Create or update user from Google profile
      const userData = {
        id: profile.id,
        email: profile.emails?.[0]?.value || '',
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        profileImageUrl: profile.photos?.[0]?.value || null,
        authProvider: 'google' as const
      };

      const linkedUser = await storage.upsertUser(userData);
      
      // Create user session object using the ACTUAL user ID from database
      // This ensures we use the existing account ID, not Google's ID
      const user = {
        id: linkedUser.id,  // Use the actual database user ID, not Google's profile.id
        email: linkedUser.email,
        firstName: linkedUser.firstName,
        lastName: linkedUser.lastName,
        profileImageUrl: linkedUser.profileImageUrl,
        authProvider: linkedUser.authProvider
      };

      console.log(`Google OAuth success for user: ${userData.email}`);
      return done(null, user);
    } catch (error) {
      console.error("Google OAuth error:", error);
      return done(error, false);
    }
  }));

  // Google OAuth routes
  app.get("/api/auth/google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth?error=google_auth_failed" }),
    async (req: Request, res: Response) => {
      // Log Google OAuth login activity
      if (req.user && typeof req.user === 'object' && 'id' in req.user) {
        const user = req.user as { id: string; email: string };
        await logUserActivity(user.id, 'login', {
          method: 'google',
          email: user.email,
          ip: req.ip || req.headers['x-forwarded-for'] || 'unknown'
        }, req);
      }
      res.redirect("/");
    }
  );

  console.log("Google OAuth routes registered");
}