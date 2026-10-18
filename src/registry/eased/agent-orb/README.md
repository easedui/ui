# Agent Orb

A small living disc for an assistant's state. Colour fields drift inside a glassy sphere, a band of light sweeps through while it thinks, and it breathes. Its speed follows the token rate.

```tsx
import { AgentOrb } from "@/components/eased/agent-orb/agent-orb";
import { useTokenRate } from "@/components/eased/_primitives/thinking-core/thinking-core";

<AgentOrb state="thinking" />

const { rate } = useTokenRate(message.text);
<AgentOrb state="speaking" rate={rate} size="lg" />

<AgentOrb state="listening" level={micLevel} />   // a 0–1 motion value from an AnalyserNode
```

## Props

| Prop | Type | Default | |
|---|---|---|---|
| `state` | `"idle" \| "listening" \| "thinking" \| "speaking"` | `"thinking"` | Each state has its own palette, speed and energy; changes crossfade over 700ms. |
| `rate` | `number \| MotionValue<number>` | | 0–1 stream rate. Speeds the swirl up to 2× and deepens the breath. A motion value updates without re-rendering. |
| `level` | `number \| MotionValue<number>` | | 0–1 input level while `listening`. |
| `variant` | `"orb" \| OrbVariant` | `"orb"` | A Pro variant component (ring, swirl, liquid, aurora, grain, shader). |
| `size` | `"sm" \| "md" \| "lg" \| number` | `"md"` | 16, 24 or 40px, or any diameter. |
| `label` | `string \| false` | the state | Accessible name (`role="img"`). `false` when visible text already says it. |
| `className` | `string` | | |

Re-theme by setting `--eased-orb-a`, `--eased-orb-b`, `--eased-orb-c` and `--eased-orb-deep` on `.eased-orb[data-state="…"]`.

**Variants.** The orb owns the clock; a variant only paints. An `OrbVariant` is a component that receives `{ size, state, phase, energy, reduced }`: `phase` is animated time already scaled by speed (derive every rotation from it so speed changes glide), and `energy` is a smoothed 0–1 amplitude.

**Motion signature:** three colour fields and a dark pocket orbit at different rates under a slow iridescent swirl, so the pattern never repeats; speed eases (0.5s, no overshoot) from a 0.4× idle drift to 1× thinking and up to 2× while speaking with the token rate, and the breath swells 1 → 1.06 with energy. It pauses off-screen and stands still under reduced motion, keeping its colours.
