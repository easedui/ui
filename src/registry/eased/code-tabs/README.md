# Code Tabs

Several files, or one command for each package manager, in one code block.

**Motion signature:** the underline glides to the new tab on the snappy spring while the code cross-fades 6px in the direction of travel, the block's height springs to the new file and the language pill swaps its label in place; with a `groupId`, every block on the page switches together.

## When to use

- A component and its demo, or a page, its component and its stylesheet.
- Install, run and dlx commands across pnpm, npm, yarn and bun.

## When not to use

- One file: use [Code Block](/components/code-block). One command with no choice: use [Snippet](/components/snippet).

## Usage

```tsx install.tsx
import { CodeTabs, packageManagerItems } from "@/components/eased/code-tabs/code-tabs";

<CodeTabs items={packageManagerItems({ add: "motion" })} groupId="package-manager" label="Package manager" />

<CodeTabs
  items={[
    { label: "page.tsx", code: page },
    { label: "counter.tsx", code: counter, highlight: "6" },
  ]}
/>
```

## Props

| Prop | Default | |
|---|---|---|
| `items` | | `{ label, value?, code, lang?, tokens?, highlight?, focus?, added?, removed? }[]`. `lang` defaults from the label's extension. |
| `groupId` | | Sync the selection with every Code Tabs (and `useChoice`) sharing this id, across the page, other tabs and visits. |
| `value`, `defaultValue`, `onValueChange` | | Controlled or uncontrolled selection by item `value` (default `label`). |
| `label` | `"Files"` | Accessible name of the tab list. |
| `showLang` | when languages differ | The language pill. |
| `lineNumbers`, `collapseAfter`, `wrap` | `false`, `20`, `false` | As Code Block. |
| `copy`, `onCopy` | `true` | The copy button copies the active tab: `(code, value) => void`. |

Helpers: `packageManagerItems({ add | dlx | run })` and `packageCommand(pm, { add | dlx | run })` (`pnpm add`, `npm install`, `npx`, `bunx --bun`, `npm run` …), `PACKAGE_MANAGERS`.

Keyboard: Base UI Tabs (arrow keys, Home/End). Reduced motion: opacity cross-fades only.
