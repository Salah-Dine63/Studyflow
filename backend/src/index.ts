import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import insightRoutes from './routes/insights';
import onboardingRoutes from './routes/onboarding';
import profileRoutes from './routes/profile';
import usersRoutes from './routes/users';
import { initSocket } from './socketHandler';

dotenv.config();

// Add missing columns safely on startup
import { pool } from './db/pool';
pool.query(`
  ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN DEFAULT false;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS school VARCHAR(255);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);
  ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS weekly_goal_hours INTEGER DEFAULT 5;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);
  CREATE UNIQUE INDEX IF NOT EXISTS users_username_idx ON users(username) WHERE username IS NOT NULL;
`).catch(() => {});

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Accept comma-separated list of allowed origins (e.g. localhost + phone IP)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',').map(o => o.trim());

const corsOptions = {
  origin: (origin: string | undefined, cb: (e: Error | null, ok?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, curl, Vite proxy)
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      cb(null, true);
    } else {
      cb(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', usersRoutes);

initSocket(httpServer, allowedOrigins);

httpServer.listen(PORT, () => console.log(`StudyFlow API running on http://localhost:${PORT}`));
export default app;
