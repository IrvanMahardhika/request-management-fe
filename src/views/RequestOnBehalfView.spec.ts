import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import RequestOnBehalfView from '@/views/RequestOnBehalfView.vue'
import { createMockUser } from '@/test/helpers'
import * as apiModule from '@/lib/api'

describe('RequestOnBehalfView', () => {
  beforeEach(() => {
    vi.spyOn(apiModule, 'api')
  })

  it('loads staff and submits on-behalf request', async () => {
    const staff = createMockUser({ id: 'staff-2', fullName: 'Staff Two' })
    vi.mocked(apiModule.api)
      .mockResolvedValueOnce({ items: [staff] })
      .mockResolvedValueOnce({ request: { id: 'req-99' } })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/requests/:id', component: { template: '<div />' } }],
    })
    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mount(RequestOnBehalfView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    const inputs = wrapper.findAll('input[required]')
    await inputs[0]!.setValue('maintenance')
    await inputs[1]!.setValue('Door stuck')
    await wrapper.find('textarea').setValue('Needs fix')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(apiModule.api).toHaveBeenCalledWith('/requests/on-behalf', {
      method: 'POST',
      json: {
        type: 'maintenance',
        title: 'Door stuck',
        description: 'Needs fix',
        requestingUserId: 'staff-2',
      },
    })
    expect(pushSpy).toHaveBeenCalledWith('/requests/req-99')
  })
})
