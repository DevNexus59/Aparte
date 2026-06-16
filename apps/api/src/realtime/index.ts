import type http from 'node:http';
import { Server as IOServer, Socket } from 'socket.io';
import { verifyAccess } from '../lib/jwt';
import { accessBlacklist } from '../services';

export interface RealtimeMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
}

let io: IOServer | null = null;

// Push temps réel uniquement (l'envoi reste 100% REST — validation/modération/
// rate-limit centralisées une seule fois). Chaque socket rejoint la room
// `user:<id>` après authentification par le même access token JWT que l'API.
export function initRealtime(httpServer: http.Server): IOServer {
  const origins = process.env.CORS_ORIGIN?.split(',').map((s) => s.trim());
  const corsOrigin = origins ?? (process.env.NODE_ENV === 'development');

  io = new IOServer(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
  });

  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) throw new Error('Token manquant');

      const payload = verifyAccess(token);
      if (payload.jti && (await accessBlacklist.has(payload.jti))) {
        throw new Error('Token révoqué');
      }
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    socket.join(`user:${socket.data.userId as string}`);
  });

  return io;
}

export function broadcastNewMessage(message: RealtimeMessage): void {
  if (!io) return;
  io.to(`user:${message.recipientId}`).emit('message:new', message);
  io.to(`user:${message.senderId}`).emit('message:new', message);
}
