import { useState } from 'react'
import { useTimerStore } from '../stores/timerStore'
import s from './SessionModal.module.css'

const LABELS = ['', 'Très difficile', 'Difficile', 'Correct', 'Bien', 'Excellent !']

export default function SessionModal() {
  const [score, setScore] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const { completeSession, dismissFinished } = useTimerStore()

  const handleSave = async () => {
    if (!score) return
    setSaving(true)
    await completeSession(score, notes)
    setSaving(false)
  }

  return (
    <div className={s.overlay}>
      <div className={s.modal}>
        <div className={s.icon}>✓</div>
        <h2 className={s.title}>Session terminée !</h2>
        <p className={s.sub}>Comment s'est passée ta concentration ?</p>

        <div className={s.scores}>
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              className={`${s.scoreBtn} ${score === n ? s.scoreBtnActive : ''}`}
              onClick={() => setScore(n)}
            >{n}</button>
          ))}
        </div>
        <p className={s.scoreLabel}>{score ? LABELS[score] : 'Sélectionne un score'}</p>

        <textarea
          className={s.notes}
          placeholder="Notes (optionnel) — qu'as-tu révisé ?"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
        />

        <div className={s.actions}>
          <button className={s.btnSkip} onClick={dismissFinished}>Ignorer</button>
          <button className={s.btnSave} disabled={!score || saving} onClick={handleSave}>
            {saving ? 'Enregistrement...' : 'Enregistrer la session'}
          </button>
        </div>
      </div>
    </div>
  )
}
