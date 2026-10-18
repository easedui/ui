# Toggle Group

Toggle buttons on Base UI's ToggleGroup (one tab stop, arrow keys, `aria-pressed`), sharing one highlight.

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/eased/toggle-group/toggle-group";

<ToggleGroup multiple aria-label="Text formatting" value={formats} onValueChange={setFormats}>
  <ToggleGroupItem value="bold" aria-label="Bold"><BoldIcon /></ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Italic"><ItalicIcon /></ToggleGroupItem>
</ToggleGroup>
```

| Prop | Type | Default | |
|---|---|---|---|
| `value` / `defaultValue` | `string[]` | `[]` | Controlled or uncontrolled. |
| `onValueChange` | `(value: string[]) => void` | | |
| `multiple` | `boolean` | `false` | Single: at most one pressed, the highlight travels. Multiple: any number. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | |
| `variant` | `"track" \| "chips"` | `"track"` | `track`: one 32px bordered track (2px padding, items stretch to 26px), the height of Segmented, Tabs and a small Button. `chips`: separate bordered 32px chips that fill when pressed, for filter rows (wrap them in a horizontal `ScrollArea` to scroll). |
| `disabled` | `boolean` | | |
| `ToggleGroupItem` | `value`, `children`, `aria-label?`, `disabled?` | | Icon-only items need `aria-label`. |

Items have no extended hit area: they sit edge to edge, and a 44px target would steal the neighbour's clicks.

**Toggle Group or Segmented:** a single choice between views or values is `Segmented` (sunken track, raised thumb). Pressing things on and off (formatting, filters, days) is `ToggleGroup` (flat track, tinted items).

To require a selection in single mode, ignore empty updates: `onValueChange={(v) => v.length && setAlign(v)}`.

**Motion signature:** in single mode one highlight travels between items (growing in from nothing, fading out when cleared); in multiple mode each pressed item's highlight grows in and pressed neighbours fuse into one continuous shape. Labels never change weight.
