<template>
  <div
    class="schema-example"
  >
    <div class="schema-example-header">
      <slot name="header-left">
        <span>Example</span>
      </slot>
      <div>
        <slot name="header-right" />
        <CopyButton
          :content="schemaExampleJson"
        />
      </div>
    </div>
    <CodeBlock
      :code="schemaExampleJson"
      lang="json"
    />
  </div>
</template>

<script setup lang="ts">
import CodeBlock from '../common/CodeBlock.vue'
import CopyButton from '../common/CopyButton.vue'

defineProps({
  schemaExampleJson: {
    type: String,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.schema-example {
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  height: max-content;
  overflow: hidden;

  .schema-example-header {
    align-items: center;
    background: var(--kui-color-background, $kui-color-background);
    border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    color: var(--kui-color-text, $kui-color-text);
    display: flex;
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    justify-content: space-between;
    line-height: var(--kui-line-height-40, $kui-line-height-40);
    padding: var(--kui-space-50, $kui-space-50);
  }
}
</style>
