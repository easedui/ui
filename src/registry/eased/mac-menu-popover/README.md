# Mac menu popover

A macOS menu bar popover: a status item and a frosted panel that hangs from it on an arrow, built on Base UI Popover, the Eased floating layer and the shared `eased-mac` material.

## When to use

- A menu bar utility in a Tauri or Electron app: usage meters, timers, clipboard history, quick toggles.
- A web demo or landing page that shows a Mac app's tray panel and should look and move like the real thing.
- Anywhere a `Popover` should read as native macOS: system font, translucent material, an arrow pointing at its anchor.

## When not to use

- Ordinary web UI: use [Popover](/components/popover), which follows Eased's web material and radius.
- A list of commands with no other content: a menu is the better pattern.
- Transient feedback such as volume or brightness changes: use [Mac HUD](/components/mac-hud).

## Usage

```tsx example.tsx
import {
  MacMenuItem,
  MacMenuPopover,
  MacMenuPopoverClose,
  MacMenuPopoverContent,
  MacMenuSeparator,
  MacStatusItem,
} from "@/components/eased/mac-menu-popover/mac-menu-popover";

export function UsageMenu() {
  return (
    <MacMenuPopover>
      <MacStatusItem label="Tally: 62% of this session used">62%</MacStatusItem>
      <MacMenuPopoverContent>
        <p className="font-semibold">Tally</p>
        <p>62% of this session · resets in 1h 48m</p>
        <MacMenuSeparator />
        <MacMenuPopoverClose render={<MacMenuItem shortcut="⌘," />}>Settings…</MacMenuPopoverClose>
        <MacMenuPopoverClose render={<MacMenuItem shortcut="⌘Q" />}>Quit</MacMenuPopoverClose>
      </MacMenuPopoverContent>
    </MacMenuPopover>
  );
}
```

## Examples

### Inside a native vibrancy window

Let the window's `windowEffects` (Tauri) or `vibrancy` (Electron) draw the material.

```tsx
<MacMenuPopoverContent material="native">…</MacMenuPopoverContent>
```

### Kept inside a frame

In a mock-up, keep the panel inside the fake screen rather than the viewport.

```tsx
<MacMenuPopoverContent collisionBoundary={screenElement}>…</MacMenuPopoverContent>
```

### In a Tauri tray window

The panel is meant to fill a small, borderless tray window. In `tauri.conf.json`:

```json tauri.conf.json
{
  "app": {
    "windows": [
      {
        "label": "tray",
        "url": "/tray",
        "width": 320,
        "height": 420,
        "visible": false,
        "transparent": true,
        "decorations": false,
        "resizable": false,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "visibleOnAllWorkspaces": true,
        "windowEffects": { "effects": ["popover"], "state": "active", "radius": 12 }
      }
    ]
  }
}
```

