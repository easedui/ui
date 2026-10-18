# Avatar

Avatar and AvatarGroup on Base UI Avatar.

```tsx
import { Avatar, AvatarGroup } from "@/components/eased/avatar/avatar";

<Avatar name="Maya Okafor" src="/maya.jpg" />
<AvatarGroup aria-label="Design team" max={5}>
  {people.map((p) => <Avatar key={p.id} name={p.name} src={p.photo} />)}
</AvatarGroup>
```

## Props

`Avatar`: `name` (accessible name and initials), `src`, `initials` (override), `size` (`xs` 20 · `sm` 24 · `md` 32 · `lg` 40 · `xl` 48, default `md`), `shape` (`circle` or `square`; 48px squares get a superellipse), `className`.

`AvatarGroup`: `children` (Avatars), `max` (the rest collapse into a rolling `+N`), `size`, `shape`, `aria-label`, `cutout` (the separating ring's colour; match the surface behind, default `var(--eased-surface)`), `className`.

**Motion signature:** an image fades in from a 4px blur once it has loaded, and the initials wait 400ms (`duration.fallback`) before showing, so a quick image never flashes the fallback (a failed or missing image shows initials at once); a stack spreads apart on the snappy spring under a fine pointer or keyboard focus, and its overflow count rolls.
