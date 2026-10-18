# Breadcrumb

A trail from the root to the current page that folds its middle into a "…" menu when it runs out of room. The menu is the Eased [Dropdown Menu](/components/dropdown-menu), on Base UI Menu.

## When to use

- Deep hierarchies people move up through: folders, docs sections, a project's settings.
- Page headers where the parent pages are useful shortcuts, not decoration.
- Narrow headers and toolbars: the fold keeps the root and the current page readable at any width.

## When not to use

- Flat sites one level deep: the page title is enough.
- Steps in a sequence: use a stepper or progress indicator.
- Switching between sibling views: use [Tabs](/components/tabs).

## Usage

```tsx doc-header.tsx
import { Breadcrumb } from "@/components/eased/breadcrumb/breadcrumb";

export function DocHeader() {
  return (
    <Breadcrumb
      items={[
        { label: "Acme", href: "/" },
        { label: "Marketing", href: "/marketing" },
        { label: "Website redesign", href: "/marketing/website" },
        { label: "Homepage" },
      ]}
    />
  );
}
```

## Examples

### Your router's link

```tsx
import Link from "next/link";

<Breadcrumb items={items} renderLink={(props) => <Link {...props} />} />
```

### Slash separators, small

```tsx
<Breadcrumb items={items} separator="slash" size="sm" />
```

### Crumbs that act in place

Items with `onClick` and no `href` render as buttons, for file browsers and other in-app navigation.

```tsx
<Breadcrumb items={path.map((name, i) => ({ label: name, onClick: () => openFolder(i) }))} />
```

## API reference

### Breadcrumb

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `BreadcrumbItem[]` | | From the root to the current page. The last item is the current page. |
| `separator` | `"chevron" \| "slash" \| ReactNode` | `"chevron"` | |
| `collapse` | `boolean` | `true` | Fold middle crumbs into a "…" menu when the row would overflow. |
| `size` | `"sm" \| "md"` | `"md"` | 13px for toolbars and cards, 14px for page headers. |
| `renderLink` | `(props) => ReactElement` | | Your router's link; it receives `href`, `className`, `title` and `children`. |
| `aria-label` | `string` | `"Breadcrumb"` | The landmark's name. |
| `className` | `string` | `""` | Appended to the `nav`'s classes. |

### BreadcrumbItem

| Field | Type | Description |
|---|---|---|
| `label` | `ReactNode` | The visible label; long labels truncate (ancestors at 12rem). |
| `href` | `string` | Where it goes. Ignored on the last item. |
| `onClick` | `() => void` | For crumbs that act rather than navigate. |
| `icon` | `ReactNode` | A 16px icon before the label. |
| `textValue` | `string` | Plain text for the menu and `title` when `label` is not a string. |

The root is a block `nav`: give it the row's width (`w-full`, or `flex-1 min-w-0` in a flex row) so it can measure what fits.

## Keyboard

| Key | Action |
|---|---|
| `Tab` | Moves through the links and the "…" trigger. |
| `Enter` / `Space` on "…" | Opens the menu with the folded crumbs; arrows move, `Enter` follows, `Esc` closes and returns focus. |

## Accessibility

- A `nav` landmark with an ordered list; the current page has `aria-current="page"` and is not a link.
- Separators are `aria-hidden` presentational items, so screen readers count only crumbs.
- The "…" trigger is named "2 more" (the folded count) and announces its menu.
- Truncated labels keep their full text in `title`.

## Motion

Links underline on hover the way Eased's other links do: the underline is there at rest in a transparent colour and tweens to `line-strong` with the text colour in 150ms, on pointer devices only. The fold itself is instant, because it follows resizing. The menu opens 4px from its trigger at 0.97 in 150ms and leaves in 100ms, with a gliding row highlight. Reduced motion keeps the colour tweens and drops the menu's travel.

## Notes for AI

Use Breadcrumb in a page or panel header for a real hierarchy, passing every level from the root and the current page last. Give it the full row width so the fold can measure; pass `renderLink` for Next.js or another router.

Don't add your own overflow logic, separators between items or `aria-current`: it measures labels, draws separators and marks the current page. Don't put actions in the trail; keep them beside it.

## Related

- [Dropdown Menu](/components/dropdown-menu): the menu the folded crumbs live in.
- [Tabs](/components/tabs): sibling views on one level.
