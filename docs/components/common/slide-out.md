# SlideOut

SlideOut is an overlay container with backdrop that displays content over the page area. Upon opening SlideOut component adds `spec-renderer-no-scroll` to `body` and `html` elements which makes those elements not scrollable behind the SlideOut overlay.

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

## Slots

### `default`

Slot for SlideOut content.
