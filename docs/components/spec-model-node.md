# SpecModelNode

## Props

#### `schema`

- type: `SchemaObject`
- required: `true`

#### `title`

- type: `String`
- required: `false`
- default: `''`


## Usage

> [!NOTE]
> This component assumes that spec has already been parsed (using `parseSpecDocument`) and we have the `parsedDocument` object available.

First, find the required schema object from the `parsedDocument` object using the schema's `uri`.

```ts
const todoSchema = parsedDocument.value.children.find((child) => child.uri === '/schemas/Todo')
```

Then, pass the schema object to the `SpecModelNode` component.

```vue
<SpecModelNode
  v-if="todoSchema"
  :schema="todoSchema.data"
  title="Todo"
/>
```
