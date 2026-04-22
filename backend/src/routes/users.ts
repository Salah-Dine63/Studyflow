import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/users/search?q=username
router.get('/search', async (req: AuthRequest, res: Response): Promise<void> => {
  const q = (req.query.q as string || '').trim().toLowerCase().replace('@', '');
  if (!q || q.length < 2) { res.json([]); return; }
  try {
    const result = await query(
      `SELECT id, name, username, avatar_url, school, points
       FROM users
       WHERE username ILIKE $1 AND id != $2
       LIMIT 10`,
      [`%${q}%`, req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:username — public profile
router.get('/:username', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userResult = await query(
      `SELECT id, name, username, avatar_url, school, bio, points FROM users WHERE username = $1`,
      [req.params.username]
    );
    if (userResult.rows.length === 0) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }
    const user = userResult.rows[0];

    const statsResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE completed = true) AS total_sessions,
         COALESCE(SUM(actual_duration_minutes) FILTER (WHERE completed = true), 0) AS total_minutes,
         COUNT(DISTINCT DATE(started_at)) FILTER (WHERE completed = true) AS active_days
       FROM sessions WHERE user_id = $1`,
      [user.id]
    );

    res.json({ ...user, stats: statsResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
