import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import s from './SearchUsers.module.css'

interface UserResult {
  id: string
  name: string
  username: string
  avatar_url: string | null
  school: string | null
  points: number
}

interface PublicProfile extends UserResult {
  bio: string | null
  stats: { total_sessions: string; total_minutes: string; active_days: string }
}

const LEVELS = [
  { min: 2000, label: 'Légendaire', icon: '💎', color: '#ec4899' },
  { min: 1000, label: 'Maître',     icon: '👑', color: '#10b981' },
  { min: 600,  label: 'Expert',     icon: '🔥', color: '#f59e0b' },
  { min: 300,  label: 'Studieux',   icon: '⚡', color: '#8b5cf6' },
  { min: 100,  label: 'Apprenti',   icon: '📚', color: '#3b82f6' },
  { min: 0,    label: 'Débutant',   icon: '🌱', color: '#6b7280' },
]
function getLevel(points: number) {
  return LEVELS.find(l => points >= l.min) ?? LEVELS[LEVELS.length - 1]
}

export default function SearchUsers() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [selected, setSelected] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      setLoading(true)
      api.get(`/users/search?q=${encodeURIComponent(query)}`)
        .then(r => setResults(r.data))
        .finally(() => setLoading(false))
    }, 300)
  }, [query])

  const openProfile = async (username: string) => {
    setProfileLoading(true)
    setInviteCode(null)
    try {
      const { data } = await api.get(`/users/${username}`)
      setSelected(data)
    } finally {
      setProfileLoading(false)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={s.page}>
      <h1 className={s.title}>Rechercher un étudiant</h1>
      <p className={s.sub}>Trouve un ami par son nom d'utilisateur et étudiez ensemble.</p>

      <div className={s.searchWrap}>
        <span className={s.searchIcon}>🔍</span>
        <input
          className={s.searchInput}
          placeholder="@nom_utilisateur"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null) }}
          autoFocus
        />
        {loading && <span className={s.spinner}>⏳</span>}
      </div>

      <div className={s.layout}>
        {/* Results list */}
        {results.length > 0 && (
          <div className={s.results}>
            {results.map(u => {
              const lvl = getLevel(u.points)
              return (
                <button
                  key={u.id}
                  className={`${s.resultRow} ${selected?.id === u.id ? s.resultActive : ''}`}
                  onClick={() => openProfile(u.username)}
                >
                  <div className={s.resultAvatar}>
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt={u.name} className={s.avatarImg} />
                      : u.name[0]?.toUpperCase()
                    }
                  </div>
                  <div className={s.resultInfo}>
                    <span className={s.resultName}>{u.name}</span>
                    <span className={s.resultUsername}>@{u.username}</span>
                    {u.school && <span className={s.resultSchool}>{u.school}</span>}
                  </div>
                  <span className={s.resultLevel} style={{ color: lvl.color }}>
                    {lvl.icon}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && !loading && (
          <div className={s.empty}>Aucun étudiant trouvé pour « {query} »</div>
        )}

        {/* Public profile panel */}
        {profileLoading && <div className={s.profileCard}><p className={s.loadingText}>Chargement...</p></div>}

        {selected && !profileLoading && (() => {
          const lvl = getLevel(selected.points)
          const totalHours = Math.round(Number(selected.stats.total_minutes) / 60 * 10) / 10
          return (
            <div className={s.profileCard}>
              {/* Header */}
              <div className={s.profileHeader}>
                <div className={s.profileAvatar}>
                  {selected.avatar_url
                    ? <img src={selected.avatar_url} alt={selected.name} className={s.avatarImg} />
                    : selected.name[0]?.toUpperCase()
                  }
                </div>
                <div className={s.profileMeta}>
                  <h2 className={s.profileName}>{selected.name}</h2>
                  <span className={s.profileUsername}>@{selected.username}</span>
                  {selected.school && <span className={s.profileSchool}>{selected.school}</span>}
                </div>
                <div className={s.levelBadge} style={{ background: lvl.color + '20', color: lvl.color, border: `1px solid ${lvl.color}40` }}>
                  {lvl.icon} {lvl.label}
                </div>
              </div>

              {selected.bio && <p className={s.profileBio}>{selected.bio}</p>}

              {/* Stats */}
              <div className={s.profileStats}>
                <div className={s.statBox}>
                  <span className={s.statVal}>{selected.stats.total_sessions}</span>
                  <span className={s.statLabel}>Sessions</span>
                </div>
                <div className={s.statBox}>
                  <span className={s.statVal}>{totalHours}h</span>
                  <span className={s.statLabel}>Focus total</span>
                </div>
                <div className={s.statBox}>
                  <span className={s.statVal}>{selected.stats.active_days}</span>
                  <span className={s.statLabel}>Jours actifs</span>
                </div>
                <div className={s.statBox}>
                  <span className={s.statVal}>{selected.points}</span>
                  <span className={s.statLabel}>Points</span>
                </div>
              </div>

              {/* Actions */}
              <div className={s.actions}>
                <button
                  className={s.btnStudy}
                  onClick={() => navigate('/group')}
                >
                  👥 Étudier ensemble
                </button>
              </div>

              {inviteCode && (
                <div className={s.inviteBox}>
                  <p className={s.inviteText}>Partage ce code avec <strong>{selected.name}</strong> :</p>
                  <div className={s.inviteCode}>{inviteCode}</div>
                  <button className={s.copyBtn} onClick={() => copyCode(inviteCode)}>
                    {copied ? '✓ Copié !' : '📋 Copier le code'}
                  </button>
                </div>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
