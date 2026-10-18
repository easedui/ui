"use client";

import { useId, useState } from "react";
import { NumberRoll } from "../_primitives/number-roll/number-roll";
import { TextSwap } from "../_primitives/text-swap/text-swap";
import { DemoFrame } from "../lib/demo-frame";
import { Rating } from "./rating";

const WORDS = ["Tap a star to rate", "Not for me", "Could be better", "Good", "Really good", "Loved it"];

// The ratings before yours: 5★ down to 1★.
const SPREAD = [812, 291, 102, 41, 38];
const COUNT = SPREAD.reduce((a, b) => a + b, 0);
const SUM = SPREAD.reduce((a, n, i) => a + n * (5 - i), 0);

const REVIEWS = [
  { name: "Priya Raman", when: "2 days ago", stars: 5, text: "The glaze caramelised exactly as described. Ten minutes start to finish." },
  { name: "Tomás Ortega", when: "last week", stars: 4, text: "Great weeknight dinner. I halved the sugar and it was still lovely." },
];

export function RatingDemo() {
  const [mine, setMine] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const labelId = useId();
  const count = COUNT + (mine ? 1 : 0);
  const average = (SUM + mine) / count;
  const word = WORDS[Math.round(hover ?? mine)];

  return (
    <DemoFrame title="Miso-glazed salmon" meta="Reviews">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-(--pad)">
        <div className="flex items-center gap-4">
          <p className="text-3xl font-semibold text-text tabular-nums">
            <NumberRoll value={average} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
          </p>
          <div className="flex min-w-0 flex-col gap-1">
            <Rating readOnly value={average} size="sm" />
            <p className="text-ui-sm text-text-muted tabular-nums">
              <NumberRoll value={count} locale="en-US" /> ratings
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-control border border-line-subtle bg-surface-sunken px-4 py-3">
          <p id={labelId} className="text-ui font-medium text-text">
            Your rating
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Rating aria-labelledby={labelId} size="lg" value={mine} onValueChange={setMine} onHoverChange={setHover} clearable />
            <p className="text-ui-sm text-text-secondary" aria-hidden>
              <TextSwap>{word}</TextSwap>
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-4">
          {REVIEWS.map((r, i) => (
            // One review in a narrow tile, so nothing scrolls.
            <li key={r.name} className={`flex flex-col gap-1 ${i > 0 ? "@max-sm:hidden" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-ui font-medium text-text">{r.name}</p>
                <p className="shrink-0 text-ui-sm text-text-muted">{r.when}</p>
              </div>
              <Rating readOnly value={r.stars} size="sm" />
              <p className="text-ui-sm text-pretty text-text-secondary">{r.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </DemoFrame>
  );
}
