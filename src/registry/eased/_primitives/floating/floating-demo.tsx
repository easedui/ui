"use client";

import { Popover } from "@base-ui/react/popover";
import { DemoFrame } from "../../lib/demo-frame";
import { Button } from "../../button/button";
import { FloatingLayer, floatingSurface, type FloatingSide } from "./floating";

const SIDES: { side: FloatingSide; label: string; area: string }[] = [
  { side: "top", label: "Top", area: "col-start-2 row-start-1" },
  { side: "left", label: "Left", area: "col-start-1 row-start-2" },
  { side: "right", label: "Right", area: "col-start-3 row-start-2" },
  { side: "bottom", label: "Bottom", area: "col-start-2 row-start-3" },
];

/** One popover per side: each grows from its trigger and enters 5px toward it, whichever side it lands on. */
export function FloatingDemo() {
  return (
    <DemoFrame title="Floating layer" meta="4 sides">
      <div className="grid flex-1 grid-cols-3 grid-rows-3 place-items-center gap-2 bg-surface-sunken px-4">
        {SIDES.map(({ side, label, area }) => (
          <div key={side} className={area}>
            <Popover.Root>
              <Popover.Trigger render={<Button size="sm" />}>{label}</Popover.Trigger>
              <FloatingLayer parts={Popover} side={side} className={`${floatingSurface} w-44 rounded-panel p-3 text-ui-sm`}>
                <Popover.Title className="font-medium text-text">Placed {label.toLowerCase()}</Popover.Title>
                <Popover.Description className="mt-0.5 text-pretty text-text-secondary">
                  Grows from the trigger, 5px toward it. Leaves half as far.
                </Popover.Description>
              </FloatingLayer>
            </Popover.Root>
          </div>
        ))}
      </div>
    </DemoFrame>
  );
}
