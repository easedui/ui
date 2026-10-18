---
name: eased
description: Design rules and component patterns for building interfaces with Eased (eased.dev), the motion-first React component library for shadcn. Use when building or changing any UI in a project that has components/eased/ or the Eased tokens, when installing Eased components, or when the user asks for layout, spacing, corner radii, shadows, colour, type, focus states or animation to look and feel polished.
---

# Eased

Eased components ship with their motion, spacing and corners already tuned. This skill holds the rules they were built with, so the screens you compose around them meet the same standard. Each rule has a number you can check.

Read this before you write UI code. For a specific component, read its docs first (the `get_component` MCP tool, or `https://eased.dev/components/<slug>.md`).

## Using Eased components

### Install

Components install with the shadcn CLI. The source lands in your project, so you own it.

```bash
npx shadcn add https://eased.dev/r/button.json https://eased.dev/r/tooltip.json
```

- Requirements: React 19, Tailwind CSS v4 and a `components.json`. If there's no `components.json`, run `npx shadcn init` first.
- Files land in `components/eased/<name>/<name>.tsx`. Import from there: `import { Button } from "@/components/eased/button/button"`.
- Every component brings `eased-tokens` (merged into your global CSS) and `eased-motion` (`components/eased/lib/`) with it. There's no CSS file to import.
- Install `<name>-demo` too when you want a realistic usage example to copy patterns from.
- Install with the CLI; don't copy source by hand. The CLI brings the shared stylesheet and helpers.
- Pro components install from the `@eased-pro` registry with a Pro token: see https://eased.dev/docs/installation#pro-components.
- With the Eased MCP server (`https://eased.dev/api/mcp`), use `search_components`, then `get_component`, then `get_install_command`.

### Tokens

Style with semantic tokens only. Never use a raw colour, a literal radius or an arbitrary pixel value in component code.

| Role | Classes |
|---|---|
| Canvas, surface, well, raised | `bg-bg`, `bg-surface`, `bg-surface-sunken`, `bg-surface-raised` |
| Hover and pressed fills | `bg-surface-hover`, `bg-surface-active` |
| Borders: divider, interactive, input | `border-line-subtle`, `border-line`, `border-line-strong` |
| Text: primary, secondary, muted, disabled | `text-text`, `text-text-secondary`, `text-text-muted`, `text-text-disabled` |
| Brand fill and its text | `bg-brand` + `text-text-on-brand` (`bg-brand-hover`, `bg-brand-active`) |
| Brand tint, text, line | `bg-brand-subtle`, `text-brand-text`, `border-brand-line` |
| States | `bg-{success,warning,danger,info}`, `bg-*-subtle`, `text-*-text`, `text-text-on-*` |
| Radius | `rounded-control-2xs` 4 · `rounded-control-xs` 6 · `rounded-control-sm` 8 · `rounded-control` 10 · `rounded-panel` 16 · `rounded-surface` 24 · `rounded-pill` |
| Shadows | `shadow-resting`, `shadow-raised`, `shadow-floating`, `shadow-overlay`, `shadow-thumb`, `inset-shadow-well`, `inset-shadow-highlight` |
| Control heights | `h-control-xs` 24 · `h-control-sm` 32 · `h-control-md` 36 · `h-control-lg` 40 · `h-control-xl` 48 (also `size-control-*`) |
| UI type (line height and tracking included) | `text-ui-2xs` 11 · `text-ui-xs` 12 · `text-ui-sm` 13 · `text-ui` 14 · `text-ui-md` 16 · `text-ui-lg` 18 |
| Easing | `ease-enter`, `ease-standard`, `ease-exit`, `ease-spring-snappy`, `ease-spring-smooth`, `ease-spring-bouncy` |

Utilities and variants:

- `radius-nested`: a concentric inner radius, read from `--radius-outer` and `--pad` on the parent.
- `focus-ring`: Eased's keyboard focus ring.
- `hit-area`: grows a small target's tap area to 44×44px without changing how it looks.
- `image-ring`: a 1px alpha ring for photos, avatars and logos.
- `fade-x`: scroll-edge fades.
- `squircle`: superellipse corners, for radii of 16px or more.
- `hover-fine:` and `group-hover-fine:`: hover styles on mouse and trackpad only.
- `reduced:`: styles under `prefers-reduced-motion`.

