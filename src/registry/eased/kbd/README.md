# Kbd

A keycap that presses when the real key does.

```tsx
import { Kbd, useKeysHeld } from "@/components/eased/kbd/kbd";

<Kbd>/</Kbd>
<Kbd keys={["⌘", "K"]} />
const held = useKeysHeld(["⌘", "K"]); // light up the row a shortcut belongs to
```

## Props

| Prop | Type | Default | |
|---|---|---|---|
| `children` | `string` | | One key: `"K"`, `"⌘"`, `"Esc"`, `"↑"`… |
| `keys` | `string[]` | | A chord, one cap per key. |
| `listen` | `boolean` | `true` | Press the cap while the real key is held. |
| `pressed` | `boolean` | | Force the pressed look (tutorials, replays). |
| `size` | `"sm" \| "md"` | `"sm"` | 20px or 24px caps. |

Glyphs map to keys (⌘ Meta, ⌥ Alt, ⇧ Shift, ⌃ Control, ↵ Enter, ⎋/Esc, ⌫, ⇥, arrows; letters and digits by physical key, so ⌥K still matches K) and are announced by name ("Command K"). One shared window listener serves every cap; letting go of ⌘ or leaving the window clears them all, because macOS drops key-ups while ⌘ is held.

**Motion signature:** the face drops 1px onto its base and darkens in 100ms when the key goes down, then springs back on the snappy spring when it comes up; reduced motion keeps only the colour change.
