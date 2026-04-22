import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

interface User { id: string; email: string; name: string }

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  loginWithOAuth: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,

      login: async (email, password) => {
        set({ loading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          localStorage.setItem('sf_token', data.token)
          set({ user: data.user, token: data.token, loading: false })
        } catch (err) {
          set({ loading: false })
          throw err
        }
      },

      register: async (name, email, password) => {
        set({ loading: true })
        try {
          const { data } = await api.post('/auth/register', { name, email, password })
          localStorage.setItem('sf_token', data.token)
          set({ user: data.user, token: data.token, loading: false })
        } catch (err) {
          set({ loading: false })
          throw err
        }
      },

      loginWithOAuth: (token, user) => {
        localStorage.setItem('sf_token', token)
        set({ user, token })
      },

      logout: () => {
        localStorage.removeItem('sf_token')
        set({ user: null, token: null })
      }
    }),
    { name: 'sf-auth', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
)
