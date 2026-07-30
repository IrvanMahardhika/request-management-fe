import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory, RouterLink } from 'vue-router'
import ReportView from '@/views/ReportView.vue'
import type { OperationalRequest } from '@/types'
import * as apiModule from '@/lib/api'

const sampleRequest: OperationalRequest = {
  id: 'req-1',
  type: 'equipment',
  title: 'Forklift repair',
  description: 'Broken',
  priority: 'high',
  status: 'approved',
  requestingUserId: 'user-1',
  siteId: 'site-1',
  version: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ageInDays: 5,
}

describe('ReportView', () => {
  beforeEach(() => {
    vi.spyOn(apiModule, 'api').mockResolvedValue({
      total: 1,
      byStatus: { approved: 1 },
      byPriority: { high: 1 },
      items: [sampleRequest],
    })
  })

  it('loads platform report data', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: ReportView }],
    })

    const wrapper = mount(ReportView, {
      props: { level: 'platform' },
      global: { plugins: [router], stubs: { RouterLink: RouterLink } },
    })

    await flushPromises()

    expect(apiModule.api).toHaveBeenCalledWith('/reports/platform')
    expect(wrapper.text()).toContain('platform reporting')
    expect(wrapper.text()).toContain('Forklift repair')
    expect(wrapper.text()).toContain('approved: 1')
  })

  it('shows error when report load fails', async () => {
    vi.mocked(apiModule.api).mockRejectedValue(new Error('Forbidden'))

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: ReportView }],
    })

    const wrapper = mount(ReportView, {
      props: { level: 'country' },
      global: { plugins: [router], stubs: { RouterLink: true } },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Forbidden')
  })
})
