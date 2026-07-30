import { computed, reactive } from 'vue'
import { api } from '@/lib/api'
import {
  clearSession,
  getStoredUser,
  getToken,
  hasPermission,
  setSession,
} from '@/lib/auth'
import type { PublicUser } from '@/types'

const state = reactive<{
  user: PublicUser | null
  ready: boolean
}>({
  user: getStoredUser(),
  ready: false,
})

export function useAuth() {
  const isAuthenticated = computed(() => !!getToken() && !!state.user)

  async function bootstrap() {
    if (!getToken()) {
      state.user = null
      state.ready = true
      return
    }
    try {
      const data = await api<{ user: PublicUser }>('/auth/me')
      state.user = data.user
      setSession(getToken()!, data.user)
    } catch {
      clearSession()
      state.user = null
    } finally {
      state.ready = true
    }
  }

  async function login(email: string, password: string) {
    const data = await api<{ token: string; user: PublicUser }>('/auth/login', {
      method: 'POST',
      json: { email, password },
    })
    setSession(data.token, data.user)
    state.user = data.user
    return data.user
  }

  function logout() {
    clearSession()
    state.user = null
  }

  function can(code: string) {
    return hasPermission(state.user, code)
  }

  return {
    state,
    isAuthenticated,
    bootstrap,
    login,
    logout,
    can,
  }
}
