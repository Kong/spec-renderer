<template>
  <component :is="iconComponent" />
</template>

<script setup lang="ts">
import {
  LanguageBashIcon,
  LanguagePythonIcon,
  LanguageNodejsIcon,
  LanguageJavaIcon,
  LanguageJavascriptIcon,
  LanguageGoIcon,
  LanguageRubyIcon,
  LanguageSwiftIcon,
  LanguageCSharpIcon,
  LanguageCPlusPlusIcon,
  LanguagePhpIcon,
  LanguageCIcon,
  LanguageRIcon,
  LanguageJsonIcon,
} from '@kong/icons'
import { computed, type PropType } from 'vue'
import type { ProgrammingLanguage } from '@/types'
import { ProgrammingLanguagesVariants } from '@/types'

const props = defineProps({
  lang: {
    type: String as PropType<ProgrammingLanguage>,
    required: true,
    validator: (value: ProgrammingLanguage) => {
      return Object.values(ProgrammingLanguagesVariants).includes(value)
    },
  },
})

const iconComponent = computed((): typeof LanguageBashIcon => {
  switch (props.lang) {
    case 'bash':
      return LanguageBashIcon
    case 'python':
      return LanguagePythonIcon
    case 'node':
      return LanguageNodejsIcon
    case 'java':
      return LanguageJavaIcon
    case 'javascript':
      return LanguageJavascriptIcon
    case 'go':
      return LanguageGoIcon
    case 'ruby':
      return LanguageRubyIcon
    case 'swift':
      return LanguageSwiftIcon
    case 'c#':
      return LanguageCSharpIcon
    case 'c++':
      return LanguageCPlusPlusIcon
    case 'php':
      return LanguagePhpIcon
    case 'c':
      return LanguageCIcon
    case 'r':
      return LanguageRIcon
    case 'json':
      return LanguageJsonIcon
    default:
      return LanguageBashIcon
  }
})
</script>
