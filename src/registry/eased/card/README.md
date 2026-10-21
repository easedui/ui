# Card

A surface that groups one subject, with shadcn's parts and `data-slot`s so it swaps straight in. A static card holds still; a CardLink makes the whole card one link that lifts, presses and rings, and `autoHeight` springs its height as content changes.

## When to use

- Group one subject on a dashboard or settings page: a plan with a Manage button, a stat with its period, a short form.
- Link to a page about one thing, such as a project, a document or a person, with the whole card as the target.
- Hold content that changes size in place, such as a list that expands or a form that turns into a confirmation, so the page below glides instead of jumping.
- Replace shadcn's Card without touching the markup: same component names, same slots, same header grid.

## When not to use

- A single number with a trend and a sparkline: use a [Stat Tile](/components/stat-tile).
- A message about what happened, tinted by tone: use an [Alert](/components/alert).
- Sections of a settings page: separate them with a [Separator](/components/separator), not a card each (rule 97).
- Rows that repeat, such as files or people: use a [Table](/components/table) or a list, not a card per row.

## Usage

```tsx plan-card.tsx
import { Button } from "@/components/eased/button/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/eased/card/card";
import { Progress } from "@/components/eased/progress/progress";

export function PlanCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pro plan</CardTitle>
        <CardDescription>Renews Nov 1 for $249.00</CardDescription>
        <CardAction>
          <Button size="sm">Manage</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Progress label="9 of 12 seats used" value={9} max={12} showValue={false} size="sm" />
      </CardContent>
    </Card>
  );
}
```

## Examples

### A card that is a link

Wrap the title text in `CardLink`. Its hit area stretches over the card, so a click anywhere opens it, and the link's accessible name stays the title. A CardAction stays clickable on top; any other control inside needs `relative z-1`.

```tsx
<Card size="sm">
  <CardHeader>
    <CardTitle>
      <CardLink href="/projects/northwind-web">northwind-web</CardLink>
    </CardTitle>
    <CardDescription>Deployed 4m ago</CardDescription>
    <CardAction>
      <Badge tone="success" dot>Production</Badge>
    </CardAction>
  </CardHeader>
</Card>
```

For a router link, pass it as `render`: `<CardLink render={<Link href="/projects/northwind-web" />}>`. For a card that acts in place instead of navigating, render a button: `<CardLink render={<button type="button" onClick={select} />}>`.

### Content that grows

Set `autoHeight` and change the content; the card springs to its new height.

```tsx
const [all, setAll] = useState(false);

<Card autoHeight>
  <CardHeader>
    <CardTitle>Recent activity</CardTitle>
  </CardHeader>
  <CardContent>
    <ActivityList items={all ? activity : activity.slice(0, 3)} />
  </CardContent>
  <CardFooter>
    <Button size="sm" variant="ghost" edge="start" onClick={() => setAll(!all)}>
      {all ? "Show fewer" : `Show all ${activity.length}`}
    </Button>
  </CardFooter>
</Card>
```

### Dense

`size="sm"` drops the padding to 16px and the title to 14px, for grids of cards and tiles.

```tsx
<Card size="sm">…</Card>
```

### Coming from shadcn

Change the import path; the parts, slots and `className` overrides carry over. The card's gap and radius are set through variables (`gap-(--card-gap)`, `rounded-(--radius-outer)`), so a `gap-0` or `rounded-none` you pass wins without tailwind-merge. `CardHeader` still turns into a two-column grid when it holds a `CardAction`, and a `border-b` header or `border-t` footer still gets padding on its bordered side. The card sets its padding as `--pad` (24px, or 16px at `sm`) and its radius as `--radius-outer`, so `radius-nested` children inside line up with its corners.

## API reference

### Card

| Prop | Type | Default | Description |
|---|---|---|---|
| `size` | `"default" \| "sm"` | `"default"` | `default` is comfortable: 24px padding, 16px gaps and a 16px title. `sm` is dense: 16px padding, 12px gaps and a 14px title. Sets `data-size`. |
| `autoHeight` | `boolean` | `false` | Spring the height when the content changes size, including when text rewraps because the card got narrower. Puts the parts in an inner wrapper, so layout classes such as `gap-*` in `className` no longer reach them. |
| `className` | `string` | `""` | Appended to the root's classes. |

