import { defineConfig, presetAttributify, presetIcons, presetUno } from 'unocss'

export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetIcons()],
  theme: {
    colors: {
      brand: {
        50: '#eef6ff',
        100: '#d9ebff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8'
      }
    }
  }
})