Raw variables are prefixed `--eased-`. Light follows `:root`, and dark follows `.dark` or `data-theme="dark"` on an ancestor. Re-brand by restating `--eased-brand-1` to `--eased-brand-12`.

Motion presets live in `components/eased/lib/motion.ts`:

- `snappy`, `smooth` and `bouncy` springs
- `ease`, `duration`, `stagger` and `blur`
- `enter`, `fade`, `exit` and `reducedFade` transitions
- the `useSafeReducedMotion()` hook

Press classes live in `components/eased/lib/press.ts`: `press`, `pressIcon` and `pressWide`.

### Composition patterns

- **One implementation per role.** Use the installed Eased Button, Avatar, Spinner, Kbd or Segmented. Don't build a second one beside it.
- **Button variants:**
  - `primary`: the one filled action in a region.
  - `secondary`: the default.
  - `ghost`: toolbars and quiet actions.
  - `danger`: outlined.
  - `danger-solid`: only in the final confirm step.
  - Sizes: `sm`, `md` and `lg`, plus `icon-sm`, `icon` and `icon-lg` for icon-only buttons.
- **Concentric nesting.** Wrap nested layers in `Frame` and `FrameInner` from `concentric-frame`, or set `--radius-outer` and `--pad` on the parent and give the child `radius-nested`.
- **Nesting levels:**
  - Page frames: `rounded-surface`, with `p-5` or `p-6`, and `border border-line-subtle`.
  - Cards inside a frame: `rounded-panel` with `p-4`.
  - Controls inside a card: `rounded-control` or `rounded-control-sm`.
- **Repeating rows.** For people, files and settings, put a grid on the parent: `grid grid-cols-[auto_minmax(0,1fr)_auto]`, or `rowGrid` and `rowGridRow` from `components/eased/lib/layout.ts` (the `eased-layout` item). Trailing controls then share a column.
- **Don't wrap Eased components in extra animation.** Their motion is tuned already, and a second transition fights it.
- **Popover and menu triggers** press by colour and never scale. Eased Button does this when `aria-haspopup` is set.
- **Destructive actions** use Undo Pill (a 5-second undo) or a confirm step. They never act immediately.
- **Missing a component?** Build it from Base UI primitives and Eased tokens, following these rules. Keep it outside `components/eased/`, so updates don't overwrite it.

## Alignment and grouping

1. **One edge, one x.** Everything stacked in a column shares one leading edge, including labels, values, buttons, icons and footers. Draw a vertical line down each column's left edge and down the content's right edge. Nothing may cross either line.
2. **Align variable-width text by its leading edge.** Give role or status labels ("Owner", "Can edit") a fixed-width column or a grid track, or make them same-width controls such as Select or Badge. Ragged right-aligned text is allowed only for numbers, with `tabular-nums`.
3. **Use a grid where rows repeat.** Use shared tracks or `subgrid`, never a per-row `justify-between`.
4. **Optical icon alignment.** When an icon leads a label, the icon's visible edge sits on the content line. Pull a ghost button left by its own padding (`-ml-2` on `px-2`).
5. **Footers share the body's inset.** A footer's first item and last button sit on the same left and right lines as the body content.
6. **Same thing, same place.** A control repeated in every row keeps one width and position. Hover-revealed actions use `invisible`, not `hidden`, so nothing jumps.
7. **Vertical anchors.** Avatars, icons and checkboxes centre on the first line of text, unless every row has the same line count. When text sizes differ side by side, use `items-baseline`.
8. **Balance the panel.** Left and right insets are equal. Top and bottom insets are equal, or the top is slightly larger. The first and last list items add no space beyond the padding.

## Spacing

1. **Use the 4px scale only.** No arbitrary pixel values.
2. **Keep a 1:2 ratio.** The gap between groups is at least twice the gap inside a group:
   - label to field: 4–8px (`gap-1.5` or `gap-2`)
   - field to field: 16–24px (`gap-4`)
   - section to section: 32–48px (`gap-8`)
   - Never use equal gaps between unrelated items.
