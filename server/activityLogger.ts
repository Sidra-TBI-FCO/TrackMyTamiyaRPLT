import { db } from "./db";
import { userActivityLog } from "@shared/schema";
import { Request } from "express";

function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'unknown';
}

export async function logUserActivity(
  userId: string,
  activityType: string,
  details: any,
  req: Request
) {
  try {
    await db.insert(userActivityLog).values({
      userId,
      activityType,
      details: details || {},
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
    });
  } catch (error) {
    console.error(`Failed to log user activity (${activityType}):`, error);
  }
}
