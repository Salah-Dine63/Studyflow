import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

export interface OnboardingAnswers {
  schoolLevel: string
  major: string
  studyStyle: string
  dailyHours: string
  goals: string[]
  challenges: string[]
  preferredTime: string
  focusAbility: string
  motivation: string
}

export interface AIProfile {
  recommendedTechnique: string
  recommendedDuration: number
  personalityType: string
  strengths: string[]
  weaknesses: string[]
  studyTips: string[]
  dailyGoalMinutes: number
  motivationMessage: string
}

interface OnboardingState {
  step: number
  answers: Partial<OnboardingAnswers>
  aiProfile: AIProfile | null
  loading: boolean
  done: boolean
  checking: boolean
  setStep: (s: number) => void
  setAnswer: (key: keyof OnboardingAnswers, value: string | string[]) => void
  submit: () => Promise<void>
  checkStatus: () => Promise<boolean>
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      step: 0,
      answers: {},
      aiProfile: null,
      loading: false,
      done: false,
      checking: true,

      setStep: (step) => set({ step }),
      setAnswer: (key, value) => set((s) => ({ answers: { ...s.answers, [key]: value } })),

      submit: async () => {
        set({ loading: true })
        try {
          const { data } = await api.post('/onboarding', get().answers)
          set({ aiProfile: data.profile, done: true, loading: false })
        } catch (err) {
          console.error('Onboarding submit error:', err)
          set({ loading: false })
          throw err
        }
      },

      checkStatus: async () => {
        set({ checking: true })
        try {
          const { data } = await api.get('/onboarding/status')
          set({ done: data.onboardingDone, checking: false })
          return data.onboardingDone as boolean
        } catch {
          set({ checking: false })
          return false
        }
      },
    }),
    {
      name: 'sf-onboarding',
      partialize: (s) => ({ done: s.done }),
    }
  )
)
