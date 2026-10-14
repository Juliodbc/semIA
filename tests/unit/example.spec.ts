import { mount } from '@vue/test-utils'
import router from '@/router'
import Tab1Page from '@/views/Tab1Page.vue'
import { describe, expect, test } from 'vitest'

describe('Tab1Page.vue', () => {
  test('renders the sign-in screen', () => {
    const wrapper = mount(Tab1Page, { global: { plugins: [router] } })
    expect(wrapper.text()).toContain('Minha conta')
    expect(wrapper.text()).toContain('Bem-vindo')
    expect(wrapper.text()).toContain('Criar uma conta')
  })
})
