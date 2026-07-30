import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory, RouterLink, RouterView } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import { createMockUser } from '@/test/helpers'
import { setSession } from '@/lib/auth'
import { useAuth } from '@/composables/useAuth'
import * as apiModule from '@/lib/api'

describe('AppLayout', () => {
  beforeEach(() => {
    localStorage.clear()
    const { logout, state } = useAuth()
    logout()
    state.ready = true
    vi.spyOn(apiModule, 'api')
  })

  it('shows navigation links based on permissions', async () => {
    const user = createMockUser({
      permissions: [
        'submit_standard_priority_request',
        'submit_standard_priority_request_on_behalf_of_the_staff',
        'view_user',
        'platform_reporting',
      ],
    })
    setSession('token', user)
    const { state } = useAuth()
    state.user = user

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: AppLayout }],
    })

    const wrapper = mount(AppLayout, {
      global: {
        plugins: [router],
        stubs: { RouterLink: RouterLink, RouterView: true },
      },
    })

    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.text()).toContain('New request')
    expect(wrapper.text()).toContain('On behalf')
    expect(wrapper.text()).toContain('Users')
    expect(wrapper.text()).toContain('Platform report')
    expect(wrapper.text()).toContain('Staff One')
  })

  it('signs out and redirects to login', async () => {
    setSession('token', createMockUser())
    const { state } = useAuth()
    state.user = createMockUser()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: AppLayout },
        { path: '/login', name: 'login', component: { template: '<div />' } },
      ],
    })
    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mount(AppLayout, {
      global: {
        plugins: [router],
        stubs: { RouterLink: true, RouterView: true },
      },
    })

    await wrapper.find('button.btn.secondary').trigger('click')

    expect(pushSpy).toHaveBeenCalledWith({ name: 'login' })
  })
})
