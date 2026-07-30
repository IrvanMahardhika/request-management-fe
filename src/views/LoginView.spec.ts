import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import { createMockUser } from '@/test/helpers'
import * as apiModule from '@/lib/api'
import { clearSession } from '@/lib/auth'
import { useAuth } from '@/composables/useAuth'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/', name: 'dashboard', component: { template: '<div />' } },
    ],
  })
}

describe('LoginView', () => {
  beforeEach(() => {
    clearSession()
    const { logout, state } = useAuth()
    logout()
    state.ready = true
    vi.spyOn(apiModule, 'api')
  })

  it('renders sign-in form', () => {
    const router = createTestRouter()
    const wrapper = mount(LoginView, {
      global: { plugins: [router] },
    })

    expect(wrapper.text()).toContain('Sign in')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
  })

  it('redirects after successful login', async () => {
    const user = createMockUser()
    vi.mocked(apiModule.api).mockResolvedValue({ token: 'token', user })

    const router = createTestRouter()
    await router.push('/login?redirect=/requests/new')
    await router.isReady()

    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(LoginView, {
      global: { plugins: [router] },
    })

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(pushSpy).toHaveBeenCalledWith('/requests/new')
  })

  it('shows error message when login fails', async () => {
    vi.mocked(apiModule.api).mockRejectedValue(new Error('Invalid credentials'))

    const router = createTestRouter()
    const wrapper = mount(LoginView, {
      global: { plugins: [router] },
    })

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Invalid credentials')
  })
})
