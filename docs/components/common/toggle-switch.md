# ToggleSwitch

ToggleSwitch is a toggle-like looking component that works like `input[type="checkbox"]`.

## Accessibility

`id` attribute is required for better accessibility. ToggleSwitch binds passed `id` attribute to the underlying input element.

## Props

### `modelValue`

* type: `boolean`
* required: `true`

### `label`

* type: `string`
* required: `false`
* default: `''`

### `disabled`

* type: `boolean`
* required: `false`
* default: `false`

## Events

ToggleSwitch fires 3 events when toggled. Payload of all 3 events is toggle value (`boolean`).

* `update:modelValue`
* `change`
* `input`