3. **Gap, padding and edge.** Inside a group, the item gap `a` is at most the group's padding `p`. Unboxed groups sit at least `2a` and at least `p` apart. Boxed groups may sit `a` apart.
4. **Control heights.** Elements in one row share one height. Use a page's primary action at `h-control-lg` with `text-ui`, and buttons in cards and dense UI at `h-control-sm` with `text-ui-sm`.
5. **Horizontal padding.** A control's side padding is 0.4–0.5 × its height, so a 36px control gets 14–16px. Icon-only controls are square.
6. **Icon size follows text.** 12px text takes a 14px icon. 13–14px text takes 16px. 16px text takes 18–20px. Icons are `shrink-0` and sit in an `inline-flex items-center` row.
7. **Icon-to-label gap** is 6–8px (`gap-1.5` or `gap-2`). Use one stroke width per surface: 1.5px beside 400–500 weight text, 2px beside 600.
8. **Hit areas.** The minimum tap area is 44×44px (`hit-area`). The minimum visual target is 24×24px.
9. **One density per block.** Dense blocks use 13–14px text, 36px rows and 12–16px padding. Comfortable blocks use 16px text, 44–48px rows and 24–32px padding. Never mix the two in one block.

## Corners

1. **Concentric radii.** Inner radius = outer radius − padding − border width, never below 0: `max(0px, calc(var(--radius-outer) - var(--pad) - 1px))`. Use `radius-nested`.
2. **Below 2px, change approach.** If the computed inner radius is under 2px, raise the outer radius, or clip the child (`overflow: clip`) instead of rounding it.
3. **Radius by role:**
   - 36–40px controls: `rounded-control`.
   - 28–32px controls: `rounded-control-sm`.
   - Chips of 24px or less: `rounded-control-xs` or `rounded-pill`.
   - Cards, popovers, menus and toasts: `rounded-panel`.
   - Dialogs, sheets and full-bleed media: `rounded-surface`.
4. **Pills.** Use `rounded-pill` for chips, switches and avatars. Never pill a card.
5. **Thumbs.** Thumb height = track height − 2 × track padding. Thumb radius = track radius − track padding.
6. **Floating objects aren't nested.** When the inset on every side is at least 1.25 × the parent's radius, the child keeps its own role radius and gets `shadow-floating`.
7. **Nested images** inherit their radius with `border-radius: inherit`, never a second literal.

## Depth and colour

1. **Resting cards** get `border-line-subtle` and either no shadow or `shadow-resting`. Never pair a strong border with a strong shadow.
2. **Floating layers** (popovers, menus, tooltips, dialogs) get `shadow-floating` or `shadow-overlay`, plus `border-line` and `bg-surface-raised`.
3. **No nested shadows.** A shadowed element never contains another shadowed element. Show at most three surface levels: `bg`, `surface` and `surface-raised`.
4. **Hover is one step.** Hover fills use `bg-surface-hover` and pressed fills use `bg-surface-active`. Hover changes colour or shadow by one step. It never changes size, weight or position.
5. **One brand fill per region.** `bg-brand` marks the primary action, at most once per region.
   - Brand as text or an icon uses `text-brand-text`.
   - Tints (`bg-brand-subtle`) mark state, never decoration.
6. **Status badges** use `bg-*-subtle` with `text-*-text`. Solid state fills appear only on buttons and progress bars.
7. **Text roles:**
   - Headings and labels: `text-text`.
   - Descriptions: `text-text-secondary`.
   - Metadata and placeholders: `text-text-muted`.
   - Disabled: `text-text-disabled`.
8. **Contrast.** Body text meets WCAG 4.5:1 in both themes.
9. **Dark mode** is a token swap. If a component needs more than two `dark:` classes, fix the token instead.

## Type

1. **Default UI size** is `text-ui` (14px). Dense tables may use `text-ui-sm` (13px). Nothing interactive goes below 12px.
2. **Weights.** Body text is 400. Labels, titles and buttons are 500. Use 600 only for headings of 24px or more. Never change weight on hover, focus or selection.
3. **`tabular-nums`** on every number that changes or aligns.
4. **Wrapping.** Headings get `text-balance` and paragraphs get `text-pretty`.
5. **Truncation.**
   - Flex text children get `min-w-0`.
   - Single lines use `truncate`.
   - Multiple lines use `line-clamp-*`.
6. **Hierarchy.** Use at most two text sizes in a card and three in a block.
7. **Punctuation.** Use `…`, not `...`. Loading labels end with `…`.

## States

