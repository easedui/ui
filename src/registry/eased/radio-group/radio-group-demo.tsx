"use client";

import { useId, useState } from "react";
import { DemoFrame } from "../lib/demo-frame";
import { Radio, RadioCard, RadioCards, RadioGroup } from "./radio-group";

type Speed = "standard" | "express" | "overnight";
type DropOff = "door" | "hand";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const SPEEDS: { value: Speed; title: string; description: string; price: number }[] = [
  { value: "standard", title: "Standard", description: "Arrives Fri, Oct 23 – Tue, Oct 27", price: 0 },
  { value: "express", title: "Express", description: "Arrives Wed, Oct 21", price: 12 },
  { value: "overnight", title: "Overnight", description: "Tomorrow by 10am if you order in 2h 14m", price: 29 },
];

export function RadioGroupDemo() {
  const dropOffLabel = useId();
  const [speed, setSpeed] = useState<Speed>("express");
  const [dropOff, setDropOff] = useState<DropOff>("door");
  const handOff = speed !== "standard";
  const chooseSpeed = (next: Speed) => {
    setSpeed(next);
    if (next === "standard") setDropOff("door");
  };
  const price = SPEEDS.find((s) => s.value === speed)!.price;

  return (
    <DemoFrame title="Delivery" meta={price === 0 ? "Free" : usd.format(price)}>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
        <RadioCards aria-label="Delivery speed" name="speed" value={speed} onValueChange={chooseSpeed}>
          {SPEEDS.map((s) => (
            <RadioCard
              key={s.value}
              value={s.value}
              title={s.title}
              description={s.description}
              meta={s.price === 0 ? "Free" : usd.format(s.price)}
            />
          ))}
        </RadioCards>

        <div className="flex flex-col gap-1">
          <p id={dropOffLabel} className="text-ui-sm font-medium text-text">
            Drop-off
          </p>
          <RadioGroup<DropOff> aria-labelledby={dropOffLabel} name="drop-off" value={dropOff} onValueChange={setDropOff}>
            <Radio value="door">Leave it at the door</Radio>
            <Radio
              value="hand"
              disabled={!handOff}
              description={handOff ? "We text you 10 minutes before we arrive." : "Available with Express or Overnight."}
            >
              Hand it to me
            </Radio>
          </RadioGroup>
        </div>
      </div>
    </DemoFrame>
  );
}
