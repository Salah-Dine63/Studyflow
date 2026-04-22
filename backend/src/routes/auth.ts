import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../db/pool';

const JWT_SECRET = process.env.JWT_SECRET || 'studyflow_dev_fallback_secret';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function generateUsername(name: string): Promise<string> {
  const base = name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15) || 'user';
  let username = base;
  let i = 1;
  while (true) {
    const taken = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (taken.rows.length === 0) return username;
    username = `${base}${i++}`;
  }
}

const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) { res.status(400).json({ error: 'Email, password and name are required' }); return; }
  if (password.length < 6) { res.status(400).json({ error: 'Password must be at least 6 characters' }); return; }
  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) { res.status(409).json({ error: 'Email already in use' }); return; }
    const passwordHash = await bcrypt.hash(password, 12);
    const username = await generateUsername(name);
    const result = await query(
      'INSERT INTO users (email, password_hash, name, username) VALUES ($1, $2, $3, $4) RETURNING id, email, name, username',
      [email, passwordHash, name, username]
    );
    const user = result.rows[0];
    await query('INSERT INTO user_preferences (user_id) VALUES ($1)', [user.id]);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ error: 'Email and password are required' }); return; }
  try {
    const result = await query('SELECT id, email, name, password_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/google', async (req: Request, res: Response): Promise<void> => {
  const { credential } = req.body;
  if (!credential) { res.status(400).json({ error: 'Google credential required' }); return; }
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) { res.status(400).json({ error: 'Invalid Google token' }); return; }

    const { email, name, sub: googleId } = payload;

    let result = await query('SELECT id, email, name FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      const displayName = name || email.split('@')[0];
      const username = await generateUsername(displayName);
      const randomHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      result = await query(
        `INSERT INTO users (email, name, username, oauth_provider, oauth_id, password_hash)
         VALUES ($1, $2, $3, 'google', $4, $5) RETURNING id, email, name, username`,
        [email, displayName, username, googleId, randomHash]
      );
      await query('INSERT INTO user_preferences (user_id) VALUES ($1)', [result.rows[0].id]);
    }

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'No token' }); return; }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const result = await query(
      'SELECT id, email, name, username, avatar_url, onboarding_done, points, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user: result.rows[0] });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
