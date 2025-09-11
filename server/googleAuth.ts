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

  // Get the current domain from REPLIT_DOMAINS or fallback to localhost
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
  const protocol = domain.includes('localhost') ? 'http' : 'https';
  const callbackURL = `${protocol}://${domain}/api/auth/google/callback`;
  
  console.log(`Google OAuth callback URL: ${callbackURL}`);
  console.log(`🚨 IMPORTANT: For deployed apps, you may also need to add:`);
  console.log(`   https://[YOUR-APP-NAME].replit.app/api/auth/google/callback`);
  console.log(`   to your Google Cloud Console OAuth redirect URIs`);

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