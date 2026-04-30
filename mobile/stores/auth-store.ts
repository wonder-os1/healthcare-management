import { create } from 'zustand'
import type { User } from '@/types'
import { getStoredUser, logout as doLogout, fetchCurrentUser } from '@/lib/auth'

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  loadUser: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),

  loadUser: async () => {
    const stored = await getStoredUser()
    if (stored) {
      set({ user: stored, isLoading: false })
      const fresh = await fetchCurrentUser()
      if (fresh) set({ user: fresh })
    } else {
      set({ user: null, isLoading: false })
    }
  },

  logout: async () => {
    set({ user: null })
    await doLogout()
  },
}))
