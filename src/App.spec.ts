import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import App from '@/App.vue'

describe('App', () => {
  it('renders router view', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
    })

    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: { RouterView: RouterView },
      },
    })

    expect(wrapper.findComponent(RouterView).exists()).toBe(true)
  })
})
