import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingStore } from '../stores/onboardingStore'
import { useAuthStore } from '../stores/authStore'
import s from './Onboarding.module.css'

const STEPS = ['Parcours', 'Habitudes', 'Objectifs', 'Mindset']

export default function Onboarding() {
  const { step, answers, aiProfile, loading, setStep, setAnswer, submit } = useOnboardingStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const toggle = (key: 'goals' | 'challenges', val: string) => {
    const current = (answers[key] as string[]) || []
    const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val]
    setAnswer(key, next)
  }

  const isSelected = (key: 'goals' | 'challenges', val: string) =>
    ((answers[key] as string[]) || []).includes(val)

  const canNext = () => {
    if (step === 0) return answers.schoolLevel && answers.major
    if (step === 1) return answers.studyStyle && answers.dailyHours
    if (step === 2) return (answers.goals?.length ?? 0) > 0
    if (step === 3) return answers.preferredTime && answers.focusAbility && answers.motivation
    return false
  }

  const handleNext = async () => {
    if (step < 3) { setStep(step + 1); return }
    setError('')
    try {
      await submit()
    } catch {
      setError('Une erreur est survenue. Réessaie.')
    }
  }

  if (aiProfile) return <ResultScreen profile={aiProfile} name={user?.name ?? ''} onDone={() => navigate('/')} />

  return (
    <div className={s.page}>
      <div className={s.card}>
        {/* Progress */}
        <div className={s.progress}>
          {STEPS.map((label, i) => (
            <div key={i} className={`${s.progressStep} ${i <= step ? s.progressActive : ''}`}>
              <div className={s.progressDot}>{i < step ? '✓' : i + 1}</div>
              <span className={s.progressLabel}>{label}</span>
            </div>
          ))}
        </div>
        <div className={s.progressBar}>
          <div className={s.progressFill} style={{ width: `${((step + 1) / 4) * 100}%` }} />
        </div>

        <div className={s.content} key={step}>

          {/* STEP 0 — Parcours */}
          {step === 0 && (
            <div className={s.stepContent}>
              <h1 className={s.title}>Bienvenue, {user?.name?.split(' ')[0]} 👋</h1>
              <p className={s.sub}>Dis-nous où tu en es pour qu'on personnalise ton expérience.</p>

              <div className={s.fieldGroup}>
                <label className={s.label}>Quel est ton niveau d'études ?</label>
                <div className={s.chipGrid}>
                  {['Collège', 'Lycée', 'Licence', 'Master', 'Doctorat', 'Autre'].map(level => (
                    <button key={level}
                      className={`${s.chip} ${answers.schoolLevel === level ? s.chipActive : ''}`}
                      onClick={() => setAnswer('schoolLevel', level)}>{level}</button>
                  ))}
                </div>
              </div>

              <div className={s.fieldGroup}>
                <label className={s.label}>Quelle est ta filière ou spécialité ?</label>
                <input
                  type="text"
                  placeholder="Ex: Informatique, Médecine, Droit..."
                  value={answers.major || ''}
                  onChange={e => setAnswer('major', e.target.value)}
                  className={s.input}
                />
              </div>
            </div>
          )}

          {/* STEP 1 — Habitudes */}
          {step === 1 && (
            <div className={s.stepContent}>
              <h1 className={s.title}>Tes habitudes d'étude</h1>
              <p className={s.sub}>Comment tu travailles naturellement ?</p>

              <div className={s.fieldGroup}>
                <label className={s.label}>Comment tu études le mieux ?</label>
                <div className={s.chipGrid}>
                  {[
                    { val: 'deep', label: 'Longues sessions', sub: 'Je rentre dans la zone' },
                    { val: 'pomodoro', label: 'Sessions rythmées', sub: 'Travail + pauses régulières' },
                    { val: 'sprint', label: 'Courtes rafales', sub: 'Je perds vite la concentration' },
                    { val: 'varied', label: 'Variable', sub: 'Ça dépend du jour' },
                  ].map(({ val, label, sub }) => (
                    <button key={val}
                      className={`${s.chipCard} ${answers.studyStyle === val ? s.chipCardActive : ''}`}
                      onClick={() => setAnswer('studyStyle', val)}>
                      <span className={s.chipCardLabel}>{label}</span>
                      <span className={s.chipCardSub}>{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={s.fieldGroup}>
                <label className={s.label}>Combien d'heures par jour peux-tu étudier ?</label>
                <div className={s.chipGrid}>
                  {[
                    { val: 'less1', label: '< 1h' },
                    { val: '1to2', label: '1 – 2h' },
                    { val: '2to4', label: '2 – 4h' },
                    { val: 'more4', label: '4h +' },
                  ].map(({ val, label }) => (
                    <button key={val}
                      className={`${s.chip} ${answers.dailyHours === val ? s.chipActive : ''}`}
                      onClick={() => setAnswer('dailyHours', val)}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Objectifs */}
          {step === 2 && (
            <div className={s.stepContent}>
              <h1 className={s.title}>Tes objectifs</h1>
              <p className={s.sub}>Sélectionne tout ce qui s'applique.</p>

              <div className={s.fieldGroup}>
                <label className={s.label}>Ce que tu veux améliorer</label>
                <div className={s.chipGrid}>
                  {['Mémorisation', 'Concentration', 'Organisation', 'Gestion du temps',
                    'Réduire le stress', 'Meilleures notes', 'Compréhension', 'Régularité'].map(g => (
                    <button key={g}
                      className={`${s.chip} ${isSelected('goals', g) ? s.chipActive : ''}`}
                      onClick={() => toggle('goals', g)}>{g}</button>
                  ))}
                </div>
              </div>

              <div className={s.fieldGroup}>
                <label className={s.label}>Tes principaux défis</label>
                <div className={s.chipGrid}>
                  {['Procrastination', 'Distraction téléphone', 'Manque de motivation',
                    'Trop de contenu', 'Fatigue', 'Anxiété des examens', 'Environnement bruyant'].map(c => (
                    <button key={c}
                      className={`${s.chip} ${isSelected('challenges', c) ? s.chipActive : ''}`}
                      onClick={() => toggle('challenges', c)}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Mindset */}
          {step === 3 && (
            <div className={s.stepContent}>
              <h1 className={s.title}>Ta mentalité</h1>
              <p className={s.sub}>Quelques dernières questions pour affiner ton profil.</p>

              <div className={s.fieldGroup}>
                <label className={s.label}>Quand es-tu le plus productif ?</label>
                <div className={s.chipGrid}>
                  {[
                    { val: 'morning', label: 'Matin', sub: '6h – 12h' },
                    { val: 'afternoon', label: 'Après-midi', sub: '12h – 18h' },
                    { val: 'evening', label: 'Soir', sub: '18h – 23h' },
                    { val: 'night', label: 'Nuit', sub: '23h +' },
                  ].map(({ val, label, sub }) => (
                    <button key={val}
                      className={`${s.chipCard} ${answers.preferredTime === val ? s.chipCardActive : ''}`}
                      onClick={() => setAnswer('preferredTime', val)}>
                      <span className={s.chipCardLabel}>{label}</span>
                      <span className={s.chipCardSub}>{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={s.fieldGroup}>
                <label className={s.label}>Ta capacité de concentration naturelle</label>
                <div className={s.chipGrid}>
                  {[
                    { val: 'low', label: 'Courte — < 15 min' },
                    { val: 'medium', label: 'Moyenne — 15–45 min' },
                    { val: 'high', label: 'Longue — 45 min +' },
                  ].map(({ val, label }) => (
                    <button key={val}
                      className={`${s.chip} ${answers.focusAbility === val ? s.chipActive : ''}`}
                      onClick={() => setAnswer('focusAbility', val)}>{label}</button>
                  ))}
                </div>
              </div>

              <div className={s.fieldGroup}>
                <label className={s.label}>Qu'est-ce qui te motive le plus ?</label>
                <div className={s.chipGrid}>
                  {[
                    { val: 'grades', label: 'Les bonnes notes' },
                    { val: 'knowledge', label: 'Apprendre pour apprendre' },
                    { val: 'career', label: 'Ma future carrière' },
                    { val: 'competition', label: 'Être le meilleur' },
                    { val: 'passion', label: 'Ma passion du sujet' },
                  ].map(({ val, label }) => (
                    <button key={val}
                      className={`${s.chip} ${answers.motivation === val ? s.chipActive : ''}`}
                      onClick={() => setAnswer('motivation', val)}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <p className={s.error}>{error}</p>}

        {/* Navigation */}
        <div className={s.nav}>
          {step > 0 && (
            <button className={s.btnBack} onClick={() => setStep(step - 1)}>← Retour</button>
          )}
          <button
            className={s.btnNext}
            onClick={handleNext}
            disabled={!canNext() || loading}
          >
            {loading ? (
              <span className={s.loadingText}>
                <span className={s.spinner} />
                Analyse par Claude AI...
              </span>
            ) : step === 3 ? 'Générer mon profil ✦' : 'Continuer →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ResultScreen({ profile, name, onDone }: { profile: any; name: string; onDone: () => void }) {
  const techniqueLabels: Record<string, string> = {
    pomodoro: 'Pomodoro', deepwork: 'Deep Work', sprint: 'Sprint Study', spaced: 'Spaced Repetition'
  }
  const techniqueColors: Record<string, string> = {
    pomodoro: '#7c6af7', deepwork: '#3ecf8e', sprint: '#f5a623', spaced: '#f56565'
  }
  const color = techniqueColors[profile.recommendedTechnique] || '#7c6af7'

  return (
    <div className={s.page}>
      <div className={s.resultCard}>
        <div className={s.resultGlow} style={{ background: `${color}20` }} />

        <div className={s.resultHeader}>
          <div className={s.resultBadge} style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
            {profile.personalityType}
          </div>
          <h1 className={s.resultTitle}>Ton profil est prêt, {name.split(' ')[0]} !</h1>
          <p className={s.resultMotivation}>{profile.motivationMessage}</p>
        </div>

        <div className={s.recommendBox} style={{ borderColor: `${color}40`, background: `${color}10` }}>
          <p className={s.recommendLabel}>Technique recommandée</p>
          <p className={s.recommendTech} style={{ color }}>
            {techniqueLabels[profile.recommendedTechnique]}
          </p>
          <p className={s.recommendDuration}>Sessions de {profile.recommendedDuration} minutes</p>
        </div>

        <div className={s.resultGrid}>
          <div className={s.resultSection}>
            <p className={s.resultSectionTitle}>Tes forces</p>
            {profile.strengths?.map((strength: string, i: number) => (
              <div key={i} className={s.resultItem}>
                <span className={s.dotGreen} />
                <span>{strength}</span>
              </div>
            ))}
          </div>
          <div className={s.resultSection}>
            <p className={s.resultSectionTitle}>À améliorer</p>
            {profile.weaknesses?.map((w: string, i: number) => (
              <div key={i} className={s.resultItem}>
                <span className={s.dotAmber} />
                <span>{w}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={s.tipsSection}>
          <p className={s.resultSectionTitle}>Conseils personnalisés</p>
          {profile.studyTips?.map((tip: string, i: number) => (
            <div key={i} className={s.tipItem}>
              <span className={s.tipNum}>{i + 1}</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>

        <button className={s.btnStart} style={{ background: color }} onClick={onDone}>
          Commencer à étudier →
        </button>
      </div>
    </div>
  )
}
