import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/profile
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userResult = await query(
      `SELECT id, name, email, username, bio, school, avatar_url, points FROM users WHERE id = $1`,
      [req.userId]
    );
    const statsResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE completed = true)            AS total_sessions,
         COALESCE(SUM(actual_duration_minutes) FILTER (WHERE completed = true), 0) AS total_minutes,
         ROUND(AVG(focus_score) FILTER (WHERE completed = true AND focus_score IS NOT NULL), 1) AS avg_score,
         COUNT(DISTINCT DATE(started_at)) FILTER (WHERE completed = true) AS active_days
       FROM sessions WHERE user_id = $1`,
      [req.userId]
    );

    const user = userResult.rows[0];
    const stats = statsResult.rows[0];

    // Recalculate points: 10 per session + 5 bonus if score >= 4
    const pointsResult = await query(
      `SELECT COALESCE(SUM(CASE WHEN focus_score >= 4 THEN 15 ELSE 10 END), 0) AS points
       FROM sessions WHERE user_id = $1 AND completed = true`,
      [req.userId]
    );
    const points = parseInt(pointsResult.rows[0]?.points ?? '0');

    // Keep points in sync
    await query('UPDATE users SET points = $1 WHERE id = $2', [points, req.userId]);

    res.json({ ...user, points, stats });
  } catch (err) {
    console.error('Profile GET error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile
router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, bio, school, avatar_url, username } = req.body;
  try {
    // Check username uniqueness if provided
    if (username) {
      const clean = username.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 30);
      const taken = await query('SELECT id FROM users WHERE username = $1 AND id != $2', [clean, req.userId]);
      if (taken.rows.length > 0) { res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris' }); return; }
    }
    const result = await query(
      `UPDATE users SET
         name       = COALESCE($1, name),
         bio        = COALESCE($2, bio),
         school     = COALESCE($3, school),
         avatar_url = COALESCE($4, avatar_url),
         username   = COALESCE($5, username)
       WHERE id = $6
       RETURNING id, name, email, username, bio, school, avatar_url, points`,
      [name || null, bio ?? null, school ?? null, avatar_url ?? null, username?.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 30) || null, req.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Profile PUT error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
