import { ref, watch } from 'vue'
import { darkMode } from './color-mode'
import './themes/aurora.css'
import './themes/blueprint.css'
import './themes/contrast.css'
import './themes/ember.css'
import './themes/harbor.css'
import './themes/midnight.css'
import './themes/nebula.css'
import './themes/sage.css'
import './themes/slate.css'
import './themes/terminal.css'

const STORAGE_KEY = 'sandbox-spec-renderer-theme'
const FINE_TUNE_STORAGE_KEY = 'sandbox-spec-renderer-theme-fine-tune'

export interface SandboxTheme {
  value: string
  label: string
  // the sample themes only set component tokens, so each one is designed for one color mode
  colorMode?: 'light' | 'dark'
}

export const sandboxThemes: SandboxTheme[] = [
  { value: '', label: 'Default' },
  { value: 'aurora', label: 'Aurora', colorMode: 'light' },
  { value: 'blueprint', label: 'Blueprint', colorMode: 'light' },
  { value: 'contrast', label: 'Contrast', colorMode: 'light' },
  { value: 'ember', label: 'Ember', colorMode: 'light' },
  { value: 'harbor', label: 'Harbor', colorMode: 'light' },
  { value: 'midnight', label: 'Midnight', colorMode: 'light' },
  { value: 'nebula', label: 'Nebula (dark)', colorMode: 'dark' },
  { value: 'sage', label: 'Sage', colorMode: 'light' },
  { value: 'slate', label: 'Slate (dark)', colorMode: 'dark' },
  { value: 'terminal', label: 'Terminal (dark)', colorMode: 'dark' },
]

const storedTheme = localStorage.getItem(STORAGE_KEY) || ''

export const selectedTheme = ref<string>(sandboxThemes.some(theme => theme.value === storedTheme) ? storedTheme : '')

// `data-spec-renderer-theme` scopes the sample theme stylesheets in ./themes
watch(selectedTheme, (theme) => {
  if (theme) {
    document.documentElement.setAttribute('data-spec-renderer-theme', theme)
  } else {
    document.documentElement.removeAttribute('data-spec-renderer-theme')
  }
  localStorage.setItem(STORAGE_KEY, theme)

  const colorMode = sandboxThemes.find(({ value }) => value === theme)?.colorMode
  if (colorMode) {
    darkMode.value = colorMode === 'dark'
  }
}, { immediate: true })

// Off by default, so a sample theme shows what its base tokens alone do.
// `data-spec-renderer-fine-tune` turns on the second rule of each theme stylesheet: its boxed sections, dedicated and Kongponents tokens.
export const fineTune = ref<boolean>(localStorage.getItem(FINE_TUNE_STORAGE_KEY) === 'true')

watch(fineTune, (enabled) => {
  if (enabled) {
    document.documentElement.setAttribute('data-spec-renderer-fine-tune', '')
  } else {
    document.documentElement.removeAttribute('data-spec-renderer-fine-tune')
  }
  localStorage.setItem(FINE_TUNE_STORAGE_KEY, String(enabled))
}, { immediate: true })
