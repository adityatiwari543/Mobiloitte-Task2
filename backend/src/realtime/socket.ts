import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cookie from 'cookie';
import { verifyAccessToken, TokenPayload } from '../utils/token.js';
import { ACCESS_COOKIE_NAME } from '../utils/cookie.js';
import { redisService } from '../services/redis.service.js';
import { env } from '../config/env.js';

export class SocketGateway {
  private static io: SocketIOServer | null = null;

  static initialize(httpServer: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.FRONTEND_URL,
        credentials: true,
      },
    });

    // Authenticate Socket.IO handshake (Section 14)
    this.io.use(async (socket: Socket, next) => {
      try {
        const rawCookies = socket.handshake.headers.cookie;
        let token: string | undefined;

        if (rawCookies) {
          const parsed = cookie.parse(rawCookies);
          token = parsed[ACCESS_COOKIE_NAME];
        }

        if (!token && socket.handshake.auth?.token) {
          token = socket.handshake.auth.token;
        }

        if (!token) {
          return next(new Error('Authentication error: Missing token'));
        }

        const decoded = verifyAccessToken(token);
        if (!decoded) {
          return next(new Error('Authentication error: Invalid or expired token'));
        }

        // Fast session revocation check
        const isRevoked = await redisService.exists(`revoked:session:${decoded.sessionId}`);
        if (isRevoked) {
          return next(new Error('Authentication error: Session revoked'));
        }

        socket.data.user = decoded;
        next();
      } catch (err) {
        next(new Error('Authentication handshake failed'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const user = socket.data.user as TokenPayload;
      if (!user) return;

      const userRoom = `user:${user.userId}`;
      socket.join(userRoom);
      console.log(`⚡ [Socket.IO] User ${user.email} (${user.role}) connected -> joined room ${userRoom}`);

      socket.on('disconnect', () => {
        console.log(`🔌 [Socket.IO] User ${user.email} disconnected`);
      });
    });

    // Subscribe to Redis Pub/Sub events for multi-instance horizontal scaling (Section 13.6 & 14)
    redisService.subscribe('jobconnect:events', (rawMessage: string) => {
      try {
        const message = JSON.parse(rawMessage);
        if (message.recipientUserId && this.io) {
          this.io.to(`user:${message.recipientUserId}`).emit(message.event, message.payload);
        }
      } catch (err) {
        console.error('Failed to parse and broadcast Redis Pub/Sub event:', err);
      }
    });

    return this.io;
  }

  static getIO(): SocketIOServer | null {
    return this.io;
  }
}
