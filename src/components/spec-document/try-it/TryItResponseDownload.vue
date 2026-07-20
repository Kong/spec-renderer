<template>
  <div
    class="response-download"
    :data-testid="`tryit-response-binary-${dataId}`"
  >
    <div class="response-download-info">
      <FileEmptyIcon
        class="response-download-icon"
        :size="`var(--kui-icon-size-40, ${KUI_ICON_SIZE_40})`"
      />
      <div class="response-download-meta">
        <span class="response-download-name">{{ downloadFileName }}</span>
        <span class="response-download-detail">
          {{ contentType || 'binary' }}<template v-if="sizeText"> · {{ sizeText }}</template>
        </span>
      </div>
    </div>
    <a
      class="response-download-btn"
      :data-testid="`tryit-response-download-${dataId}`"
      :download="downloadFileName"
      :href="url"
    >
      <DownloadIcon :size="`var(--kui-icon-size-30, ${KUI_ICON_SIZE_30})`" />
      Download
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import { DownloadIcon, FileEmptyIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30, KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import { extensionForContentType, parseContentDispositionFilename, formatBytes } from '@/utils'

const props = defineProps({
  /** object URL backing the download link */
  url: {
    type: String,
    required: true,
  },
  dataId: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    default: '',
  },
  contentDisposition: {
    type: String as PropType<string | null>,
    default: null,
  },
  size: {
    type: Number as PropType<number | null>,
    default: null,
  },
})

const downloadFileName = computed((): string => {
  const fromHeader = parseContentDispositionFilename(props.contentDisposition)
  if (fromHeader) return fromHeader
  return `${props.dataId || 'response'}.${extensionForContentType(props.contentType)}`
})

const sizeText = computed((): string =>
  props.size != null ? formatBytes(props.size) : '',
)
</script>

<style lang="scss" scoped>
.response-download {
  align-items: center;
  background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  display: flex;
  gap: var(--kui-space-40, $kui-space-40);
  justify-content: space-between;
  padding: var(--kui-space-50, $kui-space-50);

  .response-download-info {
    align-items: center;
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);
    min-width: 0;

    .response-download-icon {
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
      flex-shrink: 0;
    }

    .response-download-meta {
      display: flex;
      flex-direction: column;
      min-width: 0;

      .response-download-name {
        color: var(--kui-color-text, $kui-color-text);
        font-family: var(--kui-font-family-code, $kui-font-family-code);
        font-size: var(--kui-font-size-30, $kui-font-size-30);
        font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .response-download-detail {
        color: var(--kui-color-text-neutral, $kui-color-text-neutral);
        font-size: var(--kui-font-size-20, $kui-font-size-20);
        line-height: var(--kui-line-height-20, $kui-line-height-20);
      }
    }
  }

  .response-download-btn {
    align-items: center;
    background-color: var(--kui-color-background, $kui-color-background);
    border: var(--kui-border-width-20, $kui-border-width-20) solid var(--kui-color-border-primary, $kui-color-border-primary);
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    color: var(--kui-color-text-primary, $kui-color-text-primary);
    display: inline-flex;
    flex-shrink: 0;
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    gap: var(--kui-space-30, $kui-space-30);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    padding: var(--kui-space-20, $kui-space-20) var(--kui-space-40, $kui-space-40);
    text-decoration: none;
    white-space: nowrap;

    &:hover,
    &:focus,
    &:active {
      background-color: var(--kui-color-background-primary-weakest, $kui-color-background-primary-weakest);
    }
  }
}
</style>
