import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../stores/authStore'

export interface Participant {
  userId: string
  name: string
  avatarUrl?: string
  isHost: boolean
}

export interface RoomState {
  code: string
  hostId: string
  technique: string
  phase: 'focus' | 'break'
  timeLeft: number
  totalDuration: number
  isRunning: boolean
  sessionNum: number
}

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'

export function useRoom() {
  const { token, user } = useAuthStore()
  const socketRef = useRef<Socket | null>(null)
  const [room, setRoom] = useState<RoomState | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => { setConnected(false); setRoom(null); setParticipants([]) })

    socket.on('room:joined', (state: RoomState) => { setRoom(state); setError('') })
    socket.on('room:state', (state: RoomState) => setRoom(state))
    socket.on('room:tick', (timeLeft: number) => setRoom(r => r ? { ...r, timeLeft } : r))
    socket.on('room:participants', (list: Participant[]) => setParticipants(list))
    socket.on('room:phase-end', () => {
      try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.4, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1)
        osc.start(); osc.stop(ctx.currentTime + 1)
      } catch { /* AudioContext not available */ }
    })
    socket.on('room:error', (msg: string) => setError(msg))

    return () => { socket.disconnect() }
  }, [])

  const createRoom = useCallback((technique: string) => {
    if (!token || !user) return
    setError('')
    socketRef.current?.emit('room:create', { technique, token, name: user.name })
  }, [token, user])

  const joinRoom = useCallback((code: string) => {
    if (!token || !user) return
    setError('')
    socketRef.current?.emit('room:join', { code: code.toUpperCase(), token, name: user.name })
  }, [token, user])

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('room:leave')
    setRoom(null)
    setParticipants([])
  }, [])

  const startTimer = useCallback(() => {
    socketRef.current?.emit('room:start', { token })
  }, [token])

  const pauseTimer = useCallback(() => {
    socketRef.current?.emit('room:pause', { token })
  }, [token])

  const resetTimer = useCallback(() => {
    socketRef.current?.emit('room:reset', { token })
  }, [token])

  const skipPhase = useCallback(() => {
    socketRef.current?.emit('room:skip', { token })
  }, [token])

  const isHost = room ? participants.find(p => p.userId === user?.id)?.isHost ?? false : false

  return {
    room, participants, error, connected, isHost,
    createRoom, joinRoom, leaveRoom,
    startTimer, pauseTimer, resetTimer, skipPhase,
  }
}
