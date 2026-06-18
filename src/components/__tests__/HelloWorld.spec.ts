import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '@/App.vue'

describe('App.vue', () => {
  it('renders properly', () => {
    const app = mount(App, {
      global: {
        stubs: ['router-link', 'router-view'] // INFO: routing breaks this unit test for obvious reasons
      }
    })

    expect(app.text()).toContain('Laser Frontend')
  })
})
