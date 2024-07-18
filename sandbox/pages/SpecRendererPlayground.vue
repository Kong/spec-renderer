<template>
  <SpecRenderer
    v-if="specText || specUrl"
    base-path="/spec-renderer"
    :current-path="currentPath"
    :hide-schemas="hideSchemas"
    :hide-try-it="hideTryIt"
    :spec="specText"
    :spec-url="specUrl"
    :trace-parsing="true"
    @path-not-found="handlePathNotFound"
  />
</template>

<script setup lang="ts">
import { inject, ref, watch } from 'vue'
import type { Ref } from 'vue'
import SpecRenderer from '../../src/components/SpecRenderer.vue'
import { useRoute as useVueRoute } from 'vue-router'

const route = useVueRoute()
const key = ref<number>(0)

const currentPath = ref<string>(route.path)

const specText = inject<Ref<string>>('spec-text', ref<string>(''))
const specUrl = inject<Ref<string>>('spec-url', ref<string>(''))
const hideSchemas = inject<Ref<boolean>>('hide-schemas', ref<boolean>(false))
const hideTryIt = inject<Ref<boolean>>('hide-try-it', ref<boolean>(false))

const handlePathNotFound = (requestedPath: string) => {
  console.error(`${requestedPath} not found. App to redirect to it's own 404`)
}

watch([specText, specUrl], () => {
  currentPath.value = '/'
})
</script>
