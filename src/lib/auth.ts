import type { PublicUser } from '@/types'

const TOKEN_KEY = 'rm_token'
const USER_KEY = 'rm_user'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): PublicUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PublicUser
  } catch {
    return null
  }
}

export function setSession(token: string, user: PublicUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function hasPermission(user: PublicUser | null, code: string): boolean {
  return !!user?.permissions?.includes(code as never)
}
