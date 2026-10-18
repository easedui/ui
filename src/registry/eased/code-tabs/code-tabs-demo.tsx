"use client";

import { DemoFrame } from "../lib/demo-frame";
import { CodeTabs, packageManagerItems } from "./code-tabs";

const INSTALL = packageManagerItems({ add: "motion @base-ui/react" });

const FILES = [
  {
    label: "page.tsx",
    code: `import { Counter } from "./counter";

export default function Page() {
  return <Counter start={3} />;
}`
  },
  {
    label: "counter.tsx",
    highlight: "6",
    code: `"use client";

import { useState } from "react";
import { NumberRoll } from "@/components/eased/number-roll/number-roll";

export function Counter({ start = 0 }: { start?: number }) {
  const [count, setCount] = useState(start);
  return (
    <button onClick={() => setCount((n) => n + 1)}>
      <NumberRoll value={count} />
    </button>
  );
}`,
  },
  {
    label: "globals.css",
    code: `@import "tailwindcss";
@import "./eased.css";

body {
  background: var(--eased-bg);
}`,
  },
];

/** Install in your package manager (synced page-wide), then three files of different heights and languages. */
export function CodeTabsDemo() {
  return (
    <DemoFrame>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 [scrollbar-width:thin]">
        <section className="flex flex-col gap-2">
          <h3 className="text-ui-sm font-medium text-text">Install</h3>
          <CodeTabs items={INSTALL} groupId="package-manager" label="Package manager" className="rounded-control" />
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="text-ui-sm font-medium text-text">Use it</h3>
          <CodeTabs items={FILES} className="rounded-control" />
        </section>
      </div>
    </DemoFrame>
  );
}