- The window is the panel: size it to the content and keep the page background transparent. macOS draws the window shadow.
- Place it under the tray icon with the positioner plugin (`tauri-plugin-positioner`): call `on_tray_event` from your tray handler, then `moveWindow(Position.TrayBottomCenter)` before showing the window. Hide the window when it loses focus (`onFocusChanged`), as macOS does.
- In the tray window the native tray icon is the status item and the window is the panel, so render your content in `MacMenuPanel` (the same type, fills and padding, without the popover); `MacMenuItem` and `MacMenuSeparator` work inside it.
- With `windowEffects` the window draws real vibrancy, so use `material="native"` (the panel's default): the CSS blur and tint drop out and the hairline stays. Without `windowEffects`, pass `material="css"`.
- `macOSPrivateApi` is not needed for transparency: it has been a no-op since Tauri 2.12.1.
- `MacMenuPopover` itself is for menu bars drawn in the page: a web demo, a landing page, or an app window with its own title bar.

```tsx tray.tsx
<MacMenuPanel>
  <p className="font-semibold">Tally</p>
  …
  <MacMenuItem shortcut="⌘Q" onClick={() => exit(0)}>Quit</MacMenuItem>
</MacMenuPanel>
```

## API reference

### MacMenuPopover

Base UI `Popover.Root`: `open`, `defaultOpen`, `onOpenChange`, `modal` (non-modal by default), `actionsRef`.

### MacStatusItem

Base UI `Popover.Trigger` props, plus:

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | | Required accessible name, e.g. "Usage: 62% of this session used". |
| `className` | `string` | `""` | Appended to the item's classes. |

A 22px menu bar button. Children are its icon and optional short value.

### MacMenuPopoverContent

| Prop | Type | Default | Description |
|---|---|---|---|
| `width` | `number` | `320` | Panel width, px; capped at the available width. |
| `arrow` | `boolean` | `true` | Draw the arrow. Without it the panel is a plain rounded rectangle. |
| `material` | `"css" \| "native"` | `"css"` | `native` drops the CSS blur and tint for a window that draws its own vibrancy. |
| `side` | `"bottom" \| "top"` | `"bottom"` | Flips on collision; the arrow moves to the facing edge. |
| `align` | `"start" \| "center" \| "end"` | `"center"` | |
| `sideOffset` | `number` | `6` | Gap from the status item to the arrow tip, px. |
| `alignOffset` | `number` | `0` | |
| `collisionPadding` | `number` | `8` | Space kept from the boundary, px. |
| `collisionBoundary` | `Element \| Element[] \| Rect \| "clipping-ancestors"` | viewport | The area the panel stays inside. |
| `initialFocus` | Base UI | see description | Where focus goes on open. Default: the first control when opened from the keyboard, the panel itself when clicked, so no row lights up. |
| `finalFocus` | Base UI | the status item | Where focus returns on close. |
| `container` | `HTMLElement \| null` | `document.body` | Portal target. |
| `zIndex` | `number` | `50` | |
| `className` | `string` | `""` | Appended to the content area (a flex column with 12px padding). |

The panel exposes `--pad` (12px) and `--radius-outer` (11px) for concentric children.

### MacMenuPanel

The panel's material, type, fills and 12px padding as a plain `div`, for a native tray window. `material` (`"native"`), `className`, `children`.

### MacMenuItem

A `<button>` row. All button props, plus `icon` (a 16px icon on the content line) and `shortcut` (display text such as `"⌘D"`; wire the key yourself). Wrap it in `MacMenuPopoverClose` with `render` when the action should close the panel.

### MacMenuSeparator, MacMenuPopoverClose

A divider on the content lines (`className`), and Base UI `Popover.Close`.

## Keyboard

| Key | Action |
|---|---|
| `Enter` / `Space` on the status item | Opens or closes the panel. |
| `Tab` / `Shift+Tab` | Moves through the panel's controls; focus stays in the page. |
| `Esc` | Closes the panel and returns focus to the status item. |

## Accessibility

- The status item is a button named by `label`, with `aria-expanded` while open. Its visible text can be just a number; the label says what the number means.
- The panel is a Base UI popover (`role="dialog"`, non-modal). A keyboard open moves focus to its first control (a click focuses the panel itself); focus returns to the status item on close; Escape and an outside click dismiss it.
- Rows are real buttons. Hover and keyboard focus draw the same highlight, so focus is never invisible. The shortcut text is display only.
- The status item is 22px tall, as in the macOS menu bar; it sits in a dense row of targets, so it isn't enlarged to 44px.

## Motion

The panel grows from the arrow tip (Base UI's `--transform-origin`, which tracks the arrow) using the floating layer's transitions: it drops 6px toward the menu bar and scales from 0.95 on the `snappy` spring while fading in over 200ms, then leaves at half the distance and scale in 150ms. Open and close are CSS transitions, so a close during the open turns around mid-flight. The shadow layer copies the panel's motion state, so it moves in step. The status item presses and stays highlighted by colour only, never by scale. Reduced motion keeps a 100ms fade.

## Notes for AI

Pick this for anything that should look like a Mac menu bar extra, especially in a Tauri or Electron tray window (`material="native"` there). Compose `MacMenuPopover` › `MacStatusItem` + `MacMenuPopoverContent`, fill the content with your own layout, and use `MacMenuItem` / `MacMenuSeparator` for action rows. Always pass `label` to `MacStatusItem`.

Don't wrap the content in another card, border, shadow or blur: the panel draws its own material, hairline and shadow as one shape. Don't put a `filter`, `opacity` or `backdrop-filter` on an ancestor of the panel; it stops the blur from seeing the page. Don't scale the status item on press, and don't add animation to the panel: it already uses the shared floating motion.

## Related

- [Popover](/components/popover): the same behaviour with Eased's web material.
- [Mac HUD](/components/mac-hud): the macOS volume and brightness overlay.
