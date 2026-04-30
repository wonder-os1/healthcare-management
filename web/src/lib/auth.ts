import { api } from './api'
import type { User } from '@/types'

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  const { user } = data.data
  // Token is now set as httpOnly cookie by the server
  localStorage.setItem('user', JSON.stringify(user))
  return user as User
}

export async function register(payload: {
  name: string
  email: string
  password: string
  phone?: string
  role?: string
}) {
  const { data } = await api.post('/auth/register', payload)
  const { user } = data.data
  // Token is now set as httpOnly cookie by the server
  localStorage.setItem('user', JSON.stringify(user))
  return user as User
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { data } = await api.get('/auth/me')
    const user = data.data
    localStorage.setItem('user', JSON.stringify(user))
    return user
  } catch {
    return null
  }
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } catch {
    // Continue with local cleanup even if API call fails
  }
  localStorage.removeItem('user')
  window.location.href = '/auth/login'
}

export function isAuthenticated(): boolean {
  return !!getStoredUser()
}
