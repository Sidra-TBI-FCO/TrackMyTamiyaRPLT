import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { setupTraditionalAuth } from "./traditionalAuth";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Set up traditional email/password authentication
  setupTraditionalAuth(app);
  
  // For testing purposes, always use development authentication  
  // In real production, you would check: process.env.NODE_ENV !== "production"
  console.log("Setting up development authentication for testing...");
  setupDevAuth(app);
  return;
  
  // This production auth code is disabled for testing
  /*
  console.log("Setting up production authentication...");

  try {
    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    };

    // Register strategies for all domains, including localhost for development
    const domains = process.env.REPLIT_DOMAINS!.split(",");
    const allDomains = [...domains, "localhost"];

    for (const domain of allDomains) {
      // Use http for localhost, https for production domains
      const protocol = domain === "localhost" ? "http" : "https";
      const port = domain === "localhost" ? ":5000" : "";
      
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `${protocol}://${domain}${port}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      console.log(`Registered auth strategy for domain: ${domain} (${protocol}://${domain}${port})`);
    }
  } catch (error) {
    console.error("Failed to setup OIDC authentication:", error);
    console.log("Authentication will be disabled");
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    try {
      const hostname = req.hostname || "localhost";
      console.log(`Login attempt for hostname: ${hostname}`);
      
      passport.authenticate(`replitauth:${hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Authentication setup failed", error: String(error) });
    }
  });

  app.get("/api/callback", (req, res, next) => {
    try {
      const hostname = req.hostname || "localhost";
      console.log(`Callback for hostname: ${hostname}`);
      
      passport.authenticate(`replitauth:${hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    } catch (error) {
      console.error("Callback error:", error);
      res.status(500).json({ message: "Authentication callback failed", error: String(error) });
    }
  });

  app.get("/api/logout", async (req, res) => {
    try {
      const config = await getOidcConfig();
      req.logout(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      });
    } catch (error) {
      console.error("Logout error:", error);
      req.logout(() => {
        res.redirect("/");
      });
    }
  });
  */
}

// Development authentication for localhost testing
function setupDevAuth(app: Express) {
  // Mock user data for development
  const mockUser = {
    id: "dev-user-123",
    email: "developer@tamiya.test",
    firstName: "Test",
    lastName: "User",
    profileImageUrl: "https://replit.com/public/images/evalMarkIcon.png"
  };

  // Development login route
  app.get("/api/login", async (req, res) => {
    console.log("Development login - creating mock session");
    
    // Create mock user in database
    await storage.upsertUser(mockUser);
    
    // Set up mock session with proper login
    req.login({
      claims: {
        sub: mockUser.id,
        email: mockUser.email,
        first_name: mockUser.firstName,
        last_name: mockUser.lastName,
        profile_image_url: mockUser.profileImageUrl
      },
      access_token: "mock-access-token",
      expires_at: Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
    }, (err) => {
      if (err) {
        console.error("Dev login error:", err);
        return res.status(500).json({ message: "Login failed" });
      }
      res.redirect("/");
    });
  });

  // Development logout route
  app.get("/api/logout", (req, res) => {
    console.log("Development logout");
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      // Destroy the session completely
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.redirect("/");
      });
    });
  });

  // Development callback (not needed but included for consistency)
  app.get("/api/callback", (req, res) => {
    res.redirect("/api/login");
  });

  // Setup passport serialization for mock user
  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};