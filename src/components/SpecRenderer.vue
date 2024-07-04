<template>
  <div class="spec-renderer-wrapper">
    <SlideoutContainer
      class="slideout-toc"
      :visible="slideoutTocVisible"
      @close="slideoutTocVisible = false"
    >
      <SpecRendererToc
        v-if="tableOfContents"
        ref="specRendererSlideoutTocRef"
        :base-path="basePath"
        class="spec-renderer-toc"
        :control-browser-url="controlBrowserUrl"
        :current-path="currentPath"
        :table-of-contents="tableOfContents"
        @item-selected="itemSelected"
      />
    </SlideoutContainer>

    <aside>
      <SpecRendererToc
        v-if="tableOfContents"
        ref="specRendererTocRef"
        :base-path="basePath"
        class="spec-renderer-toc"
        :control-browser-url="controlBrowserUrl"
        :current-path="currentPath"
        :table-of-contents="tableOfContents"
        @item-selected="itemSelected"
      />
    </aside>
    <div class="spec-renderer-header">
      <button
        class="slideout-toc-trigger-button"
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
        :hide-try-it="hideTryIt"
        :json="jsonDocument"
        @path-not-found="relayPathNotFound"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, nextTick } from 'vue'
import composables from '../composables'
import SpecRendererToc from './spec-renderer-toc/SpecRendererToc.vue'
import SpecDocument from './spec-document/SpecDocument.vue'
import { MenuIcon } from '@kong/icons'
import SlideoutContainer from './common/SlideoutContainer.vue'

const props = defineProps({
  /**
   * Text of the specification.
   */
  spec: {
    type: String,
    required: true,
  },
  /**
   * Path of the page where spec-renderer is loaded on. This is needed to compute path to individual specification details
   */
  basePath: {
    type: String,
    default: '',
  },
  /**
   * selected path to load document with
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
   * Allow component itself to control browser URL. When false it becomes the responsibility of consuming app
   */
  controlBrowserUrl: {
    type: Boolean,
    default: true,
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
})

// TODO: introduce and handle isParsed. show parsing state while parsing
const { parseSpecDocument, parsedDocument, jsonDocument, tableOfContents, validationResults } = composables.useSchemaParser()

const currentPath = ref<string>(props.currentPath)

const itemSelected = (id: any) => {
  currentPath.value = id
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
      top: scrollPosition - 50, // offset 50 so it doesn't stick to the top
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
      top: scrollPosition - 50, // offset 50 so it doesn't stick to the top
    })
  }
})
</script>

<style lang="scss" scoped>
.spec-renderer-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
  box-sizing: border-box;

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

    @media (min-width: $kui-breakpoint-tablet) {
      display: flex;
      flex-shrink: 0;
      height: 100%;
      overflow: visible;
      width: 320px;
    }
  }

  .spec-renderer-header {
    display: flex;
    background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    padding: var(--kui-space-30, $kui-space-30);
    border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);

    .slideout-toc-trigger-button {
      @include default-button-reset;

      display: flex;
      align-items: center;
      gap: var(--kui-space-20, $kui-space-20);
      padding: var(--kui-space-20, $kui-space-20) var(--kui-space-30, $kui-space-30);
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
      line-height: var(--kui-line-height-30, $kui-line-height-30);
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);

      .menu-icon {
        width: var(--kui-icon-size-40, $kui-icon-size-40) !important;
        height: var(--kui-icon-size-40, $kui-icon-size-40) !important;
        color: var(--kui-color-text-neutral, $kui-color-text-neutral) !important;
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
.spec-renderer-toc {
  @include standalone-spec-renderer-toc;
}

.slideout-toc {
  .spec-renderer-toc {
    @include standalone-spec-renderer-toc($itemPadding: var(--kui-space-40, $kui-space-40));
  }
}
</style>
