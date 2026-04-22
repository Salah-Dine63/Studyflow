import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { query } from './db/pool';

const TECHNIQUES: Record<string, { work: number; break: number; sessions: number; label: string }> = {
  pomodoro: { work: 25, break: 5,  sessions: 4, label: 'Pomodoro' },
  deepwork: { work: 90, break: 20, sessions: 2, label: 'Deep Work' },
  sprint:   { work: 10, break: 2,  sessions: 6, label: 'Sprint Study' },
  spaced:   { work: 20, break: 10, sessions: 3, label: 'Spaced Rep.' },
};

interface Participant {
  userId: string;
  name: string;
  socketId: string;
  avatarUrl?: string;
}

interface Room {
  code: string;
  hostId: string;
  technique: string;
  phase: 'focus' | 'break';
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  sessionNum: number;
  participants: Map<string, Participant>;
  interval?: ReturnType<typeof setInterval>;
}

const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();
const socketToUser = new Map<string, { userId: string; name: string }>();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function roomState(room: Room) {
  return {
    code: room.code,
    hostId: room.hostId,
    technique: room.technique,
    phase: room.phase,
    timeLeft: room.timeLeft,
    totalDuration: room.totalDuration,
    isRunning: room.isRunning,
    sessionNum: room.sessionNum,
  };
}

function participantList(room: Room) {
  return Array.from(room.participants.values()).map(p => ({
    userId: p.userId,
    name: p.name,
    avatarUrl: p.avatarUrl,
    isHost: p.userId === room.hostId,
  }));
}

function verifyToken(token: string): { userId: string; name?: string } | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
  } catch {
    return null;
  }
}

function stopRoomTimer(room: Room) {
  if (room.interval) {
    clearInterval(room.interval);
    room.interval = undefined;
  }
}

function startRoomTimer(io: Server, room: Room) {
  stopRoomTimer(room);
  const cfg = TECHNIQUES[room.technique];
  room.interval = setInterval(() => {
    if (room.timeLeft > 1) {
      room.timeLeft--;
      io.to(room.code).emit('room:tick', room.timeLeft);
    } else {
      // Phase transition
      if (room.phase === 'focus') {
        room.phase = 'break';
        room.timeLeft = cfg.break * 60;
        room.totalDuration = cfg.break * 60;
        room.isRunning = false;
        stopRoomTimer(room);
      } else {
        room.phase = 'focus';
        room.sessionNum = room.sessionNum < cfg.sessions ? room.sessionNum + 1 : 1;
        room.timeLeft = cfg.work * 60;
        room.totalDuration = cfg.work * 60;
        room.isRunning = false;
        stopRoomTimer(room);
      }
      io.to(room.code).emit('room:state', roomState(room));
      io.to(room.code).emit('room:phase-end');
    }
  }, 1000);
}

function leaveRoom(io: Server, socketId: string) {
  const code = socketToRoom.get(socketId);
  if (!code) return;
  const room = rooms.get(code);
  if (!room) return;

  const user = socketToUser.get(socketId);
  if (user) room.participants.delete(user.userId);
  socketToRoom.delete(socketId);

  if (room.participants.size === 0) {
    stopRoomTimer(room);
    rooms.delete(code);
  } else {
    if (room.hostId === user?.userId) {
      // Transfer host to next participant
      const next = room.participants.values().next().value;
      if (next) room.hostId = next.userId;
    }
    io.to(code).emit('room:participants', participantList(room));
    io.to(code).emit('room:state', roomState(room));
  }
}

