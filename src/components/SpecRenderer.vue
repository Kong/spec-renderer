<template>
  <div class="spec-renderer-wrapper">
    <SlideOut
      v-if="tableOfContents"
      class="slideout-toc"
      :title="parsedDocument?.name || 'Table of Contents'"
      :visible="slideoutTocVisible"
      @close="slideoutTocVisible = false"
    >
      <SpecRendererToc
        ref="specRendererSlideoutTocRef"
        :base-path="basePath"
        class="spec-renderer-toc"
        :control-address-bar="controlAddressBar"
        :current-path="currentPath"
        :navigation-type="navigationType"
        :table-of-contents="tableOfContents"
        @item-selected="itemSelected"
      />
    </SlideOut>

    <aside>
      <SpecRendererToc
        v-if="tableOfContents"
        ref="specRendererTocRef"
        :base-path="basePath"
        class="spec-renderer-toc"
        :control-address-bar="controlAddressBar"
        :current-path="currentPath"
        :navigation-type="navigationType"
        :table-of-contents="tableOfContents"
        @item-selected="itemSelected"
      />
    </aside>

    <!-- small screen menu button - hidden on kui-breakpoint-tablet -->
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
        :base-path="basePath"
        :current-path="currentPath"
        :document="parsedDocument"
        :hide-insomnia-try-it="hideInsomniaTryIt"
        :hide-try-it="hideTryIt"
        :json="jsonDocument"
        :markdown-styles="markdownStyles"
        :spec-url="specUrl"
        @path-not-found="relayPathNotFound"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, nextTick } from 'vue'
import type { PropType } from 'vue'
import composables from '../composables'
import SpecRendererToc from './spec-renderer-toc/SpecRendererToc.vue'
import SpecDocument from './spec-document/SpecDocument.vue'
import { MenuIcon } from '@kong/icons'
import SlideOut from './common/SlideOut.vue'
import type { NavigationTypes } from '@/types'

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
   * Use default markdown styling
   */
  markdownStyles: {
    type: Boolean,
    default: true,
  },
})

// TODO: introduce and handle isParsed. show parsing state while parsing
const { parseSpecDocument, parsedDocument, jsonDocument, tableOfContents, validationResults } = composables.useSchemaParser()

const currentPath = ref<string>(props.currentPath)

const itemSelected = (id: any) => {
  currentPath.value = id

  slideoutTocVisible.value = false
}

const emit = defineEmits<{
  (e: 'path-not-found', requestedPath: string): void
}>()


const specRendererTocRef = ref<InstanceType<typeof SpecRendererToc> | null>(null)
const specRendererSlideoutTocRef = ref<InstanceType<typeof SpecRendererToc> | null>(null)
const slideoutTocVisible = ref<boolean>(false)

/**
 * re-emits path-not-found event so application that consumes SpecRender component can handle 404
 */
const relayPathNotFound = (requestedPath: string): void => {
  emit('path-not-found', requestedPath)
}

const openSlideoutToc = async (): Promise<void> => {
  slideoutTocVisible.value = true

  await nextTick() // wait for slideout to open

  if (specRendererSlideoutTocRef.value?.$el?.scrollTo) {
    const scrollPosition = await specRendererSlideoutTocRef.value?.getActiveItemScrollPosition()

    specRendererSlideoutTocRef.value?.$el.scrollTo({
      top: scrollPosition - 50, // offset 50px so it doesn't stick to the top
    })
  }
}

watch(() => ({
  specUrl: props.specUrl,
  spec: props.spec,
  hideSchemas: props.hideSchemas,
  hideInternal: props.hideInternal,
}), async (changed, prev) => {

  // we want to reset currentPath if document changed. if new document is getting loadedm we want to keep the path
  if (prev && (changed.spec !== prev?.spec || changed.specUrl !== prev?.specUrl)) {
    currentPath.value = '/'
  }

  await parseSpecDocument(changed.spec, {
    hideSchemas: changed.hideSchemas,
    hideInternal: changed.hideInternal,
    traceParsing: props.traceParsing,
    ...(changed.specUrl ? { specUrl: changed.specUrl } : null),
    withCredentials: props.withCredentials,
    currentPath: currentPath.value,
  })

  if (props.traceParsing) {
    console.log('parsedDocument:', parsedDocument.value)
    console.log('tableOfContents:', tableOfContents.value)
    console.log('validationResults:', validationResults.value)
  }
}, { immediate: true })

/**
 * Once element is in the DOM, trigger scroll to active item in TOC.
 */
watch(specRendererTocRef, async (val) => {
  if (val?.$el?.scrollTo) {
    const scrollPosition = await val.getActiveItemScrollPosition()

    val.$el.scrollTo({
      top: scrollPosition - 50, // offset 50px so it doesn't stick to the top
    })
  }
})
</script>

<style lang="scss" scoped>
.spec-renderer-wrapper {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;

  @media (min-width: $kui-breakpoint-tablet) {
    flex-direction: row;
  }

  .slideout-toc {
    :deep(.slideout-container) {
      padding-left: var(--kui-space-0, $kui-space-0);

      .slideout-content {
        padding-right: var(--kui-space-0, $kui-space-0);
      }
    }

    @media (min-width: $kui-breakpoint-tablet) {
      display: none;
    }
  }

  aside {
    display: none;
    flex-shrink: 0;
    height: 100vh;
    left: 0;
    position: sticky;
    top: 0;
    width: 320px;

    @media (min-width: $kui-breakpoint-tablet) {
      display: flex;
    }
  }

  .spec-renderer-small-screen-header {
    background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    display: flex;
    padding: var(--kui-space-30, $kui-space-30);

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

    @media (min-width: $kui-breakpoint-tablet) {
      display: none;
    }
  }

  .doc {
    flex: 1;
    overflow: visible;
    padding: var(--kui-space-60, $kui-space-60);
  }
}

/*
Styles for SpecRendererToc that need to live here so that they apply to the TOC
when it's rendered in the context of the SpecRenderer.
Otherwise host app should have control over these styles.
*/
@mixin standalone-spec-renderer-toc($itemPadding: var(--kui-space-70, $kui-space-70)) {
  background-color: var(--kui-color-background, $kui-color-background);
  position: relative; // important, need this for scrolling to selected item

  :deep(>) {
    ul > *:first-child {
      // overview item
      padding: $itemPadding;
      padding-bottom: var(--kui-space-0, $kui-space-0);
    }
  }

  :deep(.group-item) {
    &.root {
      padding-left: $itemPadding;
      padding-right: $itemPadding;
    }
  }
}

.spec-renderer-toc {
  @include standalone-spec-renderer-toc;
}

.slideout-toc {
  .spec-renderer-toc {
    @include standalone-spec-renderer-toc($itemPadding: var(--kui-space-40, $kui-space-40));

    :deep(>) {
      ul > *:last-child {
        padding-bottom: var(--kui-space-0, $kui-space-0);
      }
    }
  }
}
</style>
