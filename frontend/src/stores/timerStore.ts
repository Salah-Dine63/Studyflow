import { create } from 'zustand'
import api from '../lib/api'

export type Technique = 'pomodoro' | 'deepwork' | 'sprint' | 'spaced'
export type Phase = 'focus' | 'break'

export const TECHNIQUES = {
  pomodoro: { label: 'Pomodoro',      work: 25, break: 5,  sessions: 4, desc: '25 min focus · 5 min pause' },
  deepwork: { label: 'Deep Work',     work: 90, break: 20, sessions: 2, desc: '90 min focus · 20 min pause' },
  sprint:   { label: 'Sprint Study',  work: 10, break: 2,  sessions: 6, desc: '10 min sprints · 2 min pause' },
  spaced:   { label: 'Spaced Rep.',   work: 20, break: 10, sessions: 3, desc: '20 min · révision espacée' },
}

interface TimerState {
  technique: Technique
  phase: Phase
  timeLeft: number
  totalDuration: number
  isRunning: boolean
  sessionNum: number
  subject: string
  currentSessionId: string | null
  todaySessions: number
  todayMinutes: number
  streak: number
  justFinished: boolean

  setTechnique: (t: Technique) => void
  setSubject: (s: string) => void
  start: () => Promise<void>
  pause: () => void
  reset: () => void
  skip: () => void
  tick: () => void
  completeSession: (score: number, notes?: string) => Promise<void>
  dismissFinished: () => void
  requestNotificationPermission: () => Promise<void>
}

export const useTimerStore = create<TimerState>((set, get) => ({
  technique: 'pomodoro',
  phase: 'focus',
  timeLeft: 25 * 60,
  totalDuration: 25 * 60,
  isRunning: false,
  sessionNum: 1,
  subject: '',
  currentSessionId: null,
  todaySessions: 0,
  todayMinutes: 0,
  streak: 0,
  justFinished: false,

  setTechnique: (technique) => {
    const cfg = TECHNIQUES[technique]
    set({ technique, phase: 'focus', timeLeft: cfg.work * 60, totalDuration: cfg.work * 60, isRunning: false, sessionNum: 1, currentSessionId: null })
  },

  setSubject: (subject) => set({ subject }),

  start: async () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    const { technique, subject, phase } = get()
    if (phase === 'focus' && !get().currentSessionId) {
      try {
        const cfg = TECHNIQUES[technique]
        const { data } = await api.post('/sessions', {
          technique, subject: subject || undefined,
          planned_duration_minutes: cfg.work,
          started_at: new Date().toISOString()
        })
        set({ currentSessionId: data.session.id })
      } catch (e) { console.error('Failed to create session:', e) }
    }
    set({ isRunning: true })
  },

  pause: () => set({ isRunning: false }),
  dismissFinished: () => set({ justFinished: false }),

  reset: () => {
    const cfg = TECHNIQUES[get().technique]
    set({ phase: 'focus', timeLeft: cfg.work * 60, totalDuration: cfg.work * 60, isRunning: false, sessionNum: 1, currentSessionId: null, justFinished: false })
  },

  skip: () => {
    const { technique, phase, sessionNum } = get()
    const cfg = TECHNIQUES[technique]
    if (phase === 'focus') {
      set({ phase: 'break', timeLeft: cfg.break * 60, totalDuration: cfg.break * 60, isRunning: false })
    } else {
      set({ phase: 'focus', timeLeft: cfg.work * 60, totalDuration: cfg.work * 60, isRunning: false, sessionNum: sessionNum < cfg.sessions ? sessionNum + 1 : 1 })
    }
  },

  tick: () => {
    const { timeLeft, phase, technique, sessionNum } = get()
    const cfg = TECHNIQUES[technique]
    if (timeLeft > 1) { set({ timeLeft: timeLeft - 1 }); return }

    if (phase === 'focus') {
      playAlarm()
      sendNotification('focus')
      set((s) => ({
        phase: 'break', timeLeft: cfg.break * 60, totalDuration: cfg.break * 60,
        isRunning: false, justFinished: true,
        todaySessions: s.todaySessions + 1,
        todayMinutes: s.todayMinutes + cfg.work,
        streak: s.streak + 1,
      }))
    } else {
      playAlarm()
      sendNotification('break')
      set({ phase: 'focus', timeLeft: cfg.work * 60, totalDuration: cfg.work * 60, isRunning: false, sessionNum: sessionNum < cfg.sessions ? sessionNum + 1 : 1 })
    }
  },

  requestNotificationPermission: async () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  },

  completeSession: async (score, notes) => {
    const { currentSessionId, technique } = get()
    if (!currentSessionId) return
    const cfg = TECHNIQUES[technique]
    try {
      await api.patch(`/sessions/${currentSessionId}/complete`, {
        actual_duration_minutes: cfg.work, focus_score: score, notes: notes || undefined
      })
    } catch (e) { console.error('Failed to complete session:', e) }
    set({ currentSessionId: null, justFinished: false })
  },
}))

function playAlarm() {
  try {
    const ctx = new AudioContext()
    const times = [0, 0.35, 0.7]
    times.forEach(t => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.4, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.3)
    })
  } catch { /* AudioContext not available */ }
}

function sendNotification(endedPhase: Phase) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  if (endedPhase === 'focus') {
    new Notification('⏱ Session terminée !', { body: 'Super boulot ! Prends une pause méritée.', icon: '/favicon.ico' })
  } else {
    new Notification('☕ Pause terminée !', { body: 'C\'est reparti — nouvelle session de focus !', icon: '/favicon.ico' })
  }
}
