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
          :hide-powered-by="hidePoweredBy"
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
          :hide-powered-by="hidePoweredBy"
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
          :key="documentRendererKey"
          :allow-content-scrolling="allowContentScrolling"
          :allow-custom-server-url="allowCustomServerUrl"
          :base-path="basePath"
          :control-address-bar="controlAddressBar"
          :current-path="currentPathDOC"
          :document="parsedDocument"
          :document-scrolling-container="documentScrollingContainer"
          :hide-download-button="hideDownloadButton"
          :hide-insomnia-try-it="hideInsomniaTryIt"
          :hide-navigation-buttons="hideNavigationButtons"
          :hide-try-it="hideTryIt"
          :markdown-styles="markdownStyles"
          :max-expanded-depth="maxExpandedDepth"
          :navigation-type="navigationType"
          :spec-url="specUrl"
          :table-of-contents="tableOfContents"
          @content-scrolled="onDocumentScroll"
          @item-selected="itemSelected"
          @path-not-found="relayPathNotFound"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue'
import composables from '../composables'
import SpecRendererToc from './spec-renderer-toc/SpecRendererToc.vue'
import SpecDocument from './spec-document/SpecDocument.vue'
import { MenuIcon } from '@kong/icons'
import SlideOut from './common/SlideOut.vue'
import type { SpecRendererProps } from '@/types'
import { IS_TRUE } from '@/utils'
import type { ServiceNode } from '@/types'
import { DEFAULT_EXPANDED_PROPERTIES_DEPTH } from '@/constants'

const {
  spec,
  basePath = '',
  currentPath = '/',
  specUrl = '',
  controlAddressBar = true,
  navigationType = 'path',
  hideSchemas = false,
  hideInternal = false,
  hideDeprecated = false,
  hideTryIt = false,
  hideInsomniaTryIt = false,
  traceParsing = false,
  withCredentials = false,
  allowContentScrolling = true,
  documentScrollingContainer = '',
  markdownStyles = true,
  allowCustomServerUrl = true,
  hideNavigationButtons = true,
  hideDownloadButton = false,
  hidePoweredBy = true,
  maxExpandedDepth = DEFAULT_EXPANDED_PROPERTIES_DEPTH,
} = defineProps<SpecRendererProps>()

// TODO: introduce and handle isParsed. show parsing state while parsing
const { parseSpecDocument, parsedDocument, tableOfContents } = composables.useSchemaParser()

const currentPathTOC = ref<string>(currentPath)
const currentPathDOC = ref<string>(currentPath)

const itemSelected = (id: any) => {
  /*
  KHCP-14499: user can select same path he is already on. Eg:
   - specrenderer first opens with '/',
   - user scrolls down few sections so path on TOC becomes '/xxx',
   - now user clicks on Overview ('/')
   we need to refresh spec document even if currentPath there is still '/' as it was during first rendering, that's why in this scenario we bump the key
  */
  currentPathTOC.value = id
  if (currentPathDOC.value === id) {
    documentRendererKey.value += 1
  } else {
    currentPathDOC.value = id
  }

  slideoutTocVisible.value = false
}

const emit = defineEmits<{
  (e: 'path-not-found', requestedPath: string): void
}>()

const documentRendererKey = ref(0)

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
  // we need to re-calculate initiallyExpanded property based on the new path
  currentPathTOC.value = path
}

watch(() => ({
  specUrl: specUrl,
  spec: spec,
  hideSchemas: hideSchemas,
  hideInternal: hideInternal,
  hideDeprecated: hideDeprecated,
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
    traceParsing: IS_TRUE(traceParsing),
    ...(changed.specUrl ? { specUrl: changed.specUrl } : null),
    withCredentials: IS_TRUE(withCredentials),
    currentPath: currentPathTOC.value,
  })

  if (traceParsing) {
    console.log('parsedDocument:', <ServiceNode>parsedDocument.value)
    console.log('tableOfContents:', tableOfContents.value)
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
