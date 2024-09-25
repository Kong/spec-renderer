<template>
  <div class="spec-renderer-wrapper">
    <div class="spec-renderer-content">
      <SlideOut
        v-if="tableOfContents"
        class="slideout-toc"
        :title="(parsedDocument as ServiceNode)?.name || 'Table of Contents'"
        :visible="slideoutTocVisible"
        @close="slideoutTocVisible = false"
      >
        <SpecRendererToc
          v-if="slideoutTocVisible"
          ref="specRendererSlideoutTocRef"
          :base-path="basePath"
          class="spec-renderer-toc"
          :control-address-bar="controlAddressBar"
          :current-path="currentPathTOC"
          :navigation-type="navigationType"
          :table-of-contents="tableOfContents"
          @item-selected="itemSelected"
        />
      </SlideOut>

      <aside>
        <SpecRendererToc
          v-if="tableOfContents && !slideoutTocVisible"
          ref="specRendererTocRef"
          :base-path="basePath"
          class="spec-renderer-toc"
          :control-address-bar="controlAddressBar"
          :current-path="currentPathTOC"
          :navigation-type="navigationType"
          :table-of-contents="tableOfContents"
          @item-selected="itemSelected"
        />
      </aside>

      <div
        v-if="tableOfContents"
        class="spec-renderer-small-screen-header"
      >
        <button
          class="slideout-toc-trigger-button"
          type="button"
          @click="openSlideoutToc"
        >
          <MenuIcon class="menu-icon" />
          Menu
        </button>
      </div>

      <div class="doc">
        <SpecDocument
          v-if="parsedDocument && currentPath"
          :allow-content-scrolling="allowContentScrolling"
          :allow-custom-server-url="allowCustomServerUrl"
          :base-path="basePath"
          :control-address-bar="controlAddressBar"
          :current-path="currentPathDOC"
          :document="parsedDocument"
          :document-scrolling-container="documentScrollingContainer"
          :hide-insomnia-try-it="hideInsomniaTryIt"
          :hide-try-it="hideTryIt"
          :markdown-styles="markdownStyles"
          :navigation-type="navigationType"
          :spec-url="specUrl"
          @content-scrolled="onDocumentScroll"
          @path-not-found="relayPathNotFound"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue'
import type { PropType } from 'vue'
import composables from '../composables'
import SpecRendererToc from './spec-renderer-toc/SpecRendererToc.vue'
import SpecDocument from './spec-document/SpecDocument.vue'
import { MenuIcon } from '@kong/icons'
import SlideOut from './common/SlideOut.vue'
import type { NavigationTypes } from '@/types'
import { BOOL_VALIDATOR, IS_TRUE } from '@/constants'
import type { ServiceNode } from '@/types'

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
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
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
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: false,
  },
  /**
   * hide internal endpoints from TOC
   */
  hideInternal: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: false,
  },
  /**
   * hide deprecated endpoints from TOC
   */
  hideDeprecated: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: false,
  },
  /**
   * Do not show TryIt section
   */
  hideTryIt: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: false,
  },
  /**
   * Do not show  Insomnia option in TryIt
   */
  hideInsomniaTryIt: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: false,
  },
  /**
   * console out parsing process and stages
   */
  traceParsing: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: false,
  },
  /**
   * use withCredential instructions when fetching external (http) references during parsing
   */
  withCredentials: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: false,
  },
  /**
   * Allow scrolling trough operations/schemas
   */
  allowContentScrolling: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
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
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: true,
  },
  /**
   * Allow user to add custom server url which will be added to the list of available servers
   */
  allowCustomServerUrl: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: false,
  },
})

// TODO: introduce and handle isParsed. show parsing state while parsing
const { parseSpecDocument, parsedDocument, tableOfContents, validationResults } = composables.useSchemaParser()

const currentPathTOC = ref<string>(props.currentPath)
const currentPathDOC = ref<string>(props.currentPath)

const itemSelected = (id: any) => {
  currentPathTOC.value = id
  currentPathDOC.value = id

  slideoutTocVisible.value = false
}

const emit = defineEmits<{
  (e: 'path-not-found', requestedPath: string): void
}>()


const slideoutTocVisible = ref<boolean>(false)
/**
 * re-emits path-not-found event so application that consumes SpecRender component can handle 404
 */
const relayPathNotFound = (requestedPath: string): void => {
  emit('path-not-found', requestedPath)
}

const openSlideoutToc = async (): Promise<void> => {
  slideoutTocVisible.value = true
}

const onDocumentScroll = (path: string) => {
  currentPathTOC.value = path
  // we need to re-calculate initiallyExpanded property based on the new path
  if (props.controlAddressBar) {
    window.history.pushState({}, '', props.basePath + path)
  }
}

