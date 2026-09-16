import { ref, watch } from 'vue'

const STORAGE_KEY = 'sandbox-color-mode'

export const darkMode = ref<boolean>(localStorage.getItem(STORAGE_KEY) === 'dark')

// `data-kui-theme` drives the @kong/design-tokens stylesheets, so dark mode here resolves real token values rather than SCSS fallbacks.
watch(darkMode, (isDark) => {
  const colorMode = isDark ? 'dark' : 'light'

  document.documentElement.setAttribute('data-portal-color-mode', colorMode)
  document.documentElement.setAttribute('data-kui-theme', isDark ? 'classic-night' : 'classic-day')
  localStorage.setItem(STORAGE_KEY, colorMode)
}, { immediate: true })
