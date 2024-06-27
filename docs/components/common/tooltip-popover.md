# TooltipPopover

TooltipPopover is a component for displaying tooltips. It comes with a default info icon trigger but you can pass in your custom trigger through the slot. Tooltip text could either be passed in through a prop or slotted in.

## Props

### `text`

* type: `string`
* required: `false`
* default: `''`

Tooltip text.

### `placement`

* type: `'top' | 'right' | 'bottom' | 'left' | 'top-start' | 'top-end' | 'right-start' | 'right-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end'`
* required: `false`
* default: `bottom-start`

## Slots

### `default`

Slot for passing tooltip trigger element.

### `content`

Tooltip content.
