import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Railway / Render / Supabase provide a single DATABASE_URL
// Fall back to individual vars for local dev
export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // required by most cloud providers
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT || '5432'),
        user:     process.env.DB_USER     || 'studyflow',
        password: process.env.DB_PASSWORD || 'studyflow_secret',
        database: process.env.DB_NAME     || 'studyflow',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

pool.on('error', (err) => {
  console.error('DB pool error:', err);
  process.exit(-1);
});

export const query = (text: string, params?: unknown[]) => pool.query(text, params);
