<template>
  <div
    class="property-info"
    :class="{ 'deprecated-property': deprecated }"
    data-testid="property-field-info"
  >
    <span
      v-if="title || inheritanceTypeLabel || variantsList.length"
      class="property-title"
      data-testid="property-field-title"
    >
      <span class="property-title-name">{{ title }}</span>

      <VariantLabel
        v-if="inheritanceTypeLabel"
        class="property-title-variant-label"
        :label="inheritanceTypeLabel"
      />

      <SelectDropdown
        v-if="variantsList.length"
        :id="`${title}-variant-select-dropdown`"
        v-model="selectedVariant"
        class="property-title-variant-select"
        :items="variantsList"
        @change="handleSelectChange"
      />

    </span>
    <span class="property-type">
      <span
        v-if="formattedPropertyType"
        data-testid="property-field-type"
      >
        {{ formattedPropertyType }}
      </span>
      <span
        v-if="propertyItemType"
        data-testid="property-field-item-type"
      >
        {{ `[${propertyItemType}]` }}
      </span>
      <span
        v-if="format"
        data-testid="property-field-format"
      >
        {{ `(${format})` }}
      </span>
      <span
        v-if="requiredFields?.includes(title)"
        class="required-property"
        data-testid="property-field-required"
      >required</span>
      <span
        v-if="readOnly"
        class="readonly-property"
        data-testid="property-field-read-only"
      >read-only</span>
      <span
        v-if="uniqueItems"
        data-testid="property-field-unique-items"
      >unique-items</span>
      <LabelBadge
        v-if="deprecated"
        data-testid="property-field-deprecated"
        label="DEPRECATED"
        size="small"
        type="neutral"
      />
    </span>

    <a
      v-if="propertyPath"
      class="property-info-permalink"
      :href="`#${propertyPath}`"
    >
      <LinkIcon />
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { LinkIcon } from '@kong/icons'
import type { SchemaObject, SelectItem } from '@/types'
import type { PropType } from 'vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import VariantLabel from '@/components/common/VariantLabel.vue'
import LabelBadge from '@/components/common/LabelBadge.vue'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  propertyType: {
    type: [Array, String] as PropType<SchemaObject['type']>,
    default: '',
  },
  format: {
    type: String as PropType<SchemaObject['format']>,
    default: '',
  },
  propertyItemType: {
    type: [Array, String] as PropType<SchemaObject['type']>,
    default: '',
  },
  uniqueItems: {
    type: Boolean,
    default: false,
  },
  deprecated: {
    type: Boolean,
    default: false,
  },
  requiredFields: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  variantsList: {
    type: Array as PropType<SelectItem[]>,
    default: () => [],
  },
  inheritanceTypeLabel: {
    type: String,
    default: '',
  },
  propertyPath: {
    type: String,
    default: '',
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
})

const selectedVariant = ref('0')

const emit = defineEmits<{
  (e: 'variant-changed', variant: number): void
}>()

const formattedPropertyType = computed<string>(() => {
  if (Array.isArray(props.propertyType)) {
    return props.propertyType.join(' | ')
  }
  return props.propertyType ?? ''
})

function handleSelectChange(selecteditem: SelectItem) {
  emit('variant-changed', Number((selecteditem.value)))
}
</script>

<style lang="scss" scoped>
.property-info {
  font-family: var(--kui-font-family-code, $kui-font-family-code);

  &.deprecated-property {
    .property-title-name {
      text-decoration: line-through;
    }
  }

  > :not(:last-child) {
    margin-right: var(--kui-space-50, $kui-space-50);
  }

  .property-title {
    height: var(--kui-icon-size-40, $kui-icon-size-40);

    > :not(:last-child) {
      margin-right: var(--kui-space-50, $kui-space-50);
    }

    .property-title-name {
      color: var(--kui-color-text-primary, $kui-color-text-primary);
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      line-height: var(--kui-line-height-30, $kui-line-height-30);
    }

    .property-title-variant-select {
      :deep(.trigger-button) {
        @include small-bordered-trigger-button;

        // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
        // stylelint-disable-next-line no-duplicate-selectors
        & {
          color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
          height: var(--kui-icon-size-40, $kui-icon-size-40);
        }
      }
    }
  }

  .property-type {
    color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    line-height: var(--kui-line-height-20, $kui-line-height-20);

    > :not(:first-child) {
      margin-left: var(--kui-space-40, $kui-space-40);
    }

    .required-property {
      color: var(--kui-color-text-danger, $kui-color-text-danger);
    }

    .readonly-property {
      color: var(--kui-color-text-primary-weak, $kui-color-text-primary-weak);
    }
  }

  .property-info-permalink {
    display: inline-block;
    vertical-align: middle;
    visibility: hidden;
  }

  &:hover {
    .property-info-permalink {
      visibility: visible;
    }
  }
}
</style>
