import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

interface OnboardingAnswers {
  schoolLevel: string;
  major: string;
  studyStyle: string;
  dailyHours: string;
  goals: string[];
  challenges: string[];
  preferredTime: string;
  focusAbility: string;
  motivation: string;
}

// POST /onboarding — submit answers, call Claude, save profile
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId;
  const answers: OnboardingAnswers = req.body;

  if (!answers.schoolLevel || !answers.major) {
    res.status(400).json({ error: 'schoolLevel and major are required' });
    return;
  }

  // Ensure array fields always have a default
  answers.goals      = answers.goals      ?? [];
  answers.challenges = answers.challenges ?? [];

  try {
    const aiProfile = await analyzeWithClaude(answers);

    await query(
      `INSERT INTO user_profiles 
        (user_id, school_level, major, study_style, goals, challenges, raw_answers, ai_profile, recommended_technique, recommended_duration)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (user_id) DO UPDATE SET
         school_level = EXCLUDED.school_level,
         major = EXCLUDED.major,
         study_style = EXCLUDED.study_style,
         goals = EXCLUDED.goals,
         challenges = EXCLUDED.challenges,
         raw_answers = EXCLUDED.raw_answers,
         ai_profile = EXCLUDED.ai_profile,
         recommended_technique = EXCLUDED.recommended_technique,
         recommended_duration = EXCLUDED.recommended_duration,
         updated_at = NOW()`,
      [
        userId,
        answers.schoolLevel,
        answers.major,
        answers.studyStyle,
        answers.goals,
        answers.challenges,
        JSON.stringify(answers),
        JSON.stringify(aiProfile),
        aiProfile.recommendedTechnique,
        aiProfile.recommendedDuration,
      ]
    );

    // Update user_preferences with AI recommendation
    await query(
      `INSERT INTO user_preferences (user_id, preferred_technique, default_work_minutes)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET
         preferred_technique = EXCLUDED.preferred_technique,
         default_work_minutes = EXCLUDED.default_work_minutes`,
      [userId, aiProfile.recommendedTechnique, aiProfile.recommendedDuration]
    );

    // Mark onboarding as done
    await query('UPDATE users SET onboarding_done = true WHERE id = $1', [userId]);

    res.json({ profile: aiProfile });
  } catch (err) {
    console.error('Onboarding error:', err);
    res.status(500).json({ error: 'Failed to process onboarding' });
  }
});

// GET /onboarding/status — check if onboarding is done
router.get('/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT onboarding_done FROM users WHERE id = $1',
      [req.userId]
    );
    const profileResult = await query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [req.userId]
    );
    res.json({
      onboardingDone: result.rows[0]?.onboarding_done ?? false,
      profile: profileResult.rows[0] ?? null,
    });
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function analyzeWithClaude(answers: OnboardingAnswers) {
  return ruleBasedProfile(answers);
}

function ruleBasedProfile(answers: OnboardingAnswers) {
  const techniques = ['pomodoro', 'deepwork', 'sprint', 'spaced'];
  const durations:   Record<string, number> = { pomodoro: 25, deepwork: 90, sprint: 10, spaced: 20 };

  const technique = techniques[Math.floor(Math.random() * techniques.length)];
  const duration  = durations[technique];

  return {
    recommendedTechnique: technique,
    recommendedDuration: duration,
    personalityType: 'Balanced Learner',
    strengths: ['Consistent effort', 'Goal-oriented', 'Self-aware'],
    weaknesses: ['Focus management', 'Time estimation'],
    studyTips: [
      'Start with your hardest subject when energy is highest',
      'Take real breaks — no phone during Pomodoro breaks',
      'Review notes within 24h to boost retention',
    ],
    dailyGoalMinutes: 120,
    motivationMessage: `Welcome ${answers.major} student! Every expert was once a beginner. Let's build great study habits together.`,
  };
}

export default router;
