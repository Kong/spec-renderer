# SelectDropdown

SelectDropdown is a fly-out component that can act both like `select` HTML element and dropdown action menu (with no notion of selecting an item but rather triggering action or navigation on item click).

## Accessibility

`id` attribute is required for better accessibility. SelectDropdown binds passed `id` attribute to trigger button element.

## Props

### `items`

* type: `SelectItem`
* required: `true`

[`SelectItem` interface](../../../src/types/dropdown.ts) is rather straight-forward:

```ts
interface SelectItem {
  label: string
  value: string
  /**
   * Unique key for the item `id` and `data-testid` attributes. If not provided, the item will use a generic selector.
   * Also, `item.key` is used for generating item slots. If not provided, the item will not have a slot.
   */
  key?: string
}
```

If you wish to use slots to provide custom content for dropdown items, you need to pass `item.key` parameter - otherwise it's optional.

### `modelValue`

* type: `string`
* required: `false`
* default: `''`

SelectDropdown supports `v-model` binding.

### `triggerButton`

* type: `string`
* required: `false`
* default: `Select`

Default trigger button text.

### `placement`

* type: `'top' | 'right' | 'bottom' | 'left' | 'top-start' | 'top-end' | 'right-start' | 'right-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end'`
* required: `false`
* default: `bottom-start`

### `disabled`

* type: `boolean`
* required: `false`
* default: `false`

## Slots

### `trigger-content`

Slot for passing custom content that will be rendered inside the trigger button in front of the caret. Content passed through this slot will take precedence over any component data, including [`triggerButton` prop](#triggerbutton) value (e.g. by default SelectDropdown will render selected item label when an item is selected but if `trigger-content` slot is provided, content passed through the slot will be rendered instead).

### `*-item-content`

Slot for passing custom item content. Use this slot when you just need to give an item some custom look (e.g. display an icon in front of label). If you need to bind a custom click handler to your item or need to make it a link, use [`*-item` slot](#-item).

To use this slot, you need to provide `item.key`. For example, let's say SelectDropdown receives this array as value provided through the [`items` prop](#items):

```ts
[
  { label: 'Item 1', value: 'item-1' },
  { label: 'Item 2', value: 'item-2', key: 'foobar' },
]
```

_Item 1_ will not have an slot for custom item content since `item.key` is not provided. _Item 2_, on the other hand, does have `item.key` property so to provide custom item content for this item we will need to do this:

```html
<template #foobar-item-content>
  Item 2 (custom content)
</template>
```

**When item that has custom content provided though this slot is selected, content provided though the slot will be displayed in the dropdown trigger button in front of the caret icon.**

### `*-item`

This slot takes precedence over [`*-item-content` slot](#-item-content) but follows a similar approach. Use this slot when you either:

* need to have full control over item element
* need to bind custom click handler to item
* need to make item a link

Let's say SelectDropdown receives this array as value provided through the [`items` prop](#items):

```ts
[
  { label: 'Item 1', value: 'item-1' },
  { label: 'Item 2', value: 'item-2', key: 'foobar' },
]
```

Let's say you want _Item 2_ to be a link. You can achieve that with something like this:

```html
<template #foobar-item>
  <a
    href="https://insomnia.rest/"
    target="_blank"
  >
    Try in Insomnia
  </a>
</template>
```

## Events

### `update:modelValue`

Fires when item is selected. Event payload is `item.value` of selected item.

### `change`

Also fires when item is selected, only the even payload is the entire selected `item` object.
