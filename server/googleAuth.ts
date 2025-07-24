import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";

export function setupGoogleAuth(app: Express) {
  // Set credentials if not already configured
  const clientId = process.env.GOOGLE_CLIENT_ID || '33888285862-hlf5472d8r9b0tdtb2fl7nmcqsg6bn6q.apps.googleusercontent.com';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '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';
  
  if (!clientId || !clientSecret) {
    console.log("Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return;
  }

  console.log("Setting up Google OAuth authentication...");

  passport.use(new GoogleStrategy({
    clientID: clientId,
    clientSecret: clientSecret,
    callbackURL: "/api/auth/google/callback"
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

      await storage.upsertUser(userData);
      
      // Create user session object
      const user = {
        id: profile.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        authProvider: 'google'
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
    passport.authenticate("google", { 
      successRedirect: "/",
      failureRedirect: "/auth?error=google_auth_failed"
    })
  );

  console.log("Google OAuth routes registered");
}