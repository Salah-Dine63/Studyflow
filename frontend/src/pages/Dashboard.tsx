import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import api from '../lib/api'
import Heatmap from '../components/Heatmap'
import s from './Dashboard.module.css'

interface Stats {
  summary: { completed_sessions: string; total_focus_minutes: string; avg_focus_score: string; active_days: string }
  daily: { date: string; sessions: string; focus_minutes: string; avg_score: string }[]
  by_technique: { technique: string; completed: string; avg_score: string }[]
  by_subject: { subject: string; minutes: string }[]
  streak: number
  weekly_minutes: number
  weekly_goal_hours: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [heatmap, setHeatmap] = useState<{ day: string; minutes: number }[]>([])
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/sessions/heatmap').then(r => setHeatmap(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    api.get(`/sessions/stats?days=${days}`)
      .then(r => { setStats(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [days])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })

  if (loading) return <div className={s.loading}>Chargement...</div>
  if (!stats) return <div className={s.loading}>Erreur de chargement</div>

  const { summary, daily, by_technique, by_subject, streak, weekly_minutes, weekly_goal_hours } = stats
  const weeklyGoalMinutes = weekly_goal_hours * 60
  const weeklyProgress = Math.min((weekly_minutes / weeklyGoalMinutes) * 100, 100)
  const weeklyHours = Math.round(weekly_minutes / 60 * 10) / 10

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Dashboard</h1>
        <div className={s.periodTabs}>
          {[7, 14, 30].map(d => (
            <button key={d} className={`${s.periodBtn} ${days === d ? s.periodActive : ''}`} onClick={() => setDays(d)}>
              {d} jours
            </button>
          ))}
        </div>
      </div>

      {/* Streak + Weekly goal */}
      <div className={s.goalRow}>
        <div className={s.streakCard}>
          <span className={s.streakFire}>🔥</span>
          <div>
            <div className={s.streakNum}>{streak} <span>jour{streak !== 1 ? 's' : ''}</span></div>
            <div className={s.streakLabel}>Série actuelle</div>
          </div>
        </div>
        <div className={s.goalCard}>
          <div className={s.goalHeader}>
            <span className={s.goalTitle}>Objectif semaine</span>
            <span className={s.goalFraction}>{weeklyHours}h / {weekly_goal_hours}h</span>
          </div>
          <div className={s.goalTrack}>
            <div
              className={s.goalBar}
              style={{ width: `${weeklyProgress}%`, background: weeklyProgress >= 100 ? '#10b981' : '#534AB7' }}
            />
          </div>
          <div className={s.goalSub}>{weeklyProgress >= 100 ? '🎉 Objectif atteint !' : `${Math.round(weeklyGoalMinutes - weekly_minutes)} min restantes`}</div>
        </div>
      </div>

      {/* Summary cards */}
      <div className={s.summaryGrid}>
        <div className={s.card}>
          <div className={s.cardVal}>{summary.completed_sessions}</div>
          <div className={s.cardLabel}>Sessions complètes</div>
        </div>
        <div className={s.card}>
          <div className={s.cardVal}>{Math.round(Number(summary.total_focus_minutes) / 60 * 10) / 10}h</div>
          <div className={s.cardLabel}>Focus total</div>
        </div>
        <div className={s.card}>
          <div className={s.cardVal}>{summary.avg_focus_score ?? '—'}</div>
          <div className={s.cardLabel}>Score moyen</div>
        </div>
        <div className={s.card}>
          <div className={s.cardVal}>{summary.active_days}</div>
          <div className={s.cardLabel}>Jours actifs</div>
        </div>
      </div>

      {/* Focus minutes chart */}
      <div className={s.chartCard}>
        <h2 className={s.chartTitle}>Minutes de focus par jour</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={daily.map(d => ({ ...d, date: formatDate(d.date), focus_minutes: Number(d.focus_minutes) }))}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => [`${v} min`, 'Focus']} />
            <Bar dataKey="focus_minutes" fill="#534AB7" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Focus score over time */}
      {daily.some(d => d.avg_score) && (
        <div className={s.chartCard}>
          <h2 className={s.chartTitle}>Score de focus</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={daily.filter(d => d.avg_score).map(d => ({ ...d, date: formatDate(d.date), avg_score: Number(d.avg_score) }))}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[1,5]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v}/5`, 'Score']} />
              <Line type="monotone" dataKey="avg_score" stroke="#0F6E56" strokeWidth={2} dot={{ r: 4, fill: '#0F6E56' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className={s.row}>
        {/* By technique */}
        {by_technique.length > 0 && (
          <div className={s.chartCard} style={{ flex: 1 }}>
            <h2 className={s.chartTitle}>Par technique</h2>
            {by_technique.map(t => (
              <div key={t.technique} className={s.techRow}>
                <span className={s.techName}>{t.technique}</span>
                <span className={s.techStat}>{t.completed} sessions</span>
                <span className={s.techScore}>{t.avg_score ? `${Number(t.avg_score).toFixed(1)}/5` : '—'}</span>
              </div>
            ))}
          </div>
        )}

        {/* By subject */}
        {by_subject.length > 0 && (
          <div className={s.chartCard} style={{ flex: 1 }}>
            <h2 className={s.chartTitle}>Par matière</h2>
            {by_subject.map(sub => (
              <div key={sub.subject} className={s.techRow}>
                <span className={s.techName}>{sub.subject}</span>
                <span className={s.techStat}>{sub.minutes} min</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity heatmap */}
      <div className={s.chartCard}>
        <h2 className={s.chartTitle}>Activité — 16 dernières semaines</h2>
        <Heatmap data={heatmap} />
      </div>

      {by_technique.length === 0 && (
        <div className={s.empty}>
          <p>Aucune session pour cette période.</p>
          <p>Lance ton premier timer pour voir tes stats ici !</p>
        </div>
      )}
    </div>
  )
}