1. **Focus.** Use `:focus-visible` only, with one ring: 2px, with a 2px gap (`focus-ring`). Text inputs show focus with a soft glow and a firmer border instead. Menu items show focus with a highlight fill. Never `outline-none` without one of these.
2. **Press:**
   - Text buttons scale to 0.97 (`press`).
   - Icon buttons of 48px or less scale to 0.96 (`pressIcon`).
   - Bars and cards wider than 220px scale to 0.985 (`pressWide`).
   - The press goes down in 100ms and releases on the snappy spring.
3. **Hover** applies only under `hover-fine:`. Touch gets an `:active` colour.
4. **Disabled.**
   - Filled buttons use `opacity-50`.
   - Outlined buttons keep their shape and use `text-text-disabled`.
   - Always `cursor-not-allowed`, and explain why inline.
5. **Loading.** Keep the width, overlay a spinner on a transparent label and set `aria-busy="true"`.
6. **Forms.** Errors show inline beside the field. On submit, the first invalid field gets focus.
7. **Every state.** Render empty, short, average and very long content, in both themes, at 360px and 1440px.

## Motion

### Springs per role

Use only these three springs:

| Spring | Motion | CSS | Use for |
|---|---|---|---|
| `snappy` | `{ type: "spring", stiffness: 520, damping: 38 }` | `ease-spring-snappy`, 350ms | Presses, toggles, thumbs, indicators, text swaps, rolling digits |
| `smooth` | `{ type: "spring", visualDuration: 0.4, bounce: 0 }` | `ease-spring-smooth`, 450ms | Height, layout, FLIP, panels; no overshoot |
| `bouncy` | `{ type: "spring", stiffness: 400, damping: 26 }` | `ease-spring-bouncy`, 600ms | Shape morphs and playful reveals only; never on exits |

### Durations

| Interaction | Duration |
|---|---|
| Press | 100ms |
| Hover and colour | 150ms |
| Tooltip and popover | 150–200ms |
| Dialog | 300ms |
| Sheet | 500ms |

Interaction feedback never takes longer than 200ms.

### Enter and exit

1. **Enter.**
   - Move 4–8px toward the trigger, scale from 0.96–0.97 and fade in.
   - Use `ease-enter` (`cubic-bezier(0.16, 1, 0.3, 1)`) or a spring.
   - Never scale from 0.
2. **Exit.**
   - Travel half the distance and scale to 0.98.
   - Use `ease-exit` (`cubic-bezier(0.7, 0, 0.84, 0)`).
   - An exit lasts at most 0.75 × its enter and never overshoots.
3. **Origin.** Set `transform-origin` to the trigger, so a popover grows out of what opened it.
4. **Interruptible.** Open and close with CSS transitions plus `@starting-style`, or Motion's `animate`, so reversing mid-flight is smooth. Use `@keyframes` only for entrances that play once on mount.
5. **Text and icon swaps.** The outgoing item moves up 3px and blurs 4px. The incoming item rises from 4px below. Tween the blur separately from the spring.
6. **Stagger.** 16ms per character, 35ms per list item, 40ms per word and 80ms per line, totalling 400ms at most. Entrances play once per mount.

### What moves and what doesn't

1. **Animate only** `transform`, `opacity`, `clip-path`, `filter` (blur up to 8px) and colours.
   - Never animate `width`, `height`, `top`, `left`, `margin`, `padding` or `box-shadow` per frame.
   - Never use `transition: all`.
2. **Don't animate** keyboard-driven, high-frequency actions: opening a command menu or context menu, adding or removing list items, typing.
3. **Indicators glide.** Tab underlines, segmented thumbs and selections move with shared layout. The items under them never scale or change weight.
4. **`will-change`** only during a gesture, reset afterwards. Never put it in a stylesheet.

### Reduced motion

1. Every animated component has a reduced branch: opacity only, at 100ms (`reducedFade`), or no animation.
2. In CSS, use the `reduced:` variant. In JS, read the setting after hydration with `useSafeReducedMotion()`, never during the first render.
3. Loops pause off-screen and under reduced motion. Anything that autoplays for more than 5 seconds gets a pause control.

## Before you finish

- [ ] Every column passes the one-edge check, and footers share the body's inset.
- [ ] Gaps between groups are at least twice the gaps inside them.
- [ ] Nested corners are concentric, and there are no literal radii or raw colours.
- [ ] Every focusable element shows one visible focus treatment.
- [ ] Every animation uses a named spring or duration and has a reduced branch.
- [ ] It works at 360px with no sideways scroll, in light and dark.
