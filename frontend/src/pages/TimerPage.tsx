import { useEffect, useRef } from 'react'
import { useTimerStore, TECHNIQUES, Technique } from '../stores/timerStore'
import { useAmbiance, AmbianceType } from '../hooks/useAmbiance'
import SessionModal from '../components/SessionModal'
import DailyQuote from '../components/DailyQuote'
import s from './TimerPage.module.css'

const AMBIANCE_OPTIONS: { type: AmbianceType; label: string; icon: string }[] = [
  { type: 'rain',       label: 'Pluie',       icon: '🌧' },
  { type: 'ocean',      label: 'Océan',       icon: '🌊' },
  { type: 'whitenoise', label: 'Bruit blanc', icon: '📻' },
  { type: 'focus',      label: 'Binaural',    icon: '🧠' },
]

export default function TimerPage() {
  const {
    technique, phase, timeLeft, totalDuration, isRunning,
    sessionNum, subject, todaySessions, todayMinutes, streak, justFinished,
    setTechnique, setSubject, start, pause, reset, skip, tick,
  } = useTimerStore()

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { active: ambiance, toggle: toggleAmbiance, stop: stopAmbiance } = useAmbiance()

  useEffect(() => { return () => stopAmbiance() }, [])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, tick])

  const cfg = TECHNIQUES[technique]
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const progress = timeLeft / totalDuration
  const R = 100
  const C = 2 * Math.PI * R
  const strokeOffset = C * (1 - progress)

  const colors: Record<string, string> = {
    pomodoro: '#7c6af7', deepwork: '#3ecf8e', sprint: '#f5a623', spaced: '#f56565'
  }
  const color = colors[technique]
  const breakColor = '#3ecf8e'
  const activeColor = phase === 'focus' ? color : breakColor

  return (
    <div className={s.page}>
      <div className={s.left}>
        <h1 className={s.pageTitle}>Study Timer</h1>

        <DailyQuote />

        <div className={s.tabs}>
          {(Object.keys(TECHNIQUES) as Technique[]).map(t => (
            <button
              key={t}
              className={`${s.tab} ${technique === t ? s.tabActive : ''}`}
              onClick={() => { if (!isRunning) setTechnique(t) }}
            >
              {TECHNIQUES[t].label}
            </button>
          ))}
        </div>

        <p className={s.desc}>{cfg.desc}</p>

        <input
          className={s.subject}
          type="text"
          placeholder="Matière en cours..."
          value={subject}
          onChange={e => setSubject(e.target.value)}
          disabled={isRunning}
        />

        <div className={s.ringWrap}>
          <svg width="240" height="240" viewBox="0 0 240 240">
            <circle cx="120" cy="120" r={R} fill="none"
              stroke="rgba(255,255,255,0.05)" strokeWidth="10"/>
            <circle cx="120" cy="120" r={R} fill="none"
              stroke={activeColor} strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={strokeOffset}
              transform="rotate(-90 120 120)"
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.5s' }}
            />
          </svg>
          <div className={s.ringInner}>
            <span className={s.phasePill}
              style={{ background: `${activeColor}20`, color: activeColor }}>
              {phase === 'focus' ? 'Focus' : 'Pause'}
            </span>
            <div className={s.time}>
              {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
            </div>
            <div className={s.sessionLabel}>
              {phase === 'focus' ? `${sessionNum} / ${cfg.sessions} sessions` : 'Repose-toi'}
            </div>
          </div>
        </div>

        {isRunning && (
          <div className={s.runningDot}>
            <span className={s.dot}/>
            {phase === 'focus' ? 'Session en cours...' : 'Pause en cours...'}
          </div>
        )}

        <div className={s.controls}>
          <button className={s.btnSec} onClick={reset}>Reset</button>
          <button
            className={s.btnPrimary}
            style={{ background: activeColor }}
            onClick={isRunning ? pause : start}
          >
            {isRunning ? 'Pause' : timeLeft < totalDuration ? 'Reprendre' : 'Démarrer'}
          </button>
          <button className={s.btnSec} onClick={skip}>Passer →</button>
        </div>

        <div className={s.ambianceWrap}>
          <span className={s.ambianceLabel}>Ambiance</span>
          <div className={s.ambianceBtns}>
            {AMBIANCE_OPTIONS.map(opt => (
              <button
                key={opt.type}
                className={`${s.ambianceBtn} ${ambiance === opt.type ? s.ambianceActive : ''}`}
                onClick={() => toggleAmbiance(opt.type)}
                title={opt.label}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={s.right}>
        <p className={s.sectionTitle}>Aujourd'hui</p>
        <div className={s.statsGrid}>
          <div className={s.statCard}>
            <div className={s.statVal}>{todaySessions}</div>
            <div className={s.statLabel}>sessions</div>
          </div>
          <div className={s.statCard}>
            <div className={s.statVal}>{todayMinutes}</div>
            <div className={s.statLabel}>minutes</div>
          </div>
          <div className={s.statCard}>
            <div className={s.statVal}>{streak}</div>
            <div className={s.statLabel}>série</div>
          </div>
        </div>

        <p className={s.sectionTitle} style={{ marginTop: '0.5rem' }}>Technique</p>
        <div className={s.techInfo} style={{ borderLeftColor: color }}>
          <div className={s.techInfoTitle} style={{ color }}>{cfg.label}</div>
          <p className={s.techInfoText}>
            {technique === 'pomodoro' && '25 min de focus intense suivies de 5 min de pause. Après 4 sessions, prends une grande pause. Idéale pour les tâches répétitives.'}
            {technique === 'deepwork' && '90 min de travail sans interruption pour atteindre un état de flow. Optimal pour les projets complexes qui demandent une concentration maximale.'}
            {technique === 'sprint' && 'Sprints ultra-courts de 10 min, parfaits pour la mémorisation active et les révisions rapides. Maintient l\'énergie et prévient la fatigue.'}
            {technique === 'spaced' && 'Exploite la courbe d\'oubli d\'Ebbinghaus. Révise à intervalles croissants pour ancrer le savoir à long terme.'}
          </p>
        </div>
      </div>

      {justFinished && <SessionModal />}
    </div>
  )
}
