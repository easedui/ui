# Eased

Motion-first React components, with every curve already tuned. Built on React 19, Tailwind CSS v4, [Motion](https://motion.dev) and [Base UI](https://base-ui.com), and distributed as a [shadcn](https://ui.shadcn.com) registry.

**[eased.dev](https://eased.dev)** · [Components](https://eased.dev/components) · [Docs](https://eased.dev/docs/introduction) · [Agent quickstart](https://eased.dev/docs/agent-quickstart)

This repository is the free, MIT-licensed core: the source of every free component, its docs, and the registry JSON that `eased.dev/r` serves.

## Install a component

```bash
npx shadcn add https://eased.dev/r/button.json
```

The CLI copies the component's source into `components/eased/`, installs its dependencies and merges the Eased tokens into your global CSS. You own the code from then on.

## Use it with your AI agent

Connect the Eased MCP server, and your agent can search, read and install components:

```bash
claude mcp add --transport http eased https://eased.dev/api/mcp
```

For Cursor, VS Code and Codex, see the [agent quickstart](https://eased.dev/docs/agent-quickstart).

## What's here

| Path | Contents |
|---|---|
| `src/registry/eased/<name>/` | A component's source and its `README.md` (usage, props, motion signature) |
| `src/registry/eased/_primitives/` | Shared primitives: floating, indicator, auto height, chart, chat, code and table cores |
| `src/registry/eased/lib/` | Tokens (`eased.css`), springs and durations (`motion.ts`), press styles |
| `public/r/` | The built registry JSON |
| `registry.json` | The registry manifest |

## Eased Pro

Pro adds the showpieces: Spotlight Tour, Scrub Label, Group-by List, the chart pack, the Sortable Table and more, plus Pro blocks, plus every future Pro component and block. It's one payment for lifetime access, and the source ships to your repo. See [eased.dev/#pricing](https://eased.dev/#pricing). Pro source isn't in this repository.

## Report an issue

Open a [GitHub issue](https://github.com/easedui/ui/issues) or use [eased.dev/report](https://eased.dev/report).

## Licence

[MIT](LICENSE). Pro components are licensed separately.
