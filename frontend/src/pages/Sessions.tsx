import { useEffect, useState } from 'react'
import api from '../lib/api'
import s from './Sessions.module.css'

interface Session {
  id: string
  technique: string
  subject: string
  planned_duration_minutes: number
  actual_duration_minutes: number
  completed: boolean
  focus_score: number
  notes: string
  started_at: string
}

const SCORE_COLORS: Record<number, string> = {
  1: '#A32D2D', 2: '#BA7517', 3: '#534AB7', 4: '#0F6E56', 5: '#0F6E56'
}
const SCORE_BG: Record<number, string> = {
  1: '#FCEBEB', 2: '#FAEEDA', 3: '#EEEDFE', 4: '#E1F5EE', 5: '#E1F5EE'
}
const SCORE_LABELS: Record<number, string> = {
  1: 'Très difficile', 2: 'Difficile', 3: 'Correct', 4: 'Bien', 5: 'Excellent'
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const LIMIT = 15

  const fetchSessions = (off = 0) => {
    setLoading(true)
    api.get(`/sessions?limit=${LIMIT}&offset=${off}`)
      .then(r => {
        setSessions(r.data.sessions)
        setTotal(r.data.total)
        setOffset(off)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchSessions() }, [])

  const filtered = sessions.filter(s =>
    !filter ||
    s.subject?.toLowerCase().includes(filter.toLowerCase()) ||
    s.technique.toLowerCase().includes(filter.toLowerCase())
  )

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  const techColor: Record<string, string> = {
    pomodoro: '#534AB7', deepwork: '#0F6E56', sprint: '#BA7517', spaced: '#A32D2D'
  }
  const techBg: Record<string, string> = {
    pomodoro: '#EEEDFE', deepwork: '#E1F5EE', sprint: '#FAEEDA', spaced: '#FCEBEB'
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Sessions</h1>
        <input
          type="text"
          placeholder="Filtrer par matière ou technique..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className={s.search}
        />
      </div>

      {loading ? (
        <div className={s.loading}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className={s.empty}>
          <p>Aucune session trouvée.</p>
          <p>Lance ton premier timer pour commencer !</p>
        </div>
      ) : (
        <>
          <div className={s.list}>
            {filtered.map(session => (
              <div key={session.id} className={s.row}>
                <div className={s.rowLeft}>
                  <span
                    className={s.techPill}
                    style={{ background: techBg[session.technique], color: techColor[session.technique] }}
                  >
                    {session.technique}
                  </span>
                  <div className={s.rowInfo}>
                    <span className={s.subject}>{session.subject || 'Sans matière'}</span>
                    <span className={s.date}>{formatDate(session.started_at)}</span>
                  </div>
                </div>

                <div className={s.rowRight}>
                  <span className={s.duration}>
                    {session.actual_duration_minutes ?? session.planned_duration_minutes} min
                  </span>

                  {session.focus_score ? (
                    <span
                      className={s.scorePill}
                      style={{ background: SCORE_BG[session.focus_score], color: SCORE_COLORS[session.focus_score] }}
                    >
                      {session.focus_score}/5 · {SCORE_LABELS[session.focus_score]}
                    </span>
                  ) : (
                    <span className={s.noScore}>Non évalué</span>
                  )}

                  <span className={`${s.statusDot} ${session.completed ? s.dotDone : s.dotAbandoned}`} title={session.completed ? 'Complète' : 'Abandonnée'} />
                </div>

                {session.notes && (
                  <div className={s.notes}>"{session.notes}"</div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > LIMIT && (
            <div className={s.pagination}>
              <button
                className={s.pageBtn}
                disabled={offset === 0}
                onClick={() => fetchSessions(offset - LIMIT)}
              >
                ← Précédent
              </button>
              <span className={s.pageInfo}>{offset + 1}–{Math.min(offset + LIMIT, total)} sur {total}</span>
              <button
                className={s.pageBtn}
                disabled={offset + LIMIT >= total}
                onClick={() => fetchSessions(offset + LIMIT)}
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
