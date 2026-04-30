import * as SecureStore from 'expo-secure-store'
import { api } from './api'
import type { User } from '@/types'

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post('/auth/login', { email, password })
  const { token, user } = data.data
  await SecureStore.setItemAsync('token', token)
  await SecureStore.setItemAsync('user', JSON.stringify(user))
  return user
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { data } = await api.get('/auth/me')
    const user = data.data
    await SecureStore.setItemAsync('user', JSON.stringify(user))
    return user
  } catch {
    return null
  }
}

export async function getStoredUser(): Promise<User | null> {
  try {
    const raw = await SecureStore.getItemAsync('user')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync('token')
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync('token')
  await SecureStore.deleteItemAsync('user')
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken()
  return !!token
}
