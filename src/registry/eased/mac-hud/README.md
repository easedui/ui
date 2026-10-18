# Mac HUD

The macOS volume and brightness overlay: a frosted, click-through HUD that shows a level for a moment and updates in place while it is up, in the classic square or the macOS 26 pill.

## When to use

- A Mac app (Tauri, Electron or a web app that looks native) that changes a level from a shortcut or a media key: volume, display or keyboard brightness, or your own level such as playback speed.
- Feedback for a key held down: every repeat moves the bar without the HUD flickering or re-entering.
- A desktop-style web demo where the overlay should feel like the system's own.

## When not to use

- A level people set by dragging: use a slider, which already shows its value.
- Messages and confirmations ("Copied", "Saved"): announce them in a toast or inline status.
- Anything people must act on: the HUD ignores the pointer and leaves after 1.1 seconds. For a reversible action use [Undo Pill](/components/undo-pill).

## Usage

`useMacHud` holds the state and the hold timer. Call `show(kind, value)` on every change and spread `hud` onto `<MacHud>`.

```tsx player.tsx
import { useEffect, useRef } from "react";
import { MacHud, useMacHud } from "@/components/eased/mac-hud/mac-hud";

export function Player() {
  const { hud, show } = useMacHud();
  const volume = useRef(0.5);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      // One of sixteen segments per press, as on a Mac.
      const next = Math.round(volume.current * 16) + (e.key === "ArrowUp" ? 1 : -1);
      volume.current = Math.min(16, Math.max(0, next)) / 16;
      show("volume", volume.current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  return <MacHud {...hud} />;
}
```

`show` while the HUD is up updates it in place and restarts the 1.1-second hold, so a held key keeps it on screen until the last repeat.

## Examples

### Pill

The macOS 26 capsule, 12px in from the top-right corner. Put it under your own menu bar by rendering it in a positioned box that starts below the bar.

```tsx
<MacHud {...hud} variant="pill" />
```

### Muted

Pass `muted` with the volume: the speaker gets a slash and the bar empties, and the level comes back when you unmute.

```tsx
show("volume", volume, { muted: true });
```

### Inside a container

`position="absolute"` places it in the nearest positioned parent instead of the viewport. The classic HUD sits 140px above the bottom, or centres in a container too short for that.

```tsx
<div className="relative h-80">
  <MacHud {...hud} position="absolute" />
</div>
```

### In a Tauri app

A HUD floats above every app, so on the desktop it lives in its own small window. Give it real vibrancy and pass `material="native"`, which drops the CSS blur and tint and keeps the hairline. Make the window the HUD's size and render the HUD with `position="none"`.

```json src-tauri/tauri.conf.json
{
  "app": {
    "windows": [
      {
        "label": "hud",
        "url": "/hud",
        "width": 200,
        "height": 200,
        "visible": false,
        "transparent": true,
        "decorations": false,
        "focus": false,
        "shadow": false,
        "resizable": false,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "visibleOnAllWorkspaces": true,
        "windowEffects": { "effects": ["hudWindow"], "state": "active", "radius": 18 }
      }
    ]
  }
}
```

The HUD window's page listens for level changes from the rest of the app, ignores the cursor, and sits 140px above the bottom of the current screen, centred.

```tsx src/hud.tsx
import { listen } from "@tauri-apps/api/event";
import { PhysicalPosition } from "@tauri-apps/api/dpi";
import { currentMonitor, getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";
import { MacHud, useMacHud, type MacHudKind } from "@/components/eased/mac-hud/mac-hud";

type Level = { kind: MacHudKind; value: number; muted?: boolean };

export function HudWindow() {
  const { hud, show } = useMacHud();

  useEffect(() => {
    const win = getCurrentWindow();
    win.setIgnoreCursorEvents(true);
    const off = listen<Level>("hud", async ({ payload }) => {
      const monitor = await currentMonitor();
      if (monitor) {
        const size = 200 * monitor.scaleFactor;
        const x = monitor.position.x + (monitor.size.width - size) / 2;
        const y = monitor.position.y + monitor.size.height - size - 140 * monitor.scaleFactor;
        await win.setPosition(new PhysicalPosition(Math.round(x), Math.round(y)));
      }
      await win.show();
      show(payload.kind, payload.value, { muted: payload.muted });
    });
    return () => void off.then((unlisten) => unlisten());
  }, [show]);

  return <MacHud {...hud} position="none" material="native" />;
}
```

