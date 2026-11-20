# Theming

The spec renderer can be themed with CSS custom properties ("tokens"), following the [`@kong/design-tokens`](https://github.com/Kong/design-tokens) conventions. Every token is unset by default and falls back to the value the renderer used before, so nothing changes until a theme sets a token.

Most themes only need the [base tokens](#base-tokens): eleven colors, corner radii and fonts that the whole renderer follows. The [dedicated tokens](#dedicated-tokens) are for themes that want to change one part of the renderer without touching the rest.

- [How it works](#how-it-works)
- [Base tokens](#base-tokens)
  - [Boxed sections](#boxed-sections)
- [Applying a theme](#applying-a-theme)
- [Dedicated tokens](#dedicated-tokens)
  - [Sidebar (table of contents)](#sidebar-table-of-contents)
  - [Page header](#page-header)
  - [Method badges](#method-badges)
  - [Endpoint bar](#endpoint-bar)
  - [Operation sections](#operation-sections)
  - [Selects](#selects)
  - [Schema properties](#schema-properties)
  - [Panels](#panels)
  - [Previous / next navigation](#previous--next-navigation)
- [Kongponents tokens](#kongponents-tokens)
- [What is not themeable](#what-is-not-themeable)
- [Sample themes](#sample-themes)
- [Adding a token](#adding-a-token)

## How it works

Each themeable declaration reads a dedicated token first, then a base token, then the semantic token, then a static value:

```scss
color: var(--kui-spec-renderer-toc-item-color-text, var(--kui-spec-renderer-color-text-neutral, var(--kui-color-text-neutral-strong, #52596e)));
//         ↑ dedicated: one part                       ↑ base: the whole renderer            ↑ semantic: global default       ↑ static
```

There are four kinds of tokens:

- **Base tokens** (`--kui-spec-renderer-color-text`, `--kui-spec-renderer-border-radius`, ...) theme the whole renderer. Every part that uses the same kind of color, corner or font follows them.
- **Dedicated tokens** (`--kui-spec-renderer-{part}-*`) change one part, for example only the selected sidebar item, and win over the base tokens.
- **Kongponents tokens** (`--kui-button-*`, `--kui-tooltip-*`, `--kui-badge-*`, ...) are read wherever the spec renderer re-implements a [Kongponents](https://kongponents.konghq.com) component, so a theme built for Kongponents (for example the `@kong/design-tokens` `electric-lime-*` themes) styles both the same way. Most of them fall back to the base tokens too.
- **Semantic tokens** (`--kui-color-*`, `--kui-font-family-*`, `--kui-method-color-*`, ...) are the global defaults. Override them for changes that should apply everywhere, including outside the renderer, like the HTTP method colors.

A dedicated token name reads as `--kui-spec-renderer-{part}-{property}-{variant}-{state}`, for example `--kui-spec-renderer-toc-item-color-background-selected`. The base tokens leave out the part, and otherwise mirror the semantic token names: `--kui-spec-renderer-color-text-primary` is the renderer's `--kui-color-text-primary`.

## Base tokens

Eleven tokens theme the whole renderer. Each one feeds every dedicated token for the same role, so for example `--kui-spec-renderer-color-border` colors every border and divider. While a base token is unset, each part keeps its own default.

| Token | Falls back to | Styles |
|-------|---------------|--------|
| `--kui-spec-renderer-border-radius` | each part's own default | Corners of containers: panels, boxed sections, the endpoint bar, previous / next links and select menus |
| `--kui-spec-renderer-border-radius-small` | each part's own default | Corners of controls: sidebar items, pickers, value chips, method badges and label badges |
| `--kui-spec-renderer-color-background` | each part's own default | Surfaces: panel bodies, previous / next links, select menus and the small-screen menu |
| `--kui-spec-renderer-color-background-neutral` | each part's own default | Tinted areas: the sidebar, panel headers, the Try It and overview insets, the endpoint bar, code blocks and the previous / next hover |
| `--kui-spec-renderer-color-background-primary` | each part's own default | Accent tint: the selected sidebar item, value chips, picker hover and open states, and menu item hover and selection |
| `--kui-spec-renderer-color-border` | `--kui-color-border` | Every border and divider |
| `--kui-spec-renderer-color-text` | `--kui-color-text` | Text: body text, section, panel and sidebar group titles, the endpoint path, and picker and menu text |
| `--kui-spec-renderer-color-text-neutral` | each part's own default | Secondary text: sidebar items, property types, the endpoint URL and previous / next links |
| `--kui-spec-renderer-color-text-primary` | each part's own default | Accent text: the selected sidebar item, property names, value chips, links, and picker and menu hover and selection |
| `--kui-spec-renderer-font-family-code` | `--kui-font-family-code` | Code text: property names and types, endpoint and server URLs, the Try It path, bordered pickers, code samples, code in markdown descriptions and error messages. Unlike the global `--kui-font-family-code`, it leaves the Kongponents components on the host page alone |
| `--kui-spec-renderer-font-family-heading` | inherited from the host page | Page and section titles. A global `h2`, `h3` or `h4` font rule on the host page still wins over it |

A complete light theme in eleven lines:

```css
:root {
  --kui-spec-renderer-color-text: #2e1065;
  --kui-spec-renderer-color-text-neutral: #4a4566;
  --kui-spec-renderer-color-text-primary: #7c3aed;
  --kui-spec-renderer-color-background: #ffffff;
  --kui-spec-renderer-color-background-neutral: #f8f6ff;
  --kui-spec-renderer-color-background-primary: #ede9fe;
  --kui-spec-renderer-color-border: #e4ddff;
  --kui-spec-renderer-border-radius: 12px;
  --kui-spec-renderer-border-radius-small: 6px;
  --kui-spec-renderer-font-family-code: "SF Mono", Menlo, Consolas, monospace;
  --kui-spec-renderer-font-family-heading: Optima, Candara, "Segoe UI", sans-serif;
}
```

Body text inherits the host page's font, so set the text font on the host page (for example on `body`). A theme that uses a web font loads it on the host page, with `@font-face` or a stylesheet link. The sample themes use locally installed fonts, since the sandbox does not load web fonts.

For a dark theme, set the base tokens to dark values on top of a dark semantic theme such as `@kong/design-tokens`' `classic-night`, which takes care of the rest (inputs, buttons and so on).

### Boxed sections

The operation sections (parameters, request body, responses, callbacks) are flat by default. Five dedicated tokens box them like the panels, and the nested sections inside them (body schema titles such as `Report`) follow:

```css
:root {
  --kui-spec-renderer-section-border-width: 1px;
  --kui-spec-renderer-section-color-background: #ffffff;
  --kui-spec-renderer-section-header-color-background: #f5f1ff;
  --kui-spec-renderer-section-padding-x: 16px;
  --kui-spec-renderer-section-gap: 16px;
}
```

The box's border color and corners come from `--kui-spec-renderer-color-border` and `--kui-spec-renderer-border-radius`. To box only the nested sections, set the [nested section tokens](#operation-sections) instead.

## Applying a theme

Set the tokens on `:root`, the base tokens first and then any dedicated tokens on top:

```css
:root {
  --kui-spec-renderer-color-text-primary: #0f766e;
  --kui-spec-renderer-border-radius: 12px;
  /* a dark sidebar on an otherwise light theme */
  --kui-spec-renderer-toc-color-background: #0f172a;
  --kui-spec-renderer-toc-item-color-text: #cbd5e1;
  --kui-spec-renderer-toc-item-color-text-selected: #ffffff;
}
```

- **Scope**: custom properties inherit, so any ancestor of the renderer works too. Prefer `:root` (or `body`) though: the table of contents slideout on small screens is teleported to `<body>`, outside the renderer's own element.
- **Web components**: custom properties inherit into the shadow root, so the same CSS themes `<kong-spec-renderer>` and the other custom elements.
- **Dark mode**: tokens are plain values, so give dark mode its own values under whatever selector your app uses for it, for example `[data-portal-color-mode="dark"] { ... }` or `@media (prefers-color-scheme: dark) { :root { ... } }`.
- **Layers**: the `@kong/design-tokens` themes declare their values in the `kui.theme` cascade layer, so your unlayered `:root` overrides always win over them.

## Dedicated tokens

Each dedicated token changes one part of the renderer and wins over the base tokens. The **Falls back to** column lists the base token first, when there is one, then the semantic token.

### Sidebar (table of contents)

| Token | Falls back to | Styles |
|-------|---------------|--------|
| `--kui-spec-renderer-toc-color-background` | `--kui-spec-renderer-color-background-neutral`, then `--kui-color-background` in `SpecRenderer`, transparent in a standalone `SpecRendererToc` | Background of the table of contents, its "Powered by" footer, and its list in the small-screen slideout |
| `--kui-spec-renderer-toc-color-border-divider` | `--kui-spec-renderer-color-border`, then `--kui-color-border` | Dividers between top-level groups and above the "Powered by" footer |
| `--kui-spec-renderer-toc-group-title-color-text` | `--kui-spec-renderer-color-text`, then `--kui-color-text` (`--kui-color-text-neutral-stronger` for labels) | Top-level group titles (`ENDPOINTS`, `SCHEMAS`) and label items |
| `--kui-spec-renderer-toc-group-title-font-size` | `--kui-font-size-20` | Top-level group titles and label items |
| `--kui-spec-renderer-toc-group-title-font-weight` | `--kui-font-weight-semibold` | Top-level group titles and label items |
| `--kui-spec-renderer-toc-item-border-radius` | `--kui-spec-renderer-border-radius-small`, then `--kui-border-radius-20` | Item corners, visible once an item has a hover or selected background |
| `--kui-spec-renderer-toc-item-color-background-hover` | transparent | Item background on hover |
| `--kui-spec-renderer-toc-item-color-background-selected` | `--kui-spec-renderer-color-background-primary`, then transparent | Background of the item for the current page |
| `--kui-spec-renderer-toc-item-color-text` | `--kui-spec-renderer-color-text-neutral`, then `--kui-color-text-neutral-strong` | Item text and the group chevrons |
| `--kui-spec-renderer-toc-item-color-text-hover` | `--kui-spec-renderer-color-text`, then `--kui-color-text-neutral-stronger` | Item text on hover |
| `--kui-spec-renderer-toc-item-color-text-selected` | `--kui-spec-renderer-color-text-primary`, then `--kui-color-text-primary` | Text of the item for the current page |
| `--kui-spec-renderer-toc-item-font-size` | `--kui-font-size-30` | Item text |
| `--kui-spec-renderer-toc-item-font-weight` | `--kui-font-weight-regular` | Item text |
| `--kui-spec-renderer-toc-item-font-weight-selected` | `--kui-spec-renderer-toc-item-font-weight` | Text of the item for the current page |
| `--kui-spec-renderer-toc-item-line-height` | `--kui-line-height-30` | Item text |
| `--kui-spec-renderer-toc-item-padding` | `--kui-space-30` | Item padding, which sets the density of the list |

The method badge next to the selected item is inverted (method text color as background), so it stays readable on a selected background.

### Page header

The title of the overview, operation and schema pages, and of `SchemaRenderer`.

| Token | Falls back to | Styles |
|-------|---------------|--------|
| `--kui-spec-renderer-page-header-title-font-family` | `--kui-spec-renderer-font-family-heading`, then inherited | Page title row: the title and its badges. A global `h2` font rule on the host page still wins over it |
| `--kui-spec-renderer-page-header-title-font-size` | `--kui-font-size-80` | Page title |
| `--kui-spec-renderer-page-header-title-font-weight` | `--kui-font-weight-bold` | Page title |
| `--kui-spec-renderer-page-header-title-line-height` | `--kui-line-height-70` | Page title |

### Method badges

Badge colors come from the semantic `--kui-method-color-background-{method}` and `--kui-method-color-text-{method}` tokens (`get`, `post`, `put`, `delete`, `patch`, `options`, `head`, `connect`, `trace`), which also color the Try It button.

| Token | Falls back to | Styles |
|-------|---------------|--------|
| `--kui-spec-renderer-method-badge-border-radius` | `--kui-spec-renderer-border-radius-small`, then `--kui-border-radius-round` | Method badge corners, in the sidebar, endpoint bar and Try It header |
| `--kui-spec-renderer-method-badge-font-weight` | `--kui-font-weight-semibold` | Method badge text |

### Endpoint bar

The method, server URL and path at the top of an operation. Its border and corners follow the [panel](#panels) tokens.

| Token | Falls back to | Styles |
|-------|---------------|--------|
| `--kui-spec-renderer-endpoint-color-background` | `--kui-spec-renderer-color-background-neutral`, then transparent | Endpoint bar background |
| `--kui-spec-renderer-endpoint-color-text` | `--kui-spec-renderer-color-text-neutral`, then `--kui-color-text-neutral-strong` | Server URL, including the server picker |
| `--kui-spec-renderer-endpoint-path-color-text` | `--kui-spec-renderer-color-text`, then `--kui-color-text` | Operation path |

### Operation sections

The collapsible sections of an operation: path, query and header parameters, request body, responses and callbacks.

Sections are flat by default: a title, a divider and the content. The [boxed sections](#boxed-sections) recipe boxes them like the panels.

A section nested in another one, the collapsible title of a body schema (for example `Report` inside a request body), has its own subsection tokens, listed below the main table. They fall back to the section tokens, so the nested sections follow the sections unless a subsection token is set.

| Token | Falls back to | Styles |
|-------|---------------|--------|
| `--kui-spec-renderer-section-border-radius` | `--kui-spec-renderer-border-radius`, then `--kui-border-radius-0` | Corners of a boxed section and of its header |
| `--kui-spec-renderer-section-border-width` | `--kui-border-width-0` | Border around a section. Anything above 0 boxes the sections |
| `--kui-spec-renderer-section-color-background` | transparent | Section background |
| `--kui-spec-renderer-section-color-border` | `--kui-spec-renderer-color-border`, then `--kui-color-border` | Border of a boxed section and the divider under a section title |
| `--kui-spec-renderer-section-gap` | `--kui-space-0` | Space below each section |
| `--kui-spec-renderer-section-header-color-background` | transparent | Background of the title area |
| `--kui-spec-renderer-section-padding-x` | `--kui-space-0` | Horizontal padding of the title area and the content |
| `--kui-spec-renderer-section-title-color-text` | `--kui-spec-renderer-color-text`, then `--kui-color-text` (`--kui-color-text-neutral-strong` for the chevron) | Section titles, including the titles of nested body schemas, and their collapse chevron |
| `--kui-spec-renderer-section-title-font-family` | `--kui-spec-renderer-font-family-heading`, then inherited | Section title row, including the titles of nested body schemas. A global `h3` or `h4` font rule on the host page still wins over it |
| `--kui-spec-renderer-section-title-font-size` | `--kui-font-size-40` | Section title |
| `--kui-spec-renderer-section-title-font-weight` | `--kui-font-weight-semibold` | Section title |
| `--kui-spec-renderer-section-title-line-height` | `--kui-line-height-40` | Section title |

Nested sections (body schema titles). To box only these, for example on flat sections, set the subsection tokens rather than the section ones:

```css
:root {
  --kui-spec-renderer-subsection-border-width: 1px;
  --kui-spec-renderer-subsection-header-color-background: #f9fafb;
  --kui-spec-renderer-subsection-header-padding: 8px 12px;
  --kui-spec-renderer-subsection-content-padding: 0px 12px;
}
```

| Token | Falls back to | Styles |
|-------|---------------|--------|
| `--kui-spec-renderer-subsection-border-radius` | `--kui-spec-renderer-section-border-radius`, then `--kui-spec-renderer-border-radius`, then `--kui-border-radius-0` | Corners of the nested section box, and of its header (top corners, or all four when collapsed) |
| `--kui-spec-renderer-subsection-border-width` | `--kui-spec-renderer-section-border-width`, then `--kui-border-width-0` | Border around the nested section, in the section border color. Anything above 0 boxes it |
| `--kui-spec-renderer-subsection-color-background` | `--kui-spec-renderer-section-color-background`, then transparent | Nested section background, behind its fields |
| `--kui-spec-renderer-subsection-content-padding` | `0` and `--kui-spec-renderer-section-padding-x` (top and bottom, sides) | Padding around the nested section's fields, as a `padding` shorthand like `0px 12px` |
| `--kui-spec-renderer-subsection-header-color-background` | `--kui-spec-renderer-section-header-color-background`, then transparent | Background of the nested section's title bar |
| `--kui-spec-renderer-subsection-header-padding` | `--kui-space-40`, `--kui-spec-renderer-section-padding-x` and `--kui-space-20` (top, sides, bottom) | Padding of the title bar, as a `padding` shorthand like `8px 12px` |

The nested section's border follows `--kui-spec-renderer-section-color-border`, and its title follows `--kui-spec-renderer-section-title-color-text` and `--kui-spec-renderer-section-title-font-family`.

The response status and media type next to a section title are [selects](#selects).

### Selects

The buttons that open a select menu. Most are compact bordered pickers: the response status and media type in section headers (and the plain label shown when there is only one option), the example pickers in sample panel headers, the schema variant pickers in property titles, the security scheme, request sample, response view and callback pickers, and the AsyncAPI protocol picker. The borderless ones are the request sample language picker and the server variable pickers. The menus they open follow the [KDropdown and KPop](#kongponents-tokens) tokens.

| Token | Falls back to | Styles |
|-------|---------------|--------|
| `--kui-spec-renderer-select-border-radius` | `--kui-spec-renderer-border-radius-small`, then `--kui-border-radius-20` | Picker corners |
| `--kui-spec-renderer-select-color-background-active` | `--kui-spec-renderer-color-background-primary`, then `--kui-color-background-primary-weaker` | Picker background while its menu is open |
| `--kui-spec-renderer-select-color-background-hover` | `--kui-spec-renderer-color-background-primary`, then `--kui-color-background-primary-weakest` | Picker background on hover |
| `--kui-spec-renderer-select-color-border` | `--kui-spec-renderer-color-border`, then `--kui-color-border` | Border of the bordered pickers |
| `--kui-spec-renderer-select-color-text` | `--kui-spec-renderer-color-text`, then `--kui-color-text` (`--kui-color-text-neutral-strong` for schema variant pickers, `--kui-color-text-neutral` for server variable pickers) | Picker text. Schema variant pickers keep it while their menu is open |
| `--kui-spec-renderer-select-color-text-hover` | `--kui-spec-renderer-color-text-primary`, then `--kui-color-text-primary-stronger` | Picker text on hover and while its menu is open |

The defaults for the hover and open states come from the semantic primary colors, which some dark semantic themes map to light blues, so a dark theme should set all four color tokens, along with the [KDropdown and KPop](#kongponents-tokens) tokens for the menu.

### Schema properties

The property rows of request and response bodies, parameters and schema pages.

| Token | Falls back to | Styles |
|-------|---------------|--------|
| `--kui-spec-renderer-schema-property-color-border` | `--kui-spec-renderer-color-border`, then `--kui-color-border` | Dividers between properties and the tree lines of nested properties |
| `--kui-spec-renderer-schema-property-description-color-text` | `--kui-color-text-neutral-stronger` | Property descriptions and request body descriptions |
| `--kui-spec-renderer-schema-property-name-color-text` | `--kui-spec-renderer-color-text-primary`, then `--kui-color-text-primary` | Property name |
| `--kui-spec-renderer-schema-property-readonly-color-text` | `--kui-color-text-primary-weak` | The `read-only` label |
| `--kui-spec-renderer-schema-property-required-color-text` | `--kui-color-text-danger` | The `required` label |
| `--kui-spec-renderer-schema-property-type-color-text` | `--kui-spec-renderer-color-text-neutral`, then `--kui-color-text-neutral-strong` | Type, format and the other details next to the name |
| `--kui-spec-renderer-schema-property-value-border-radius` | `--kui-spec-renderer-border-radius-small`, then `--kui-border-radius-20` | Value chips: default, example, allowed values, pattern and range |
| `--kui-spec-renderer-schema-property-value-color-background` | `--kui-spec-renderer-color-background-primary`, then `--kui-color-background` | Value chips |
| `--kui-spec-renderer-schema-property-value-color-text` | `--kui-spec-renderer-color-text-primary`, then `--kui-color-text-neutral` | Value chips |
| `--kui-spec-renderer-schema-property-value-shadow-border` | `--kui-shadow-border` | Value chip border, as a box shadow like `0px 0px 0px 1px #e0e4ea inset` |

### Panels

The bordered cards of the renderer, shared so that they stay consistent: the Try It panel and its Authentication, Parameters, Body and Response panels, the request sample, response and schema examples, callback samples, the overview's API Base URL, Security and Additional Information panels, and the endpoint bar's border.

| Token | Falls back to | Styles |
|-------|---------------|--------|
| `--kui-spec-renderer-panel-border-radius` | `--kui-spec-renderer-border-radius`, then `--kui-border-radius-30` | Panel corners |
| `--kui-spec-renderer-panel-color-background` | `--kui-spec-renderer-color-background`, then `--kui-color-background` | Panel content surfaces: collapsible panel bodies, overview collapsible panels and server URL items |
| `--kui-spec-renderer-panel-color-background-inset` | `--kui-spec-renderer-color-background-neutral`, then `--kui-color-background-neutral-weakest` | Recessed areas that hold other panels or items: the Try It body, the overview panel content, and the callback and AsyncAPI detail boxes |
| `--kui-spec-renderer-panel-color-border` | `--kui-spec-renderer-color-border`, then `--kui-color-border` | Panel borders and the line under a panel header |
| `--kui-spec-renderer-panel-header-color-background` | `--kui-spec-renderer-color-background-neutral`, then `--kui-color-background` | Panel headers |
| `--kui-spec-renderer-panel-header-color-text` | `--kui-spec-renderer-color-text`, then `--kui-color-text` | Panel header titles and the Try It path |

Panel headers also hold controls (selects, copy buttons, chevrons) that keep their own colors, so the header tokens suit tints of the surrounding theme rather than a strongly contrasting header.

### Previous / next navigation

The links to the previous and next page at the bottom of a page.

| Token | Falls back to | Styles |
|-------|---------------|--------|
| `--kui-spec-renderer-document-navigation-border-radius` | `--kui-spec-renderer-border-radius`, then `--kui-border-radius-30` | Link corners |
| `--kui-spec-renderer-document-navigation-color-background` | `--kui-spec-renderer-color-background`, then `--kui-color-background` | Link background |
| `--kui-spec-renderer-document-navigation-color-background-hover` | `--kui-spec-renderer-color-background-neutral`, then `--kui-color-background-neutral-weakest` | Link background on hover |
| `--kui-spec-renderer-document-navigation-color-border` | `--kui-spec-renderer-color-border`, then `--kui-color-border` | Link border |
| `--kui-spec-renderer-document-navigation-color-text` | `--kui-spec-renderer-color-text-neutral`, then `--kui-color-text-neutral-strong` | Link text |
| `--kui-spec-renderer-document-navigation-color-text-hover` | `--kui-spec-renderer-color-text-primary`, then `--kui-color-text-neutral-strongest` | Link text on hover |

## Kongponents tokens

These spec renderer elements re-implement a Kongponents component and read its tokens. See the [`@kong/design-tokens` token list](https://github.com/Kong/design-tokens/blob/main/TOKENS.md) for what each token means.

Where one of these tokens plays the same role as a base token, it falls back to that base token, so the base tokens theme these elements too: `--kui-link-color-text` and `--kui-dropdown-item-color-text-selected` fall back to `--kui-spec-renderer-color-text-primary`, `--kui-dropdown-item-color-text` to `--kui-spec-renderer-color-text`, the dropdown item hover, active and selected backgrounds to `--kui-spec-renderer-color-background-primary`, `--kui-pop-color-background` and `--kui-slideout-color-background` to `--kui-spec-renderer-color-background`, `--kui-code-block-color-background` to `--kui-spec-renderer-color-background-neutral`, `--kui-dropdown-color-border` and `--kui-slideout-color-border` to `--kui-spec-renderer-color-border`, `--kui-dropdown-border-radius` to `--kui-spec-renderer-border-radius`, and `--kui-badge-border-radius` to `--kui-spec-renderer-border-radius-small`. Setting the Kongponents token still wins.

| Kongponents component | Tokens | Spec renderer elements |
|-----------------------|--------|------------------------|
| KBadge | `--kui-badge-border-radius`, `-font-size`, `-font-weight`, `-line-height`, `-padding-small`, `-padding-x`, `-padding-y`, `-color-background-{neutral,info,success,warning}`, `-color-text-{neutral,info,success,warning}` | Label badges: data type, `DEPRECATED`, `WEBHOOK` and the OAuth status badge. The `primary` badge type reads the `info` tokens. Schema variant labels (`One Of`, `Any Of`, `All Of`) read the `neutral` colors and the border radius |
| KButton | `--kui-button-*` for the `secondary` and `tertiary` appearances in the `medium` size | The Try It button and its dropdown, the Try It file pickers and "Clear credentials" button, the custom server URL buttons and the "API documentation editor" button |
| KCodeBlock | `--kui-code-block-color-background`, `--kui-code-block-line-number-color-text` | Highlighted request and response samples, the editable request body and code blocks in markdown descriptions |
| KDropdown and KPop | `--kui-dropdown-border-radius`, `--kui-dropdown-color-border`, `--kui-dropdown-item-*`, `--kui-pop-color-background`, `--kui-pop-shadow` | Select and dropdown menus. KDropdown is built on KPop, so the menu background and shadow come from the popover tokens |
| KExternalLink | `--kui-link-color-text`, `--kui-link-color-text-hover`, `--kui-link-text-decoration`, `--kui-link-text-decoration-hover` | Links in markdown descriptions and in the overview's Additional Information |
| KInput | `--kui-input-*` | Try It text inputs and the custom server URL input |
| KInputSwitch | `--kui-input-switch-*` | Toggle switches |
| KLabel | `--kui-label-color-text`, `-font-size`, `-font-weight`, `-line-height` | Try It field labels |
| KSlideout | `--kui-slideout-color-background`, `-color-border`, `-border-width`, `-shadow`, `-title-font-family`, `-title-font-size`, `-title-font-weight`, `-title-line-height`, `-close-border-radius`, `-close-color-text-hover` | The table of contents slideout on small screens |
| KTooltip | `--kui-tooltip-color-background`, `-color-text`, `-border-radius`, `-font-size`, `-font-weight`, `-line-height`, `-padding` | Info tooltips |

## What is not themeable

- **Layout sizes**: the design token conventions have no width tokens (the `use-proper-token` lint rule only allows icon size and breakpoint tokens for widths), so the 320px sidebar width and the column widths are fixed.
- **Page title color**: the page title inherits its color from the host page, so it already follows the host's heading styles. Its size and weight are themeable.
- **Syntax highlighting**: code colors come from the Shiki `catppuccin-latte` (light) and `catppuccin-mocha` (dark mode) themes. Only the code block background is themeable, so pick a background that suits those palettes.
- **Body text font**: the renderer does not set a text font, so the host page's font applies. Set it on the host page.
- **Anything else** uses the semantic tokens directly, for example `--kui-color-text-primary` for the brand color.

## Sample themes

[`sandbox/themes`](../sandbox/themes) has ten sample themes to start from. Each one has two rules: the eleven base tokens, then a fine-tuning rule with the boxed sections recipe (if it boxes its sections) and only the dedicated and Kongponents tokens that give it its character. The descriptions below are of the fine-tuned themes:

- `aurora.css`: soft, rounded and violet, with a tinted sidebar, pill-shaped selection and boxed sections.
- `blueprint.css`: square corners, monochrome and high contrast, with an inverted selected item and boxed sections.
- `contrast.css`: an accessibility-minded theme with larger text, black borders, underlined links and a yellow highlight for the current page.
- `ember.css`: warm and light, with a terracotta accent and boxed sections.
- `harbor.css`: airy and light, with larger type, flat sections, and pill-shaped navigation, pickers and value chips.
- `midnight.css`: a dark navy sidebar next to light content, with a teal accent and flat sections.
- `nebula.css`: purple and pink with boxed sections, for dark mode on top of `@kong/design-tokens`' `classic-night`.
- `sage.css`: calm muted greens, with soft rounded corners and boxed sections.
- `slate.css`: a neutral dark theme with a blue accent and flat sections, also for dark mode on top of `classic-night`.
- `terminal.css`: green on black with boxed sections, also for dark mode on top of `classic-night`.

Run `pnpm run dev` and use the **Theme** picker in the sandbox to try them. A theme starts with its base tokens only, which shows how far those eleven tokens go on their own. Check **Fine-tuned tokens** next to the picker to add its fine-tuning rule. The sandbox applies a theme by setting `data-spec-renderer-theme` on `<html>`, and the fine-tuning by also setting `data-spec-renderer-fine-tune`.

## Adding a token

- Name it `--kui-spec-renderer-{part}-{property}-{variant}-{state}` with the design token property names (`color-background`, `color-text`, `color-border`, `border-radius`, `border-width`, `font-size`, `font-weight`, `line-height`, `padding`, `padding-x`, `gap`, `shadow-border`). The `@kong/stylelint-plugin-design-tokens/use-proper-token` lint rule checks that the property name matches the CSS property. It does not know `-gap` names on margins yet, so `--kui-spec-renderer-section-gap` disables it for that one line.
- Read the Kongponents token instead when the element re-implements a Kongponents component.
- Fall back to the semantic token the declaration used before, so the default rendering stays the same: `var(--kui-spec-renderer-..., var(--kui-color-..., $kui-color-...))`.
- When the part plays the same role as a base token (a border, a tint, accent text, a container or control corner, and so on), put the base token between the two: `var(--kui-spec-renderer-..., var(--kui-spec-renderer-color-border, var(--kui-color-border, $kui-color-border)))`. Leave it out for anything that would look wrong whenever the base token is set, like the background of the flat sections.
- Add a base token only for a role that many parts share. The base tier is meant to stay small.
- Reuse a token wherever the same part appears, rather than adding one per component, and only add tokens for things a theme would plausibly change.
- Document it on this page. `src/styles/theming-tokens.spec.ts` fails when a `--kui-spec-renderer-*` token is used in `src` but missing here, or documented here but no longer used.
