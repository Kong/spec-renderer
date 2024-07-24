# HeadlessPopover

HeadlessPopover component is unstyled component wrapper that provides popover functionality. You can pass your trigger element and popover content through slots and configure the desired behavior using component props and it will take care of rendering the popover and managing it's state.

## Accessibility

For better accessibility you must pass `id` attribute to the HeadlessPopover component and programmatically associate it to the element it describes using `aria-describedby` attribute. For that reason, HeadlessPopover binds `id` and couple other attributes directly to the popover element instead of the outer-most element (unlike the rest of attributes like `class` or `data-testid`, that are bound to the outer-most `div` element).

Full list of attributes which HeadlessPopover binds to the popover element instead of the outer-most element:

* `id`
* `aria-activedescendant`
* `aria-labelledby`

## Props

### `placement`

* type: `'top' | 'right' | 'bottom' | 'left' | 'top-start' | 'top-end' | 'right-start' | 'right-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end'`
* required: `false`
* default: `bottom-start`

### `popoverOffset`

* type: `number`
* required: `false`
* default: `6`

Number of pixels to offset popover from the trigger.

### `role`

* type: `string`
* required: `false`
* default: `listbox`

Popover element `role` attribute value.

### `openOnMouseover`

* type: `boolean`
* required: `false`
* default: `false`

Whether popover should open on trigger hover (default behavior is open on click).

### `closeOnPopoverClick`

* type: `boolean`
* required: `false`
* default: `false`

Whether popover should close on click withing popover element.

### `disabled`

* type: `boolean`
* required: `false`
* default: `false`

### `maxWidth`

* type: `string`
* required: `false`
* default: `auto`

`max-width` property of popover content.

### `maxHeight`

* type: `string`
* required: `false`
* default: `auto`

`max-height` property of popover content.

### `popoverClasses`

* type: `string`
* required: `false`
* default: `''`

Classes to be passed down to popover element.

## Slots

### `default`

Slot for passing popover trigger element. **HeadlessPopover expects only one element to be passed through this slot.**

### `content`

Popover content.

## Events

### `open`

Fired on popover open.

### `close`

Fired on popover close.
