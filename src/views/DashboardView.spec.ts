import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory, RouterLink } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import type { OperationalRequest } from '@/types'
import * as apiModule from '@/lib/api'

const sampleRequest: OperationalRequest = {
  id: 'req-1',
  type: 'equipment',
  title: 'Forklift repair',
  description: 'Broken',
  priority: 'standard',
  status: 'submitted',
  requestingUserId: 'user-1',
  requestingUser: { id: 'user-1', fullName: 'Staff One', email: 'staff1@example.com', status: 'active' },
  siteId: 'site-1',
  site: {
    id: 'site-1',
    name: 'Site Alpha',
    territoryId: 'territory-1',
  },
  version: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ageInDays: 2,
}

describe('DashboardView', () => {
  beforeEach(() => {
    vi.spyOn(apiModule, 'api').mockImplementation(async (path: string) => {
      if (path.includes('/territories')) return { items: [{ id: 't1', name: 'Territory East' }] }
      if (path.startsWith('/org/countries')) return { items: [{ id: 'c1', name: 'Country A' }] }
      if (path.startsWith('/org/sites')) {
        return { items: [{ id: 's1', name: 'Site Alpha', territoryId: 't1' }] }
      }
      if (path.startsWith('/requests')) return { total: 1, items: [sampleRequest] }
      throw new Error(`Unexpected path: ${path}`)
    })
  })

  it('loads and displays requests', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: DashboardView }],
    })

    const wrapper = mount(DashboardView, {
      global: {
        plugins: [router],
        stubs: { RouterLink: RouterLink },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.text()).toContain('Forklift repair')
    expect(wrapper.text()).toContain('Total')
  })

  it('reloads with filters applied', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: DashboardView }],
    })

    const wrapper = mount(DashboardView, {
      global: { plugins: [router], stubs: { RouterLink: true } },
    })
    await flushPromises()

    const selects = wrapper.findAll('select')
    await selects[0]!.setValue('submitted')
    await wrapper.find('button.btn').trigger('click')
    await flushPromises()

    expect(apiModule.api).toHaveBeenCalledWith('/requests?status=submitted')
  })

  it('loads territories when country changes', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: DashboardView }],
    })

    const wrapper = mount(DashboardView, {
      global: { plugins: [router], stubs: { RouterLink: true } },
    })
    await flushPromises()

    const countrySelect = wrapper.findAll('select')[2]!
    await countrySelect.setValue('c1')
    await countrySelect.trigger('change')
    await flushPromises()

    expect(apiModule.api).toHaveBeenCalledWith('/org/countries/c1/territories')
    expect(wrapper.text()).toContain('Territory East')
  })
})