export function initSocket(httpServer: HttpServer, corsOrigin: string | string[]) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
  });

  io.on('connection', (socket) => {

    socket.on('room:create', async ({ technique, token, name }: { technique: string; token: string; name: string }) => {
      const user = verifyToken(token);
      if (!user) { socket.emit('room:error', 'Non authentifié'); return; }
      if (!TECHNIQUES[technique]) { socket.emit('room:error', 'Technique invalide'); return; }

      leaveRoom(io, socket.id);

      const profileResult = await query('SELECT name, avatar_url FROM users WHERE id = $1', [user.userId]).catch(() => ({ rows: [] }));
      const profile = profileResult.rows[0];
      const displayName = profile?.name || name;
      const avatarUrl = profile?.avatar_url || undefined;

      const cfg = TECHNIQUES[technique];
      let code = generateCode();
      while (rooms.has(code)) code = generateCode();

      const room: Room = {
        code, hostId: user.userId, technique,
        phase: 'focus', timeLeft: cfg.work * 60, totalDuration: cfg.work * 60,
        isRunning: false, sessionNum: 1,
        participants: new Map(),
      };
      room.participants.set(user.userId, { userId: user.userId, name: displayName, socketId: socket.id, avatarUrl });
      rooms.set(code, room);

      socketToRoom.set(socket.id, code);
      socketToUser.set(socket.id, { userId: user.userId, name: displayName });
      socket.join(code);

      socket.emit('room:joined', roomState(room));
      socket.emit('room:participants', participantList(room));
    });

    socket.on('room:join', async ({ code, token, name }: { code: string; token: string; name: string }) => {
      const user = verifyToken(token);
      if (!user) { socket.emit('room:error', 'Non authentifié'); return; }

      const room = rooms.get(code.toUpperCase());
      if (!room) { socket.emit('room:error', 'Salle introuvable'); return; }

      leaveRoom(io, socket.id);

      const profileResult = await query('SELECT name, avatar_url FROM users WHERE id = $1', [user.userId]).catch(() => ({ rows: [] }));
      const profile = profileResult.rows[0];
      const displayName = profile?.name || name;
      const avatarUrl = profile?.avatar_url || undefined;

      room.participants.set(user.userId, { userId: user.userId, name: displayName, socketId: socket.id, avatarUrl });
      socketToRoom.set(socket.id, code.toUpperCase());
      socketToUser.set(socket.id, { userId: user.userId, name: displayName });
      socket.join(code.toUpperCase());

      socket.emit('room:joined', roomState(room));
      io.to(code.toUpperCase()).emit('room:participants', participantList(room));
    });

    socket.on('room:start', ({ token }: { token: string }) => {
      const user = verifyToken(token);
      if (!user) return;
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = rooms.get(code);
      if (!room || room.hostId !== user.userId || room.isRunning) return;
      room.isRunning = true;
      startRoomTimer(io, room);
      io.to(code).emit('room:state', roomState(room));
    });

    socket.on('room:pause', ({ token }: { token: string }) => {
      const user = verifyToken(token);
      if (!user) return;
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = rooms.get(code);
      if (!room || room.hostId !== user.userId || !room.isRunning) return;
      room.isRunning = false;
      stopRoomTimer(room);
      io.to(code).emit('room:state', roomState(room));
    });

    socket.on('room:reset', ({ token }: { token: string }) => {
      const user = verifyToken(token);
      if (!user) return;
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = rooms.get(code);
      if (!room || room.hostId !== user.userId) return;
      const cfg = TECHNIQUES[room.technique];
      stopRoomTimer(room);
      room.phase = 'focus';
      room.timeLeft = cfg.work * 60;
      room.totalDuration = cfg.work * 60;
      room.isRunning = false;
      room.sessionNum = 1;
      io.to(code).emit('room:state', roomState(room));
    });

    socket.on('room:skip', ({ token }: { token: string }) => {
      const user = verifyToken(token);
      if (!user) return;
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = rooms.get(code);
      if (!room || room.hostId !== user.userId) return;
      const cfg = TECHNIQUES[room.technique];
      stopRoomTimer(room);
      room.isRunning = false;
      if (room.phase === 'focus') {
        room.phase = 'break';
        room.timeLeft = cfg.break * 60;
        room.totalDuration = cfg.break * 60;
      } else {
        room.phase = 'focus';
        room.sessionNum = room.sessionNum < cfg.sessions ? room.sessionNum + 1 : 1;
        room.timeLeft = cfg.work * 60;
        room.totalDuration = cfg.work * 60;
      }
      io.to(code).emit('room:state', roomState(room));
    });

    socket.on('room:leave', () => {
      leaveRoom(io, socket.id);
    });

    socket.on('disconnect', () => {
      leaveRoom(io, socket.id);
      socketToUser.delete(socket.id);
    });
  });

  return io;
}
