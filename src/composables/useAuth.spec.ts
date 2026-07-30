import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useAuth } from '@/composables/useAuth'
import { createMockUser } from '@/test/helpers'
import * as apiModule from '@/lib/api'
import { clearSession, setSession } from '@/lib/auth'

function resetAuthState() {
  const { state, logout } = useAuth()
  logout()
  state.ready = false
  state.user = null
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    resetAuthState()
    vi.spyOn(apiModule, 'api')
  })

  it('marks unauthenticated when no token exists', async () => {
    const { bootstrap, isAuthenticated, state } = useAuth()

    await bootstrap()

    expect(state.ready).toBe(true)
    expect(isAuthenticated.value).toBe(false)
    expect(state.user).toBeNull()
  })

  it('bootstraps current user from /auth/me', async () => {
    const user = createMockUser()
    setSession('token-1', user)
    vi.mocked(apiModule.api).mockResolvedValue({ user })

    const { bootstrap, isAuthenticated, state } = useAuth()
    await bootstrap()

    expect(apiModule.api).toHaveBeenCalledWith('/auth/me')
    expect(state.user).toEqual(user)
    expect(isAuthenticated.value).toBe(true)
    expect(state.ready).toBe(true)
  })

  it('clears session when bootstrap fails', async () => {
    setSession('bad-token', createMockUser())
    vi.mocked(apiModule.api).mockRejectedValue(new Error('Unauthorized'))

    const { bootstrap, state } = useAuth()
    await bootstrap()

    expect(state.user).toBeNull()
    expect(state.ready).toBe(true)
  })

  it('logs in and stores session', async () => {
    const user = createMockUser()
    vi.mocked(apiModule.api).mockResolvedValue({ token: 'new-token', user })

    const { login, isAuthenticated, state } = useAuth()
    const result = await login('staff1@example.com', 'Password123!')

    expect(result).toEqual(user)
    expect(state.user).toEqual(user)
    expect(isAuthenticated.value).toBe(true)
  })

  it('logs out and clears session', () => {
    setSession('token-1', createMockUser())
    const { logout, state, isAuthenticated } = useAuth()

    logout()

    expect(state.user).toBeNull()
    expect(isAuthenticated.value).toBe(false)
  })

  it('checks permissions via can()', async () => {
    const user = createMockUser({ permissions: ['view_user'] })
    setSession('token-1', user)
    vi.mocked(apiModule.api).mockResolvedValue({ user })

    const { bootstrap, can } = useAuth()
    await bootstrap()

    expect(can('view_user')).toBe(true)
    expect(can('create_user')).toBe(false)
  })
})
