import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory, RouterLink } from 'vue-router'
import RequestDetailView from '@/views/RequestDetailView.vue'
import type { OperationalRequest } from '@/types'
import { createMockUser } from '@/test/helpers'
import { setSession } from '@/lib/auth'
import { useAuth } from '@/composables/useAuth'
import * as apiModule from '@/lib/api'

const baseRequest: OperationalRequest = {
  id: 'req-1',
  type: 'equipment',
  title: 'Forklift repair',
  description: 'Broken hydraulic line',
  priority: 'standard',
  status: 'submitted',
  requestingUserId: 'other-user',
  requestingUser: {
    id: 'other-user',
    fullName: 'Other Staff',
    email: 'other@example.com',
    status: 'active',
  },
  siteId: 'site-1',
  site: {
    id: 'site-1',
    name: 'Site Alpha',
    territoryId: 'territory-1',
    territory: {
      id: 'territory-1',
      name: 'Territory East',
      countryId: 'country-1',
      country: { id: 'country-1', name: 'Country A', code: 'CA' },
    },
  },
  version: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ageInDays: 1,
}

describe('RequestDetailView', () => {
  beforeEach(() => {
    localStorage.clear()
    const { logout, state } = useAuth()
    logout()
    state.ready = true

    const user = createMockUser({
      permissions: [
        'review_standard_priority_request',
        'view_request_history',
        'approve_standard_priority_request',
      ],
      role: { id: 'r1', code: 'territory_manager', name: 'Territory Manager', organizationScope: 'territory' },
    })
    setSession('token', user)
    state.user = user

    vi.spyOn(apiModule, 'api').mockImplementation(async (path: string, options?: RequestInit & { json?: unknown }) => {
      if (path === '/requests/req-1') return { request: { ...baseRequest, status: 'under_review' } }
      if (path === '/requests/req-1/history') {
        return {
          audit: [
            {
              id: 'a1',
              action: 'start_review',
              actingUserDisplayName: 'Manager',
              previousStatus: 'submitted',
              newStatus: 'under_review',
              note: null,
              createdAt: '2026-01-02T00:00:00.000Z',
            },
          ],
          infoMessages: [
            {
              id: 'm1',
              messageType: 'question',
              body: 'Need serial number',
              authorName: 'Manager',
              createdAt: '2026-01-02T01:00:00.000Z',
            },
          ],
        }
      }
      if (path.endsWith('/approve')) return {}
      throw new Error(`Unexpected path: ${path} ${options?.method || 'GET'}`)
    })
  })

  it('loads request details and history', async () => {
    vi.mocked(apiModule.api).mockImplementation(async (path: string) => {
      if (path === '/requests/req-1') return { request: baseRequest }
      if (path === '/requests/req-1/history') {
        return { audit: [], infoMessages: [] }
      }
      throw new Error(path)
    })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/requests/:id', component: RequestDetailView }],
    })
    await router.push('/requests/req-1')
    await router.isReady()

    const wrapper = mount(RequestDetailView, {
      global: { plugins: [router], stubs: { RouterLink: RouterLink } },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Forklift repair')
    expect(wrapper.text()).toContain('Broken hydraulic line')
    expect(wrapper.text()).toContain('Start review')
  })

  it('approves a request under review', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/requests/:id', component: RequestDetailView }],
    })
    await router.push('/requests/req-1')
    await router.isReady()

    const wrapper = mount(RequestDetailView, {
      global: { plugins: [router], stubs: { RouterLink: true } },
    })
    await flushPromises()

    const approveButton = wrapper.findAll('button').find((b) => b.text() === 'Approve')
    expect(approveButton).toBeTruthy()
    await approveButton!.trigger('click')
    await flushPromises()

    expect(apiModule.api).toHaveBeenCalledWith('/requests/req-1/approve', {
      method: 'POST',
      json: {},
    })
  })
})
