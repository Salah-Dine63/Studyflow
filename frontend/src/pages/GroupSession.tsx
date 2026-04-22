import { useState } from 'react'
import { useRoom } from '../hooks/useRoom'
import { useAuthStore } from '../stores/authStore'
import s from './GroupSession.module.css'

const TECHNIQUES = [
  { id: 'pomodoro', label: 'Pomodoro',     desc: '25 min focus · 5 min pause' },
  { id: 'deepwork', label: 'Deep Work',    desc: '90 min focus · 20 min pause' },
  { id: 'sprint',   label: 'Sprint Study', desc: '10 min sprints · 2 min pause' },
  { id: 'spaced',   label: 'Spaced Rep.',  desc: '20 min · révision espacée' },
]

const COLORS: Record<string, string> = {
  pomodoro: '#7c6af7', deepwork: '#3ecf8e', sprint: '#f5a623', spaced: '#f56565'
}

export default function GroupSession() {
  const { user } = useAuthStore()
  const {
    room, participants, error, isHost,
    createRoom, joinRoom, leaveRoom,
    startTimer, pauseTimer, resetTimer, skipPhase,
  } = useRoom()

  const [joinCode, setJoinCode] = useState('')
  const [selectedTech, setSelectedTech] = useState('pomodoro')
  const [view, setView] = useState<'home' | 'create' | 'join'>('home')

  if (!room) {
    return (
      <div className={s.page}>
        <h1 className={s.title}>Sessions de groupe</h1>
        <p className={s.sub}>Étudie avec d'autres en temps réel — timer partagé, focus collectif.</p>

        {error && <div className={s.error}>{error}</div>}

        {view === 'home' && (
          <div className={s.homeActions}>
            <button className={s.btnCreate} onClick={() => setView('create')}>
              <span>➕</span> Créer une salle
            </button>
            <button className={s.btnJoin} onClick={() => setView('join')}>
              <span>🚪</span> Rejoindre une salle
            </button>
          </div>
        )}

        {view === 'create' && (
          <div className={s.formCard}>
            <button className={s.back} onClick={() => setView('home')}>← Retour</button>
            <h2 className={s.formTitle}>Choisir une technique</h2>
            <div className={s.techGrid}>
              {TECHNIQUES.map(t => (
                <button
                  key={t.id}
                  className={`${s.techCard} ${selectedTech === t.id ? s.techActive : ''}`}
                  style={selectedTech === t.id ? { borderColor: COLORS[t.id], boxShadow: `0 0 16px ${COLORS[t.id]}30` } : {}}
                  onClick={() => setSelectedTech(t.id)}
                >
                  <div className={s.techName} style={{ color: selectedTech === t.id ? COLORS[t.id] : undefined }}>{t.label}</div>
                  <div className={s.techDesc}>{t.desc}</div>
                </button>
              ))}
            </div>
            <button className={s.btnPrimary} onClick={() => createRoom(selectedTech)}>
              Créer la salle
            </button>
          </div>
        )}

        {view === 'join' && (
          <div className={s.formCard}>
            <button className={s.back} onClick={() => setView('home')}>← Retour</button>
            <h2 className={s.formTitle}>Rejoindre une salle</h2>
            <p className={s.formSub}>Entre le code à 6 caractères partagé par ton ami.</p>
            <input
              className={s.codeInput}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="EX: ABC123"
              maxLength={6}
            />
            <button
              className={s.btnPrimary}
              onClick={() => joinRoom(joinCode)}
              disabled={joinCode.length !== 6}
            >
              Rejoindre
            </button>
          </div>
        )}
      </div>
    )
  }

  // In room
  const mins = Math.floor(room.timeLeft / 60)
  const secs = room.timeLeft % 60
  const progress = room.timeLeft / room.totalDuration
  const R = 100
  const C = 2 * Math.PI * R
  const strokeOffset = C * (1 - progress)
  const color = COLORS[room.technique] || '#7c6af7'
  const activeColor = room.phase === 'focus' ? color : '#3ecf8e'

  return (
    <div className={s.page}>
      <div className={s.roomLayout}>

        {/* Left: Timer */}
        <div className={s.timerSide}>
          <div className={s.roomHeader}>
            <div className={s.roomCode}>
              <span className={s.codeLabel}>Code de la salle</span>
              <span className={s.codeValue}>{room.code}</span>
              <button className={s.copyBtn} onClick={() => navigator.clipboard.writeText(room.code)} title="Copier">📋</button>
            </div>
            <button className={s.leaveBtn} onClick={leaveRoom}>Quitter</button>
          </div>

          <div className={s.phaseBadge} style={{ background: `${activeColor}20`, color: activeColor }}>
            {room.phase === 'focus' ? '🎯 Focus' : '☕ Pause'} · {TECHNIQUES.find(t => t.id === room.technique)?.label}
          </div>

          <div className={s.ringWrap}>
            <svg width="240" height="240" viewBox="0 0 240 240">
              <circle cx="120" cy="120" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10"/>
              <circle cx="120" cy="120" r={R} fill="none"
                stroke={activeColor} strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={strokeOffset}
                transform="rotate(-90 120 120)"
                style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)' }}
              />
            </svg>
            <div className={s.ringInner}>
              <div className={s.time}>
                {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
              </div>
              <div className={s.sessionLabel}>Session {room.sessionNum}</div>
            </div>
          </div>

          {isHost ? (
            <div className={s.controls}>
              <button className={s.btnSec} onClick={resetTimer}>Reset</button>
              <button
                className={s.btnPrimary}
                style={{ background: activeColor }}
                onClick={room.isRunning ? pauseTimer : startTimer}
              >
                {room.isRunning ? 'Pause' : 'Démarrer'}
              </button>
              <button className={s.btnSec} onClick={skipPhase}>Passer →</button>
            </div>
          ) : (
            <div className={s.watchingBadge}>
              👀 Tu regardes · seul l'hôte contrôle le timer
            </div>
          )}
        </div>

        {/* Right: Participants */}
        <div className={s.participantsSide}>
          <h2 className={s.panelTitle}>Participants ({participants.length})</h2>
          <div className={s.participantList}>
            {participants.map(p => (
              <div key={p.userId} className={s.participantRow}>
                <div className={s.participantAvatar} style={{ background: p.isHost ? activeColor : '#2a2a3e' }}>
                  {p.avatarUrl
                    ? <img src={p.avatarUrl} alt={p.name} className={s.avatarImg} />
                    : p.name[0]?.toUpperCase()
                  }
                </div>
                <div className={s.participantInfo}>
                  <span className={s.participantName}>
                    {p.name}
                    {p.userId === user?.id && ' (moi)'}
                  </span>
                  {p.isHost && <span className={s.hostBadge}>Hôte</span>}
                </div>
                <div className={`${s.onlineDot} ${room.isRunning ? s.dotPulse : ''}`} style={{ background: activeColor }} />
              </div>
            ))}
          </div>

          <div className={s.inviteBox}>
            <p className={s.inviteText}>Invite tes amis avec ce code :</p>
            <div className={s.inviteCode}>{room.code}</div>
            <button className={s.inviteBtn} onClick={() => navigator.clipboard.writeText(room.code)}>
              📋 Copier le code
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
