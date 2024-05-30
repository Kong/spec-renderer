# SpecRendererToc

<!-- This is a temporary place for things worthy to be documented about SpecRendererToc component. -->

## Props

<!-- TODO -->

## Events

<!-- TODO -->

## Attributes

* `data-active-node` attribute is used for logic determining active item within the TOC.

## Exposes

* `getActiveItemScrollPosition`
  * type: `Function`
  * param: `scrollableAncestor?: HTMLElement`
  * returns: `number`

On passive item selection (page load) sometimes we want TOC component to scroll the active item into the view within it's scrollable parent (so that main page scroll bar remains unaffected but scrollable aside element scrolls to display the active item). To achieve that, SpecRendererToc component exposes `getActiveItemScrollPosition` method that returns active item scroll position within the scrollable parent.

When SpecRenderer component is used, the scrollable element is the SpecRendererToc itself - so SpecRenderer gets active scroll position within the SpecRendererToc component and triggers scroll. However, when used separately, we might want to handle that in host app.

The function takes one parameter (`scrollableAncestor?: HTMLElement`). If not provided, defaults to the root element of the SpecRendererToc component.

The function will return `0` if `scrollableAncestor` is of falsy value, if active item element is not found or the function fails to calculate active item scroll position (for example, if no positioned ancestor element was found).
