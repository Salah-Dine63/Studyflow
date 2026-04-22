import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { technique, subject, planned_duration_minutes, started_at } = req.body;
  if (!technique || !planned_duration_minutes) {
    res.status(400).json({ error: 'technique and planned_duration_minutes are required' }); return;
  }
  try {
    const result = await query(
      `INSERT INTO sessions (user_id, technique, subject, planned_duration_minutes, started_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, technique, subject || null, planned_duration_minutes, started_at || new Date()]
    );
    res.status(201).json({ session: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/complete', async (req: AuthRequest, res: Response): Promise<void> => {
  const { actual_duration_minutes, focus_score, notes } = req.body;
  try {
    const result = await query(
      `UPDATE sessions SET completed = true, actual_duration_minutes = $1, focus_score = $2,
       notes = $3, ended_at = NOW() WHERE id = $4 AND user_id = $5 RETURNING *`,
      [actual_duration_minutes, focus_score || null, notes || null, req.params.id, req.userId]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Session not found' }); return; }
    await updateDailyStats(req.userId!, result.rows[0]);
    res.json({ session: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
  try {
    const result = await query(
      'SELECT * FROM sessions WHERE user_id = $1 ORDER BY started_at DESC LIMIT $2 OFFSET $3',
      [req.userId, limit, offset]
    );
    const count = await query('SELECT COUNT(*) FROM sessions WHERE user_id = $1', [req.userId]);
    res.json({ sessions: result.rows, total: parseInt(count.rows[0].count), limit, offset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  const days = parseInt(req.query.days as string) || 7;
  try {
    const [summary, daily, byTechnique, bySubject, streakDays, weeklyResult, goalResult] = await Promise.all([
      query(
        `SELECT COUNT(*) FILTER (WHERE completed) as completed_sessions,
         COALESCE(SUM(actual_duration_minutes) FILTER (WHERE completed), 0) as total_focus_minutes,
         ROUND(AVG(focus_score) FILTER (WHERE focus_score IS NOT NULL), 2) as avg_focus_score,
         COUNT(DISTINCT DATE(started_at)) as active_days
         FROM sessions WHERE user_id = $1 AND started_at >= NOW() - INTERVAL '1 day' * $2`,
        [req.userId, days]
      ),
      query(
        `SELECT DATE(started_at) as date,
         COUNT(*) FILTER (WHERE completed) as sessions,
         COALESCE(SUM(actual_duration_minutes) FILTER (WHERE completed), 0) as focus_minutes,
         ROUND(AVG(focus_score) FILTER (WHERE focus_score IS NOT NULL), 2) as avg_score
         FROM sessions WHERE user_id = $1 AND started_at >= NOW() - INTERVAL '1 day' * $2
         GROUP BY DATE(started_at) ORDER BY date ASC`,
        [req.userId, days]
      ),
      query(
        `SELECT technique, COUNT(*) FILTER (WHERE completed) as completed,
         ROUND(AVG(focus_score) FILTER (WHERE focus_score IS NOT NULL), 2) as avg_score
         FROM sessions WHERE user_id = $1 AND started_at >= NOW() - INTERVAL '1 day' * $2
         GROUP BY technique`,
        [req.userId, days]
      ),
      query(
        `SELECT subject, COALESCE(SUM(actual_duration_minutes) FILTER (WHERE completed), 0) as minutes
         FROM sessions WHERE user_id = $1 AND subject IS NOT NULL
         AND started_at >= NOW() - INTERVAL '1 day' * $2
         GROUP BY subject ORDER BY minutes DESC LIMIT 10`,
        [req.userId, days]
      ),
      query(
        `SELECT DISTINCT DATE(started_at) as day FROM sessions
         WHERE user_id = $1 AND completed = true ORDER BY day DESC`,
        [req.userId]
      ),
      query(
        `SELECT COALESCE(SUM(actual_duration_minutes) FILTER (WHERE completed), 0) as minutes
         FROM sessions WHERE user_id = $1 AND started_at >= DATE_TRUNC('week', NOW())`,
        [req.userId]
      ),
      query(
        `SELECT COALESCE(weekly_goal_hours, 5) as weekly_goal_hours FROM user_preferences WHERE user_id = $1`,
        [req.userId]
      ),
    ]);

    // Calculate daily streak
    const dayStrings: string[] = streakDays.rows.map((r: { day: Date }) =>
      new Date(r.day).toISOString().split('T')[0]
    );
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dayStrings.length > 0 && (dayStrings[0] === today || dayStrings[0] === yesterday)) {
      streak = 1;
      for (let i = 1; i < dayStrings.length; i++) {
        const expected = new Date(new Date(dayStrings[i - 1]).getTime() - 86400000).toISOString().split('T')[0];
        if (dayStrings[i] === expected) streak++;
        else break;
      }
    }

    res.json({
      summary: summary.rows[0],
      daily: daily.rows,
      by_technique: byTechnique.rows,
      by_subject: bySubject.rows,
      period_days: days,
      streak,
      weekly_minutes: parseInt(weeklyResult.rows[0]?.minutes ?? '0'),
      weekly_goal_hours: parseInt(goalResult.rows[0]?.weekly_goal_hours ?? '5'),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/heatmap', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT DATE(started_at) as day,
       COALESCE(SUM(actual_duration_minutes) FILTER (WHERE completed = true), 0) as minutes
       FROM sessions WHERE user_id = $1 AND started_at >= NOW() - INTERVAL '112 days'
       GROUP BY DATE(started_at) ORDER BY day ASC`,
      [req.userId]
    );
    res.json(result.rows.map((r: { day: Date; minutes: string }) => ({
      day: new Date(r.day).toISOString().split('T')[0],
      minutes: parseInt(r.minutes),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function updateDailyStats(userId: string, session: Record<string, unknown>) {
  const date = new Date(session.started_at as string).toISOString().split('T')[0];
  try {
    await query(
      `INSERT INTO daily_stats (user_id, date, total_sessions, total_focus_minutes)
       VALUES ($1, $2, 1, $3)
       ON CONFLICT (user_id, date) DO UPDATE SET
         total_sessions = daily_stats.total_sessions + 1,
         total_focus_minutes = daily_stats.total_focus_minutes + EXCLUDED.total_focus_minutes,
         updated_at = NOW()`,
      [userId, date, session.actual_duration_minutes || 0]
    );
  } catch (err) { console.error('Daily stats update error:', err); }
}

export default router;
