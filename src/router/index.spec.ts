import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { getToken, setSession, clearSession } from '@/lib/auth'
import { useAuth } from '@/composables/useAuth'
import { createMockUser } from '@/test/helpers'
import * as apiModule from '@/lib/api'

async function createGuardedRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/login',
        name: 'login',
        component: { template: '<div />' },
        meta: { public: true },
      },
      {
        path: '/',
        name: 'dashboard',
        component: { template: '<div />' },
      },
    ],
  })

  router.beforeEach(async (to) => {
    const { state, bootstrap, isAuthenticated } = useAuth()
    if (!state.ready) await bootstrap()
    if (to.meta.public) {
      if (isAuthenticated.value && to.name === 'login') return { name: 'dashboard' }
      return true
    }
    if (!getToken()) return { name: 'login', query: { redirect: to.fullPath } }
    return true
  })

  return router
}

describe('router auth guard', () => {
  beforeEach(() => {
    clearSession()
    const { logout, state } = useAuth()
    logout()
    state.ready = false
    vi.spyOn(apiModule, 'api')
  })

  it('redirects unauthenticated users to login', async () => {
    const router = await createGuardedRouter()
    await router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/')
  })

  it('allows authenticated users to access protected routes', async () => {
    const user = createMockUser()
    setSession('token', user)
    vi.mocked(apiModule.api).mockResolvedValue({ user })

    const router = await createGuardedRouter()
    await router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('redirects authenticated users away from login', async () => {
    const user = createMockUser()
    setSession('token', user)
    const { state } = useAuth()
    state.user = user
    state.ready = true

    const router = await createGuardedRouter()
    await router.push('/login')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('dashboard')
  })
})
