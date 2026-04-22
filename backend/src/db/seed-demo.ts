/**
 * Demo user seed script
 * Run with: npx ts-node src/db/seed-demo.ts
 */
import bcrypt from 'bcryptjs';
import { pool } from './pool';

const EMAIL    = 'demo@studyflow.app';
const PASSWORD = 'demo1234';
const NAME     = 'Yasmine Benali';

const TECHNIQUES = ['pomodoro', 'deepwork', 'sprint', 'spaced'] as const;
const SUBJECTS   = [
  'Mathématiques', 'Algorithmique', 'Physique', 'Anglais technique',
  'Base de données', 'Réseau', 'Analyse numérique', 'Probabilités',
  'Programmation web', 'Intelligence artificielle',
];
const NOTES_POOL = [
  'Bonne session, bien compris le chapitre.',
  'Un peu difficile, à revoir demain.',
  'Très productif aujourd\'hui !',
  'Distrait au début, mieux ensuite.',
  'Exercices terminés, super !',
  'Révision avant l\'examen, stressant.',
  'Fini le TD complet.',
  null, null, null, // more often no note
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function durationFor(tech: string): number {
  switch (tech) {
    case 'pomodoro':  return 25;
    case 'deepwork':  return rand(60, 120);
    case 'sprint':    return rand(15, 30);
    case 'spaced':    return rand(20, 45);
    default:          return 25;
  }
}

/** Returns a date N days ago at a random hour between 8:00 and 22:00 */
function daysAgo(n: number, hourMin = 8, hourMax = 22): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(rand(hourMin, hourMax), rand(0, 59), 0, 0);
  return d;
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting demo seed...');

    // ── 1. Clean up existing demo user ──────────────────────
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [EMAIL]);
    if (existing.rows.length > 0) {
      const uid = existing.rows[0].id;
      await client.query('DELETE FROM sessions WHERE user_id = $1', [uid]);
      await client.query('DELETE FROM user_preferences WHERE user_id = $1', [uid]);
      await client.query('DELETE FROM user_profiles WHERE user_id = $1', [uid]);
      await client.query('DELETE FROM user_insights WHERE user_id = $1', [uid]);
      await client.query('DELETE FROM daily_stats WHERE user_id = $1', [uid]);
      await client.query('DELETE FROM users WHERE id = $1', [uid]);
      console.log('♻️  Removed previous demo user.');
    }

    // ── 2. Create user ───────────────────────────────────────
    const hash = await bcrypt.hash(PASSWORD, 12);
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, name, username, bio, school, onboarding_done, points)
       VALUES ($1, $2, $3, $4, $5, $6, true, 0)
       RETURNING id`,
      [
        EMAIL, hash, NAME, 'yasmine_b',
        'Étudiante en Génie Informatique, passionnée par l\'IA et les systèmes distribués. Je vise l\'excellence !',
        'École Nationale Polytechnique',
      ]
    );
    const userId: string = userRes.rows[0].id;
    console.log(`✅ User created: ${EMAIL} / ${PASSWORD}  (id: ${userId})`);

    // ── 3. Preferences ───────────────────────────────────────
    await client.query(
      `INSERT INTO user_preferences (user_id, preferred_technique, default_work_minutes, default_break_minutes, daily_goal_minutes, weekly_goal_hours)
       VALUES ($1, 'pomodoro', 25, 5, 120, 8)`,
      [userId]
    );

    // ── 4. Onboarding profile ────────────────────────────────
    await client.query(
      `INSERT INTO user_profiles (user_id, school_level, major, study_style, goals, challenges, ai_profile, recommended_technique, recommended_duration)
       VALUES ($1, 'licence3', 'Informatique', 'deep', ARRAY['Valider mon semestre','Améliorer ma concentration'], ARRAY['distraction','procrastination'],
               '{"summary":"Profil analytique, préfère les longues sessions"}', 'deepwork', 60)`,
      [userId]
    );

    // ── 5. Generate sessions ─────────────────────────────────
    // Active most days over the last 90 days, with some gaps
    const activeDays = new Set<number>();
    // Seed about 65 active days out of 90
    for (let d = 0; d <= 90; d++) {
      if (Math.random() < 0.72) activeDays.add(d);
    }

    let totalSessions = 0;

    for (const dayOffset of activeDays) {
      // 1 to 4 sessions per active day
      const sessionsThisDay = rand(1, 4);
      let hourCursor = rand(8, 11); // start between 8-11am

      for (let s = 0; s < sessionsThisDay; s++) {
        const tech     = pick(TECHNIQUES);
        const planned  = durationFor(tech);
        const completed = Math.random() > 0.08; // 92% completion rate
        const actual   = completed ? planned + rand(-3, 5) : rand(5, planned - 5);
        const score    = completed ? rand(3, 5) : rand(1, 3);
        const subject  = pick(SUBJECTS);
        const note     = pick(NOTES_POOL);

        const startedAt = daysAgo(dayOffset, hourCursor, hourCursor + 1);
        const endedAt   = new Date(startedAt.getTime() + actual * 60 * 1000);

        await client.query(
          `INSERT INTO sessions
             (user_id, technique, subject, planned_duration_minutes, actual_duration_minutes,
              completed, focus_score, notes, started_at, ended_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [userId, tech, subject, planned, actual, completed, completed ? score : null, note, startedAt, endedAt]
        );

        totalSessions++;
        hourCursor += rand(1, 3); // gap between sessions
        if (hourCursor >= 23) break;
      }
    }

    console.log(`📚 ${totalSessions} sessions inserted over ${activeDays.size} active days.`);

    // ── 6. Recalculate & update points ──────────────────────
    const pts = await client.query(
      `SELECT COALESCE(SUM(CASE WHEN focus_score >= 4 THEN 15 ELSE 10 END), 0) AS p
       FROM sessions WHERE user_id = $1 AND completed = true`,
      [userId]
    );
    const points = parseInt(pts.rows[0].p);
    await client.query('UPDATE users SET points = $1 WHERE id = $2', [points, userId]);

    console.log(`🏆 Points calculated: ${points}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✅ DEMO ACCOUNT READY');
    console.log(`  📧 Email    : ${EMAIL}`);
    console.log(`  🔑 Password : ${PASSWORD}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (err) {
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