Every other `div` prop passes through to the root, which has `data-slot="card"`.

### CardHeader, CardDescription, CardContent, CardFooter

Plain `div`s with `data-slot` `card-header`, `card-description`, `card-content` and `card-footer`. They take every `div` prop. The header is a grid that makes room for a CardAction; the footer is a row with its items centred.

### CardTitle

A `div` with `data-slot="card-title"`, as in shadcn. Pass `render={<h3 />}` to put the title in the document outline.

### CardAction

A `div` with `data-slot="card-action"`, at the header's trailing edge and centred on the title's first line. It sits above a CardLink's hit area.

### CardLink

| Prop | Type | Default | Description |
|---|---|---|---|
| `href` | `string` | | Where the card goes. Every `a` prop passes through. |
| `render` | `ReactElement \| (props) => ReactElement` | `<a>` | Swap the element: a router `Link`, or a `button` for a card that acts in place. |
| `className` | `string` | `""` | Appended to the link's classes. |

It has `data-slot="card-link"`. The card reads that slot to lift, press and ring, so use one CardLink per card.

## Keyboard

| Key | Action |
|---|---|
| `Tab` | Moves focus to the CardLink, which rings the whole card, then to any controls inside. |
| `Enter` | Follows the link, or activates a button CardLink. |
| `Space` | Activates a button CardLink. |

## Accessibility

- A card is a plain `div` with no role. Give CardTitle a heading element with `render` when cards are sections of the page.
- A linked card has exactly one link, named by the title it wraps, so a screen reader hears "northwind-web, link" rather than the whole card read out.
- Keyboard focus draws the 2px ring around the whole card, not the title text, and a transparent outline shows it in forced-colours mode. Pointer clicks draw no ring.
- The hit area covers the full card, well over 44×44px. Text inside a linked card can't be selected, as with any link.
- While `autoHeight` springs, content outside the new height is clipped; at rest nothing is clipped, so focus rings and shadows inside the card show in full.

## Responsive

The card fills its container and never sets a width. The header's title and description wrap in the space beside a CardAction, and the header is a `@container/card-header`, so its children can adapt with `@max-xs/card-header:` and friends.

## Motion

A card is a container, so by default it holds still: no entrance, no hover, nothing on a re-render. Motion only shows up where it explains something. With a CardLink inside, the card becomes a target. On hover (pointer devices only) the border steps to `line-strong` over 150ms on the standard curve, and `shadow-raised` fades in over 200ms on a layer behind the content, so `box-shadow` itself never animates. It doesn't lift or grow, because a card that moves under the pointer is harder to aim at. Pressing the link scales the card to 0.985, the wide-control press for anything over 220px: down in 100ms, back on the snappy spring. Pressing a button inside the card presses only that button. Keyboard focus fades the ring in like any focus ring. With `autoHeight`, a size change (new content, or text rewrapping as the viewport narrows) rides the smooth spring (no overshoot) through Auto Height, and a change mid-spring carries on from the current height. Content doesn't fade, because it changed and didn't arrive. Reduced motion: no press scale, and the height snaps; the colour and shadow fades stay because they don't move anything.

## Notes for AI

Use Card for anything you would reach for shadcn's Card for; the code is the same apart from the import path. Pick `size="sm"` in grids and dashboards. To make a card navigate, put `CardLink` around the title text instead of wrapping the card in an `<a>`, and give CardLink `render={<Link href=… />}` in a Next.js app. Set `autoHeight` only when content changes size while the card is on screen.

Don't wrap Card in `<a>` or `<button>`, or put `onClick` on the root: you lose the hover, press and focus ring, and nested controls become invalid HTML. Don't add hover or entrance animations to a static card, and don't wrap it in your own height animation; `autoHeight` already does that. Inside a linked card, give controls other than CardAction `relative z-1`, or the link's hit area covers them. Keep anything positioned out of the path between CardLink and the Card root: `relative` on CardHeader or CardTitle shrinks the hit area to the title.

## Related

- [Stat Tile](/components/stat-tile): one number with its trend and sparkline, already laid out.
- [Concentric Frame](/components/concentric-frame): nested corners that stay concentric as the padding changes.
- [Alert](/components/alert): a tinted callout that springs open and closed, for messages rather than subjects.