watch(() => ({
  specUrl: props.specUrl,
  spec: props.spec,
  hideSchemas: props.hideSchemas,
  hideInternal: props.hideInternal,
  hideDeprecated: props.hideDeprecated,
}), async (changed, prev) => {

  // we want to reset currentPath if document changed. if new document is getting loadedm we want to keep the path
  if (prev && (changed.spec !== prev?.spec || changed.specUrl !== prev?.specUrl)) {
    currentPathDOC.value = '/'
    currentPathTOC.value = '/'
  }

  await parseSpecDocument(changed.spec, {
    hideSchemas: IS_TRUE(changed.hideSchemas),
    hideInternal: IS_TRUE(changed.hideInternal),
    hideDeprecated: IS_TRUE(changed.hideDeprecated),
    traceParsing: IS_TRUE(props.traceParsing),
    ...(changed.specUrl ? { specUrl: changed.specUrl } : null),
    withCredentials: IS_TRUE(props.withCredentials),
    currentPath: currentPathTOC.value,
  })

  if (props.traceParsing) {
    console.log('parsedDocument:', <ServiceNode>parsedDocument.value)
    console.log('tableOfContents:', tableOfContents.value)
    console.log('validationResults:', validationResults.value)
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
@mixin spec-renderer-content-small {
  flex-direction: column;

  aside {
    display: none;
  }

  .spec-renderer-small-screen-header {
    display: flex;
  }
}

.spec-renderer-wrapper {
  box-sizing: border-box;
  container: spec-renderer / inline-size;
  width: 100%;

  .spec-renderer-content {
    display: flex;
    min-height: 100vh;
    position: relative;

    aside {
      display: flex;
      flex-shrink: 0;
      height: 100vh;
      left: 0;
      position: sticky;
      top: 0;
      width: 320px;
    }

    .spec-renderer-small-screen-header {
      background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
      border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
      display: none;
      padding: var(--kui-space-30, $kui-space-30);
      position: sticky;
      top: 0;
      z-index: 1000;

      .slideout-toc-trigger-button {
        @include default-button-reset;

        align-items: center;
        color: var(--kui-color-text-neutral, $kui-color-text-neutral);
        display: flex;
        font-size: var(--kui-font-size-30, $kui-font-size-30);
        font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
        gap: var(--kui-space-20, $kui-space-20);
        line-height: var(--kui-line-height-30, $kui-line-height-30);
        padding: var(--kui-space-20, $kui-space-20) var(--kui-space-30, $kui-space-30);

        .menu-icon {
          color: var(--kui-color-text-neutral, $kui-color-text-neutral) !important;
          height: var(--kui-icon-size-40, $kui-icon-size-40) !important;
          width: var(--kui-icon-size-40, $kui-icon-size-40) !important;
        }

        &:hover,
        &:focus {
          color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);

          .menu-icon {
            color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong) !important;
          }
        }
      }
    }

    .doc {
      flex: 1;
      overflow: visible;
      padding: var(--kui-space-60, $kui-space-60);
    }

    @supports (container: inline-size) {
      // need to use interpolation for the token here because otherwise the query don't work
      @container spec-renderer (max-width: #{$kui-breakpoint-tablet - 1px}) {
        @include spec-renderer-content-small;
      }
    }

    // regular media query fallback
    @supports not (container: inline-size) {
      @media (max-width: ($kui-breakpoint-tablet - 1px)) {
        @include spec-renderer-content-small;
      }
    }
  }
}

/*
Styles for SpecRendererToc that need to live here so that they apply to the TOC when it's rendered in the context of the SpecRenderer.
Otherwise host app should have control over these styles.
*/
aside {
  .spec-renderer-toc {
    background-color: var(--kui-color-background, $kui-color-background);
    position: relative; // important, need this for scrolling to selected item

    :deep(>) {
      // overview item
      ul > *:first-child {
        padding: var(--kui-space-70, $kui-space-70);
        padding-bottom: var(--kui-space-0, $kui-space-0);
      }
    }

    :deep(.group-item) {
      &.root {
        padding-left: var(--kui-space-70, $kui-space-70);
        padding-right: var(--kui-space-70, $kui-space-70);
      }
    }
  }
}
</style>

<style lang="scss">
/*
! Needs to be unscoped because .slideout-toc is teleported to the body.
Styles for SpecRendererToc that need to live here so that they apply to the TOC when it's rendered in the context of the SpecRenderer.
Otherwise host app should have control over these styles.
*/
.slideout-toc {
  .spec-renderer-toc {
    position: relative; // important, need this for scrolling to selected item

    > {
      ul > * {
        // overview item
        &:first-child {
          padding: var(--kui-space-40, $kui-space-40);
          padding-bottom: var(--kui-space-0, $kui-space-0);
        }

        // last item (usually schemas)
        &:last-child {
          padding-bottom: var(--kui-space-0, $kui-space-0);
        }
      }
    }

    .group-item {
      &.root {
        padding-left: var(--kui-space-40, $kui-space-40);
        padding-right: var(--kui-space-40, $kui-space-40);
      }
    }
  }
}
</style>
