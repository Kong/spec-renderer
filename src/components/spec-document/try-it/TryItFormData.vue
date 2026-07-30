<template>
  <div class="wide form-data-fields">
    <div
      v-for="field in fields"
      :key="`request-body-formfield-${field.name}`"
      class="param-wrapper"
    >
      <InputLabel
        class="param-label"
        :for="`request-body-formfield-input-${field.name}-${data.id}`"
      >
        <div
          v-if="field.required"
          class="required-label"
        >
          *
        </div>
        {{ field.name }}
        <Tooltip
          v-if="field.description"
          :id="`request-body-formfield-tooltip-${field.name}-${data.id}`"
        >
          <template #content>
            <MarkdownRenderer
              :markdown="field.description"
            />
          </template>
        </Tooltip>
      </InputLabel>

      <input
        v-if="field.kind === 'text'"
        :id="`request-body-formfield-input-${field.name}-${data.id}`"
        v-model="fieldState[field.name]!.value"
        :aria-describedby="`request-body-formfield-tooltip-${field.name}-${data.id}`"
        autocomplete="off"
        :data-testid="`tryit-body-formfield-${field.name}-${data.id}`"
        type="text"
      >

      <EditableCodeBlock
        v-else-if="field.kind === 'json'"
        class="form-field-code-block"
        :code="fieldState[field.name]!.value ?? ''"
        :data-testid="`tryit-body-formfield-${field.name}-${data.id}`"
        lang="json"
        @request-body-changed="(newValue: string) => setTextValue(field.name, newValue)"
      />

      <div
        v-else
        class="file-field"
      >
        <button
          class="choose-file-btn secondary"
          :data-testid="`tryit-body-formfield-choose-file-${field.name}-${data.id}`"
          type="button"
          @click="chooseFile(field)"
        >
          Choose file{{ field.multiple ? 's' : '' }}
        </button>
        <span
          v-if="!fieldState[field.name]?.files?.length"
          class="choose-file-text"
        >No file selected</span>
        <span
          v-else
          class="choose-file-text"
          :data-testid="`tryit-body-formfield-filename-${field.name}-${data.id}`"
        >{{ fieldState[field.name]!.files!.map(f => f.name).join(', ') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { useFileDialog } from '@vueuse/core'
import type { IHttpOperation } from '@stoplight/types'
import InputLabel from '@/components/common/InputLabel.vue'
import Tooltip from '@/components/common/TooltipPopover.vue'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
import EditableCodeBlock from '@/components/common/EditableCodeBlock.vue'
import type { RequestBody, RequestFormField } from '@/types'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
  fields: {
    type: Array as PropType<RequestFormField[]>,
    default: () => [],
  },
})

const emit = defineEmits<{
  (e: 'request-body-changed', newBody: RequestBody): void
}>()

interface FieldState {
  value?: string
  files?: File[]
}

// Local value/files per field, kept separate from the `fields` prop so in-progress edits survive
// the request body round-tripping back down from the parent.
const fieldState = reactive<Record<string, FieldState>>({})

// Only a genuine operation change forces every field back to its schema-derived default; otherwise
// existing entries are preserved so the round-tripped `fields` prop doesn't reset what the user typed.
const currentEndpointID = ref(props.data.id)

// Resets all fields on an operation change; otherwise only fills in fields with no local state yet.
watch(() => props.fields, (newFields) => {
  const operationChanged = props.data.id !== currentEndpointID.value
  currentEndpointID.value = props.data.id

  const seenNames = new Set<string>()
  newFields.forEach(field => {
    seenNames.add(field.name)
    if (operationChanged || !fieldState[field.name]) {
      fieldState[field.name] = { value: field.value, files: field.files }
    }
  })

  if (operationChanged) {
    Object.keys(fieldState).forEach(name => {
      if (!seenNames.has(name)) {
        delete fieldState[name]
      }
    })
  }
}, { immediate: true })

let activeFileField: RequestFormField | null = null

const { open: openFileDialog, onChange: onChangeFileDialog } = useFileDialog({
  directory: false,
  reset: true,
})

onChangeFileDialog((files) => {
  if (!activeFileField || !files) {
    return
  }
  fieldState[activeFileField.name] = { ...fieldState[activeFileField.name], files: Array.from(files) }
})

const chooseFile = (field: RequestFormField) => {
  activeFileField = field
  openFileDialog({ multiple: !!field.multiple, accept: field.contentType })
}

const setTextValue = (name: string, value: string) => {
  fieldState[name] = { ...fieldState[name], value }
}

// Re-emits the full multipart RequestBody whenever any field's value/files change.
watch(fieldState, (newFieldState) => {
  const formFields: RequestFormField[] = props.fields.map(field => ({
    ...field,
    value: newFieldState[field.name]?.value,
    files: newFieldState[field.name]?.files,
  }))
  emit('request-body-changed', { isMultipart: true, formFields })
}, { deep: true })
</script>

<style lang="scss" scoped>
.form-data-fields {
  .param-wrapper {
    margin-bottom: var(--kui-space-40, $kui-space-40);

    &:last-child {
      margin-bottom: var(--kui-space-20, $kui-space-20);
    }

    .param-label {
      margin-bottom: var(--kui-space-40, $kui-space-40);
    }
  }
}

input[type=text] {
  @include input-default;
}

.choose-file-btn {
  @include button-default;
  margin: var(--kui-space-0, $kui-space-0) var(--kui-space-30, $kui-space-30) var(--kui-space-0, $kui-space-0) 0!important;
  width: 100px;
}

.choose-file-text {
  font-size: var(--kui-font-size-20, $kui-font-size-20);
}

.required-label {
  color: var(--kui-icon-color-danger, $kui-icon-color-danger);
  height: 14px;
}
</style>
