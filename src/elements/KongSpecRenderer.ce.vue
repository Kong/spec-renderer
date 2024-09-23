<template>
  <BaseCustomElement>
    <SpecRenderer
      :spec="props.spec"
    />
  </BaseCustomElement>
</template>

<script setup lang="ts">
import BaseCustomElement from '@/components/elements/BaseCustomElement.vue'
import SpecRenderer from '@/components/SpecRenderer.vue'
import type { NavigationTypes } from '@/types'
import type { PropType } from 'vue'

// Props are defined here for use on the custom element tag
const props = defineProps({
  /**
   * Text of the specification.
   */
  spec: {
    type: String,
    required: true,
  },
  /**
   * Path of the page where spec-renderer is loaded on.
   * his is needed to compute path to individual specification details
   */
  basePath: {
    type: String,
    default: '',
  },
  /**
   * Selected path of the spec section (ui)
   */
  currentPath: {
    type: String,
    default: '/',
  },
  /**
   * URL to fetch spec document from
   */
  specUrl: {
    type: String,
    default: '',
  },
  /**
   * Allow component itself to control URL in browser URL.
   * When false it becomes the responsibility of consuming app
   */
  controlAddressBar: {
    type: Boolean,
    default: true,
  },
  /**
      Defines how links are specified in toc
        path - id becomes part of the URL path.
        hash - uses the hash portion of the URL to keep the UI in sync with the URL.
  */
  navigationType: {
    type: String as PropType<NavigationTypes>,
    default: 'path',
  },
  /**
   * hide schemas from TOC
   */
  hideSchemas: {
    type: Boolean,
    default: false,
  },
  /**
   * hide internal endpoints from TOC
   */
  hideInternal: {
    type: Boolean,
    default: false,
  },
  /**
   * hide deprecated endpoints from TOC
   */
  hideDeprecated: {
    type: Boolean,
    default: false,
  },
  /**
   * Do not show TryIt section
   */
  hideTryIt: {
    type: Boolean,
    default: false,
  },
  /**
   * Do not show  Insomnia option in TryIt
   */
  hideInsomniaTryIt: {
    type: Boolean,
    default: false,
  },
  /**
   * console out parsing process and stages
   */
  traceParsing: {
    type: Boolean,
    default: false,
  },
  /**
   * use withCredential instructions when fetching external (http) references during parsing
   */
  withCredentials: {
    type: Boolean,
    default: false,
  },
  /**
   * Allow scrolling trough operations/schemas
   */
  allowContentScrolling: {
    type: Boolean,
    default: true,
  },
  /**
   * scrolling container that holds SpecDocument, use window by default
   */
  documentScrollingContainer: {
    type: String,
    default: '',
  },
  /**
   * Use default markdown styling. If your host application provides its own default styles, you may want to set to `false`.
   */
  markdownStyles: {
    type: Boolean,
    default: true,
  },
  /**
   * Allow user to add custom server url which will be added to the list of available servers
   */
  allowCustomServerUrl: {
    type: Boolean,
    default: false,
  },
})


</script>

<style lang="scss" scoped>
// No styles should be added to this component.
</style>
