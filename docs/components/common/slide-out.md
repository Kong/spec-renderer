# SlideOut

SlideOut is an overlay container with backdrop that displays content over the page area. Upon opening SlideOut component adds `spec-renderer-no-scroll` to element that scrolls the document, which makes those elements not scrollable behind the SlideOut overlay.

## Props

### `visible`

* type: `boolean`
* required: `false`
* default: `false`

### `title`

* type: `string`
* required: `false`
* default: `''`

### `maxWidth`

* type: `string`
* required: `false`
* default: `500px`

Max width of SlideOut container.

### `teleportTarget`

Selector for teleport target to render slide out in. When no value is provided, the slide out is rendered as a direct child of `body` element.

* type: `string`
* required: `false`
* default: `body`

## Slots

### `default`

Slot for SlideOut content.
