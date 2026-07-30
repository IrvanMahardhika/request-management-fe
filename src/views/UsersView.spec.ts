import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory, RouterLink } from 'vue-router'
import UsersView from '@/views/UsersView.vue'
import { createMockUser } from '@/test/helpers'
import * as apiModule from '@/lib/api'

describe('UsersView', () => {
  beforeEach(() => {
    vi.spyOn(apiModule, 'api')
  })

  it('lists users from API', async () => {
    const user = createMockUser({ permissions: ['view_user'] })
    vi.mocked(apiModule.api).mockResolvedValue({ items: [user] })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/users', component: UsersView },
        { path: '/users/new', component: { template: '<div />' } },
      ],
    })

    const wrapper = mount(UsersView, {
      global: { plugins: [router], stubs: { RouterLink: RouterLink } },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Staff One')
    expect(wrapper.text()).toContain('staff1@example.com')
  })

  it('deactivates an active user', async () => {
    const user = createMockUser()
    vi.mocked(apiModule.api)
      .mockResolvedValueOnce({ items: [user] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ items: [{ ...user, status: 'inactive' }] })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/users', component: UsersView }],
    })

    const wrapper = mount(UsersView, {
      global: { plugins: [router], stubs: { RouterLink: true } },
    })
    await flushPromises()

    await wrapper.find('button.btn.secondary').trigger('click')
    await flushPromises()

    expect(apiModule.api).toHaveBeenCalledWith(`/users/${user.id}/deactivate`, {
      method: 'PATCH',
      json: {},
    })
  })
})
