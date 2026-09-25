import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { Session, ISessionDocument } from '../models/Session.js';
import { redisService } from './redis.service.js';

export class SessionService {
  static parseUserAgent(userAgentHeader?: string) {
    if (!userAgentHeader) {
      return { browser: 'Unknown', os: 'Unknown', device: 'Desktop', rawUserAgent: '' };
    }
    const isMobile = /mobile|iphone|android/i.test(userAgentHeader);
    let browser = 'Browser';
    if (/chrome|crios/i.test(userAgentHeader)) browser = 'Chrome';
    else if (/firefox|fxios/i.test(userAgentHeader)) browser = 'Firefox';
    else if (/safari/i.test(userAgentHeader)) browser = 'Safari';
    else if (/edg/i.test(userAgentHeader)) browser = 'Edge';

    let os = 'Unknown OS';
    if (/windows/i.test(userAgentHeader)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(userAgentHeader)) os = 'macOS';
    else if (/linux/i.test(userAgentHeader)) os = 'Linux';
    else if (/android/i.test(userAgentHeader)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(userAgentHeader)) os = 'iOS';

    return {
      browser,
      os,
      device: isMobile ? 'Mobile' : 'Desktop',
      rawUserAgent: userAgentHeader.substring(0, 200),
    };
  }

  static async createSession(
    userId: string,
    req: Request
  ): Promise<ISessionDocument> {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgentMetadata = this.parseUserAgent(req.headers['user-agent']);

    const session = await Session.create({
      sessionId,
      userId: new mongoose.Types.ObjectId(userId),
      userAgentMetadata,
      ipMetadata: { ip },
      expiresAt,
      lastUsedAt: new Date(),
    });

    // Mark as active in Redis (7 days TTL)
    await redisService.set(`session:active:${sessionId}`, userId, 7 * 24 * 60 * 60);

    return session;
  }

  static async revokeSession(sessionId: string, userId: string): Promise<boolean> {
    const session = await Session.findOne({
      sessionId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!session) return false;

    session.revokedAt = new Date();
    await session.save();

    // Fast O(1) revocation flag in Redis
    await redisService.set(`revoked:session:${sessionId}`, '1', 7 * 24 * 60 * 60);
    await redisService.del(`session:active:${sessionId}`);

    return true;
  }

  static async revokeOtherSessions(userId: string, currentSessionId: string): Promise<number> {
    const activeOtherSessions = await Session.find({
      userId: new mongoose.Types.ObjectId(userId),
      sessionId: { $ne: currentSessionId },
      revokedAt: { $exists: false },
    });

    for (const session of activeOtherSessions) {
      session.revokedAt = new Date();
      await session.save();
      await redisService.set(`revoked:session:${session.sessionId}`, '1', 7 * 24 * 60 * 60);
      await redisService.del(`session:active:${session.sessionId}`);
    }

    return activeOtherSessions.length;
  }

  static async getUserSessions(userId: string, currentSessionId?: string) {
    const sessions = await Session.find({
      userId: new mongoose.Types.ObjectId(userId),
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    }).sort({ lastUsedAt: -1 });

    return sessions.map((s) => ({
      sessionId: s.sessionId,
      browser: s.userAgentMetadata?.browser,
      os: s.userAgentMetadata?.os,
      device: s.userAgentMetadata?.device,
      ip: s.ipMetadata?.ip,
      lastActive: s.lastUsedAt,
      isCurrent: s.sessionId === currentSessionId,
    }));
  }
}
