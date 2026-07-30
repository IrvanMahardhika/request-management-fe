import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import UserCreateView from '@/views/UserCreateView.vue'
import * as apiModule from '@/lib/api'

describe('UserCreateView', () => {
  beforeEach(() => {
    vi.spyOn(apiModule, 'api').mockImplementation(async (path: string) => {
      if (path === '/org/roles') {
        return {
          items: [
            { code: 'staff_member', name: 'Staff Member', organizationScope: 'site' },
            { code: 'platform_admin', name: 'Platform Admin', organizationScope: 'platform' },
          ],
        }
      }
      if (path === '/org/countries') return { items: [{ id: 'c1', name: 'Country A' }] }
      if (path.includes('/territories')) return { items: [{ id: 't1', name: 'Territory East' }] }
      if (path.includes('/sites')) return { items: [{ id: 's1', name: 'Site Alpha' }] }
      if (path === '/users') return {}
      throw new Error(`Unexpected path: ${path}`)
    })
  })

  it('loads roles and creates a user', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/users', component: { template: '<div />' } }],
    })
    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mount(UserCreateView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    await wrapper.find('input[type="email"]').setValue('new@example.com')
    const textInputs = wrapper.findAll('input:not([type="email"]):not([type="password"])')
    await textInputs[0]!.setValue('New User')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(apiModule.api).toHaveBeenCalledWith('/users', {
      method: 'POST',
      json: expect.objectContaining({
        email: 'new@example.com',
        fullName: 'New User',
        roleCode: 'staff_member',
      }),
    })
    expect(pushSpy).toHaveBeenCalledWith('/users')
  })

  it('loads territories when country is selected', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/users/new', component: UserCreateView }],
    })

    const wrapper = mount(UserCreateView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    const countrySelect = wrapper.findAll('select')[1]!
    await countrySelect.setValue('c1')
    await flushPromises()

    expect(apiModule.api).toHaveBeenCalledWith('/org/countries/c1/territories')
  })
})
