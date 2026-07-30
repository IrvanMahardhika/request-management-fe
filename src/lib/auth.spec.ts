import { describe, expect, it, beforeEach } from 'vitest'
import {
  clearSession,
  getStoredUser,
  getToken,
  hasPermission,
  setSession,
} from '@/lib/auth'
import { createMockUser } from '@/test/helpers'

describe('auth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull()
  })

  it('stores and retrieves session data', () => {
    const user = createMockUser()
    setSession('token-abc', user)

    expect(getToken()).toBe('token-abc')
    expect(getStoredUser()).toEqual(user)
  })

  it('returns null for invalid stored user JSON', () => {
    localStorage.setItem('rm_user', '{not-json')
    expect(getStoredUser()).toBeNull()
  })

  it('clears session data', () => {
    setSession('token-abc', createMockUser())
    clearSession()

    expect(getToken()).toBeNull()
    expect(getStoredUser()).toBeNull()
  })

  it('checks permissions on a user', () => {
    const user = createMockUser({ permissions: ['view_user'] })
    expect(hasPermission(user, 'view_user')).toBe(true)
    expect(hasPermission(user, 'create_user')).toBe(false)
    expect(hasPermission(null, 'view_user')).toBe(false)
  })
})
