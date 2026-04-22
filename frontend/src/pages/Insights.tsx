import { useEffect, useState } from 'react'
import api from '../lib/api'
import s from './Insights.module.css'

interface Insight {
  type: string
  title: string
  description: string
  action?: string
  confidence: number
}

interface InsightsData {
  insights: Insight[]
  message?: string
  sessions_count: number
}

const ICONS: Record<string, string> = {
  peak_time: '◑',
  best_technique: '◈',
  procrastination_alert: '◎',
  optimal_duration: '◷',
}

const COLORS: Record<string, { bg: string; color: string; border: string }> = {
  peak_time:             { bg: '#EEEDFE', color: '#3C3489', border: '#AFA9EC' },
  best_technique:        { bg: '#E1F5EE', color: '#085041', border: '#5DCAA5' },
  procrastination_alert: { bg: '#FCEBEB', color: '#791F1F', border: '#F09595' },
  optimal_duration:      { bg: '#FAEEDA', color: '#633806', border: '#EF9F27' },
}

export default function Insights() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/insights')
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className={s.loading}>Analyse de tes habitudes...</div>

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Insights IA</h1>
        <span className={s.badge}>{data?.sessions_count ?? 0} sessions analysées</span>
      </div>

      {data?.message && (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>✦</div>
          <p className={s.emptyTitle}>{data.message}</p>
          <p className={s.emptySub}>
            L'IA analyse tes habitudes d'étude pour te donner des recommandations personnalisées.
            Continue à logger tes sessions !
          </p>
          <div className={s.progressWrap}>
            <div className={s.progressBar}>
              <div className={s.progressFill} style={{ width: `${Math.min((data.sessions_count / 3) * 100, 100)}%` }} />
            </div>
            <span className={s.progressLabel}>{data.sessions_count} / 3 sessions</span>
          </div>
        </div>
      )}

      {data && data.insights.length > 0 && (
        <div className={s.insightsList}>
          {data.insights.map((insight, i) => {
            const colors = COLORS[insight.type] ?? COLORS.peak_time
            return (
              <div key={i} className={s.card} style={{ borderLeft: `3px solid ${colors.border}` }}>
                <div className={s.cardTop}>
                  <span className={s.cardIcon} style={{ background: colors.bg, color: colors.color }}>
                    {ICONS[insight.type] ?? '✦'}
                  </span>
                  <div className={s.cardMeta}>
                    <h2 className={s.cardTitle}>{insight.title}</h2>
                    <div className={s.confidence}>
                      Confiance : {Math.round(insight.confidence * 100)}%
                      <div className={s.confBar}>
                        <div className={s.confFill} style={{ width: `${insight.confidence * 100}%`, background: colors.border }} />
                      </div>
                    </div>
                  </div>
                </div>

                <p className={s.cardDesc}>{insight.description}</p>

                {insight.action && (
                  <div className={s.action} style={{ background: colors.bg, color: colors.color }}>
                    <span className={s.actionLabel}>Recommandation</span>
                    <span className={s.actionText}>{insight.action}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className={s.footer}>
        <h3 className={s.footerTitle}>Comment fonctionne l'IA ?</h3>
        <p className={s.footerText}>
          Le système analyse tes sessions pour détecter tes heures de pic de productivité,
          identifier la technique la plus efficace pour toi, et repérer les signes de procrastination.
          Plus tu utilises StudyFlow, plus les recommandations s'améliorent.
          À partir de 20 sessions, un modèle de clustering sera utilisé pour affiner les prédictions.
        </p>
      </div>
    </div>
  )
}