Hide the window once the HUD has left (about 150ms after `hud.open` turns false), or the empty native material stays on screen. Native vibrancy belongs to the window, so it appears and disappears at once while the icon and bar animate; a CSS blur cannot reach the desktop behind a transparent webview, which is why the window draws it. For the pill, size the window 200×44 and place it 12px below the menu bar at the right. `macOSPrivateApi` is a no-op since Tauri 2.12.1.

## API reference

### MacHud

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | | Show the HUD. Keep it mounted and toggle this so the exit animates; `useMacHud` drives it. |
| `kind` | `"volume" \| "brightness" \| "keyboard"` | | Which level it shows: picks the icon and the announcement. |
| `value` | `number` | | The level, 0 to 1, drawn in quarter segments (macOS's finest step, ⌥⇧ with a media key). |
| `muted` | `boolean` | `false` | Volume only: speaker with a slash, empty bar. |
| `variant` | `"classic" \| "pill"` | `"classic"` | The 200×200 square of macOS 15 and earlier, or the 200×44 capsule of macOS 26. |
| `position` | `"fixed" \| "absolute" \| "none"` | `"fixed"` | Against the viewport, in the nearest positioned parent, or in flow for you to place (a Tauri HUD window). |
| `material` | `"css" \| "native"` | `"css"` | `native` drops the CSS blur and tint for a window that draws real vibrancy. |
| `labels` | `{ volume?, brightness?, keyboard?, muted?: string }` | `"Volume"`, `"Brightness"`, `"Keyboard brightness"`, `"muted"` | Translate the announcement. |
| `className` | `string` | `""` | Appended to the HUD's classes; position is kept. |

### useMacHud

`useMacHud({ duration? })` returns `{ hud, show, hide }`. `show(kind, value, { muted? })` opens or updates the HUD and restarts the hold; `hide()` closes it at once. `duration` is the hold after the last `show`, in ms (default `1100`). Spread `hud` onto `<MacHud>`.

### MacHudIcon

The HUD's glyphs on their own, for media keys and menus: `<MacHudIcon kind="volume" value={1} className="size-4" />`. Takes `kind`, `value`, `muted` and `className`; colour is `currentColor`.

## Accessibility

- A `role="status"` live region, mounted before the HUD first shows, announces each change ("Volume 60%", "Volume, muted"), so screen readers hear the level without focus moving.
- The visual HUD is `aria-hidden` and ignores the pointer: it never takes focus or blocks a click on what is under it.
- It never holds the only copy of information: the level lives in your app, and the HUD only reflects it.

## Motion

The HUD fades in on the enter curve while it scales from 0.96 on the snappy spring; the pill also drops 10px. It leaves in 150ms on the ease-in curve to 0.98 (the pill rises 6px), with no overshoot. While it is up, a new value never replays the entrance: classic segments snap in 100ms, the pill's bar slides on the smooth spring, and icon changes (a wave, the mute slash, longer sun rays) fade and un-blur on the text-swap tokens; a new kind swaps the whole glyph. Changing `variant` while it is up swaps one HUD for the other, without a morph. Reduced motion keeps 100ms opacity fades only and moves the bar at once.

## Notes for AI

Use Mac HUD for transient feedback on a level changed by a shortcut or media key in a Mac-style app. Call `show` from `useMacHud` on every change, including repeats; render one HUD per window with `{...hud}` spread onto it. In Tauri or Electron with native vibrancy, use `material="native"` and `position="none"` inside a 200×200 window.

Do not unmount it to hide it, do not add a timer of your own (the hook owns the 1.1-second hold), and do not put controls in it: it is click-through. Do not give it a drop shadow or a different radius; macOS's HUD has neither.

## Related

- [Undo Pill](/components/undo-pill): a transient pill people can act on.
- [Segmented](/components/segmented): the classic and pill switch in the demo.
- [Button](/components/button): the media keys in the demo.
