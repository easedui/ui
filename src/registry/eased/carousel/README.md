# Carousel

A horizontal carousel on native scroll snapping: the platform's momentum on touch and trackpads, mouse drag with flick projection, previous/next buttons, arrow keys and a page indicator that follows the scroll continuously.

## When to use

- A row of cards wider than the space: customer stories, listings, plans, featured products.
- Content people browse in order but don't need to compare side by side.

## When not to use

- Content everyone must see: lay it out in a grid instead.
- Switching between views of one thing: use [Tabs](/components/tabs) or [Segmented](/components/segmented).
- Auto-advancing banners: this carousel never autoplays.

## Usage

```tsx stories.tsx
import { Carousel } from "@/components/eased/carousel/carousel";

export function Stories() {
  return (
    <div className="[--carousel-inset:16px]">
      <Carousel aria-label="Customer stories" slideSize="min(85%, 22rem)">
        {stories.map((s) => (
          <StoryCard key={s.id} story={s} />
        ))}
      </Carousel>
    </div>
  );
}
```

## Examples

### Progress bar indicator

```tsx
<Carousel aria-label="Listings" indicator="bar" slideSize="16rem" />
```

## API reference

### Carousel

| Prop | Type | Default | Description |
|---|---|---|---|
| `aria-label` | `string` | | Required. Names the carousel. |
| `slideSize` | `string` | `"80%"` | Any CSS length. |
| `gap` | `number` | `12` | px between slides. |
| `align` | `"start" \| "center"` | `"start"` | Where a slide rests. |
| `indicator` | `"dots" \| "bar" \| "none"` | `"dots"` | |
| `controls` | `boolean` | `true` | Previous and next buttons. |
| `loop` | `boolean` | `false` | Next on the last page returns to the first. |
| `draggable` | `boolean` | `true` | Mouse drag. Touch and trackpads always scroll natively. |
| `index` / `defaultIndex` | `number` | `0` | The page, controlled or uncontrolled. |
| `onIndexChange` | `(index) => void` | | Fires as the nearest page changes, during scroll too. |
| `footer` | `ReactNode` | | Replaces the indicator on the left of the footer. |
| `className` / `slideClassName` | `string` | | |

Set `--carousel-inset` on a parent to inset the first slide and the footer from the edges while slides still scroll to them.

## Keyboard

| Key | Action |
|---|---|
| `Tab` | Focuses the track, then the dots and buttons. |
| `←` / `→` | Previous or next page. |
| `Home` / `End` | First or last page. |

## Accessibility

- A region with `aria-roledescription="carousel"`; each slide is a group named "3 of 5".
- The current page is announced from a polite live region; dots carry `aria-current`.
- Pages are snap stops, so slides that share the last stop count as one page.

## Motion

Nothing animates on a timer: scrolling is native, so momentum and rubber-banding are the platform's own. The dot highlight is a clip-path on one bar that follows the fractional scroll position: between pages its leading edge runs ahead and its trailing edge catches up, so it stretches into a short worm and settles back to a dot. A mouse flick is projected with UIScrollView friction onto the stop it would coast to. Edges feather 20px only where there is more to scroll. Reduced motion jumps instead of smooth-scrolling.

## Notes for AI

Use Carousel for a browsable row of cards. Give each slide a card with its own radius, set `slideSize` so the next one peeks in, and set `--carousel-inset` to the container's padding.

Don't add autoplay, a second scroll container or your own snap CSS; don't wrap slides in links that fire on drag (clicks after a drag are swallowed for you).

## Related

- [Scroll Area](/components/scroll-area): free scrolling without pages.
- [Tabs](/components/tabs): switching between panels.
