import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT technique, subject, focus_score, actual_duration_minutes,
       EXTRACT(HOUR FROM started_at) as hour, DATE(started_at) as date, completed
       FROM sessions WHERE user_id = $1 AND completed = true
       ORDER BY started_at DESC LIMIT 100`,
      [req.userId]
    );
    const sessions = result.rows;
    if (sessions.length < 3) {
      res.json({ insights: [], message: 'Complete at least 3 sessions to unlock insights.', sessions_count: sessions.length });
      return;
    }
    res.json({ insights: generateInsights(sessions), sessions_count: sessions.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

interface Session { technique: string; subject: string; focus_score: number; actual_duration_minutes: number; hour: number; date: string; completed: boolean; }

function generateInsights(sessions: Session[]) {
  const insights = [];

  const avgScore = (s: Session[]) => {
    const w = s.filter(x => x.focus_score);
    return w.length ? w.reduce((a, x) => a + x.focus_score, 0) / w.length : 0;
  };

  const times = [
    { label: 'matin (6h-12h)', score: avgScore(sessions.filter(s => s.hour >= 6 && s.hour < 12)) },
    { label: 'après-midi (12h-18h)', score: avgScore(sessions.filter(s => s.hour >= 12 && s.hour < 18)) },
    { label: 'soir (18h-24h)', score: avgScore(sessions.filter(s => s.hour >= 18 && s.hour < 24)) },
  ].filter(t => t.score > 0).sort((a, b) => b.score - a.score);

  if (times[0]) insights.push({
    type: 'peak_time', title: 'Ton moment optimal',
    description: `Tu es plus productif le ${times[0].label} (score ${times[0].score.toFixed(1)}/5).`,
    action: `Planifie tes sessions importantes le ${times[0].label}`,
    confidence: Math.min(sessions.length / 20, 1)
  });

  const byTech: Record<string, number[]> = {};
  sessions.forEach(s => { if (!byTech[s.technique]) byTech[s.technique] = []; if (s.focus_score) byTech[s.technique].push(s.focus_score); });
  const techRanking = Object.entries(byTech).map(([tech, scores]) => ({ tech, avg: scores.reduce((a,b)=>a+b,0)/scores.length, count: scores.length })).filter(t => t.count >= 2).sort((a,b) => b.avg - a.avg);
  if (techRanking[0]) insights.push({
    type: 'best_technique', title: 'Ta technique la plus efficace',
    description: `"${techRanking[0].tech}" te donne les meilleurs résultats (${techRanking[0].avg.toFixed(1)}/5).`,
    action: `Utilise ${techRanking[0].tech} pour tes matières difficiles`,
    confidence: Math.min(techRanking[0].count / 10, 1)
  });

  const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
  if (dates[0]) {
    const gap = Math.floor((Date.now() - new Date(dates[0]).getTime()) / 86400000);
    if (gap >= 3) insights.push({
      type: 'procrastination_alert', title: 'Reprise nécessaire',
      description: `Tu n'as pas étudié depuis ${gap} jours.`,
      action: 'Lance une session courte de 10 minutes pour reprendre le rythme',
      confidence: 1
    });
  }

  const highScore = sessions.filter(s => s.focus_score >= 4 && s.actual_duration_minutes);
  if (highScore.length >= 3) {
    const avgDur = Math.round(highScore.reduce((a,s) => a + s.actual_duration_minutes, 0) / highScore.length);
    insights.push({
      type: 'optimal_duration', title: 'Durée optimale de session',
      description: `Tes meilleures sessions durent en moyenne ${avgDur} minutes.`,
      action: `Configure tes timers sur ${avgDur} minutes`,
      confidence: Math.min(highScore.length / 10, 1)
    });
  }

  return insights;
}

export default router;
