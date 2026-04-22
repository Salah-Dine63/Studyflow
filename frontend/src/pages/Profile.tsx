import { useEffect, useRef, useState } from 'react'
import api from '../lib/api'
import s from './Profile.module.css'

interface ProfileData {
  id: string
  name: string
  email: string
  username: string | null
  bio: string | null
  school: string | null
  avatar_url: string | null
  points: number
  stats: {
    total_sessions: string
    total_minutes: string
    avg_score: string | null
    active_days: string
  }
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ name: '', bio: '', school: '', avatar_url: '', username: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get('/profile').then(r => {
      setProfile(r.data)
      setForm({
        name: r.data.name ?? '',
        bio: r.data.bio ?? '',
        school: r.data.school ?? '',
        avatar_url: r.data.avatar_url ?? '',
        username: r.data.username ?? '',
      })
    })
  }, [])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm(f => ({ ...f, avatar_url: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/profile', form)
      setProfile(p => p ? { ...p, ...data } : p)
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return <div className={s.loading}>Chargement...</div>

  const totalHours = (Math.round(Number(profile.stats.total_minutes) / 60 * 10) / 10)
  const initials = profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const avatar = editing ? form.avatar_url : profile.avatar_url

  const levelInfo = getLevel(profile.points)

  return (
    <div className={s.page}>

      {/* Header card */}
      <div className={s.heroCard}>
        <div className={s.avatarWrap} onClick={() => editing && fileRef.current?.click()}>
          {avatar
            ? <img src={avatar} alt="avatar" className={s.avatarImg} />
            : <div className={s.avatarFallback}>{initials}</div>
          }
          {editing && <div className={s.avatarOverlay}>📷</div>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />

        <div className={s.heroInfo}>
          {editing ? (
            <input
              className={s.nameInput}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ton nom"
            />
          ) : (
            <h1 className={s.heroName}>{profile.name}</h1>
          )}

          {editing ? (
            <input
              className={s.schoolInput}
              value={form.school}
              onChange={e => setForm(f => ({ ...f, school: e.target.value }))}
              placeholder="Ton école / université"
            />
          ) : (
            <p className={s.heroSchool}>{profile.school || 'Aucune école renseignée'}</p>
          )}

          {editing ? (
            <input
              className={s.schoolInput}
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 30) }))}
              placeholder="nom_utilisateur"
            />
          ) : (
            <p className={s.heroUsername}>@{profile.username || 'aucun username'}</p>
          )}
          <p className={s.heroEmail}>{profile.email}</p>
        </div>

        <div className={s.heroActions}>
          {editing ? (
            <>
              <button className={s.btnSave} onClick={handleSave} disabled={saving}>
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
              <button className={s.btnCancel} onClick={() => setEditing(false)}>Annuler</button>
            </>
          ) : (
            <button className={s.btnEdit} onClick={() => setEditing(true)}>Modifier le profil</button>
          )}
          {saved && <span className={s.savedBadge}>✓ Sauvegardé</span>}
        </div>
      </div>

      {/* Bio */}
      <div className={s.section}>
        <h2 className={s.sectionTitle}>Bio</h2>
        {editing ? (
          <textarea
            className={s.bioInput}
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Parle un peu de toi, tes objectifs, ta motivation..."
            rows={4}
          />
        ) : (
          <p className={s.bioText}>{profile.bio || 'Aucune bio renseignée.'}</p>
        )}
      </div>

      {/* Points & Level */}
      <div className={s.section}>
        <h2 className={s.sectionTitle}>Niveau & Points</h2>
        <div className={s.levelCard}>
          <div className={s.levelBadge} style={{ background: levelInfo.color + '20', color: levelInfo.color, border: `1px solid ${levelInfo.color}40` }}>
            {levelInfo.icon} {levelInfo.label}
          </div>
          <div className={s.pointsDisplay}>
            <span className={s.pointsNum}>{profile.points}</span>
            <span className={s.pointsLabel}>points</span>
          </div>
          <div className={s.progressWrap}>
            <div className={s.progressTrack}>
              <div className={s.progressBar} style={{ width: `${levelInfo.progress}%`, background: levelInfo.color }} />
            </div>
            <span className={s.progressText}>{levelInfo.pointsToNext} pts pour le niveau suivant</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={s.section}>
        <h2 className={s.sectionTitle}>Statistiques</h2>
        <div className={s.statsGrid}>
          <div className={s.statCard}>
            <div className={s.statVal}>{profile.stats.total_sessions}</div>
            <div className={s.statLabel}>Sessions</div>
          </div>
          <div className={s.statCard}>
            <div className={s.statVal}>{totalHours}h</div>
            <div className={s.statLabel}>Focus total</div>
          </div>
          <div className={s.statCard}>
            <div className={s.statVal}>{profile.stats.avg_score ?? '—'}</div>
            <div className={s.statLabel}>Score moyen</div>
          </div>
          <div className={s.statCard}>
            <div className={s.statVal}>{profile.stats.active_days}</div>
            <div className={s.statLabel}>Jours actifs</div>
          </div>
        </div>
      </div>

    </div>
  )
}

function getLevel(points: number) {
  const levels = [
    { min: 0,    label: 'Débutant',    icon: '🌱', color: '#6b7280', next: 100  },
    { min: 100,  label: 'Apprenti',    icon: '📚', color: '#3b82f6', next: 300  },
    { min: 300,  label: 'Studieux',    icon: '⚡', color: '#8b5cf6', next: 600  },
    { min: 600,  label: 'Expert',      icon: '🔥', color: '#f59e0b', next: 1000 },
    { min: 1000, label: 'Maître',      icon: '👑', color: '#10b981', next: 2000 },
    { min: 2000, label: 'Légendaire',  icon: '💎', color: '#ec4899', next: 2000 },
  ]
  const current = [...levels].reverse().find(l => points >= l.min) ?? levels[0]
  const nextMin = current.next
  const progress = current.min === nextMin ? 100 : Math.min(((points - current.min) / (nextMin - current.min)) * 100, 100)
  const pointsToNext = Math.max(nextMin - points, 0)
  return { ...current, progress, pointsToNext }
}
