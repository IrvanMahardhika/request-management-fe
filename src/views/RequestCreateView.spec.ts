import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import RequestCreateView from '@/views/RequestCreateView.vue'
import * as apiModule from '@/lib/api'

describe('RequestCreateView', () => {
  beforeEach(() => {
    vi.spyOn(apiModule, 'api')
  })

  it('creates a request and navigates to detail page', async () => {
    vi.mocked(apiModule.api).mockResolvedValue({ request: { id: 'req-1' } })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/requests/:id', component: { template: '<div />' } }],
    })
    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mount(RequestCreateView, {
      global: { plugins: [router] },
    })

    await wrapper.find('input[required]').setValue('equipment')
    const inputs = wrapper.findAll('input[required]')
    await inputs[1]!.setValue('Broken forklift')
    await wrapper.find('textarea').setValue('Needs repair')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(apiModule.api).toHaveBeenCalledWith('/requests', {
      method: 'POST',
      json: {
        type: 'equipment',
        title: 'Broken forklift',
        description: 'Needs repair',
      },
    })
    expect(pushSpy).toHaveBeenCalledWith('/requests/req-1')
  })

  it('shows error when create fails', async () => {
    vi.mocked(apiModule.api).mockRejectedValue(new Error('Validation failed'))

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    })

    const wrapper = mount(RequestCreateView, {
      global: { plugins: [router] },
    })

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Validation failed')
  })
})
