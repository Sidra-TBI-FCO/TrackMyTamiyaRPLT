import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";

export function setupGoogleAuth(app: Express) {
  // Require credentials from environment variables only
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.log("Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return;
  }

  console.log("Setting up Google OAuth authentication...");

  // Determine the callback URL based on environment
  let callbackURL: string;
  
  if (process.env.OAUTH_CALLBACK_URL) {
    // Explicit callback URL (for Google Cloud Run and other deployments)
    callbackURL = process.env.OAUTH_CALLBACK_URL;
    console.log(`Google OAuth callback URL (explicit): ${callbackURL}`);
  } else if (process.env.K_SERVICE) {
    // Google Cloud Run deployment detected
    // Note: You need to set OAUTH_CALLBACK_URL env var with your actual Cloud Run URL
    console.warn('⚠️  Running on Google Cloud Run but OAUTH_CALLBACK_URL not set!');
    console.warn('⚠️  Please add OAUTH_CALLBACK_URL environment variable to your Cloud Run service');
    console.warn('⚠️  Example: https://trackmyrc-XXXXX-uc.a.run.app/api/auth/google/callback');
    callbackURL = 'http://localhost:5000/api/auth/google/callback'; // Fallback (will fail)
  } else if (process.env.REPLIT_DOMAINS) {
    // Replit deployment
    const domain = process.env.REPLIT_DOMAINS.split(',')[0];
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    callbackURL = `${protocol}://${domain}/api/auth/google/callback`;
    console.log(`Google OAuth callback URL (Replit): ${callbackURL}`);
  } else {
    // Local development
    callbackURL = 'http://localhost:5000/api/auth/google/callback';
    console.log(`Google OAuth callback URL (local dev): ${callbackURL}`);
  }
  
  console.log(`🔐 Google OAuth callback configured: ${callbackURL}`);

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
    passport.authenticate("google", { 
      successRedirect: "/",
      failureRedirect: "/auth?error=google_auth_failed"
    })
  );

  console.log("Google OAuth routes registered");
}