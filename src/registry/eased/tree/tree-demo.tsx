"use client";

import { useMemo, useState } from "react";
import { TextSwap } from "../_primitives/text-swap/text-swap";
import { DemoFrame } from "../lib/demo-frame";
import { Tree, type TreeNode } from "./tree";

const FILES: TreeNode[] = [
  {
    id: "app",
    label: "app",
    children: [
      {
        id: "app/(marketing)",
        label: "(marketing)",
        children: [
          { id: "app/(marketing)/page.tsx", label: "page.tsx", meta: "M" },
          { id: "app/(marketing)/pricing", label: "pricing", children: [{ id: "app/(marketing)/pricing/page.tsx", label: "page.tsx" }] },
        ],
      },
      {
        id: "app/dashboard",
        label: "dashboard",
        children: [
          { id: "app/dashboard/layout.tsx", label: "layout.tsx" },
          { id: "app/dashboard/page.tsx", label: "page.tsx" },
          { id: "app/dashboard/loading.tsx", label: "loading.tsx", meta: "U" },
        ],
      },
      { id: "app/layout.tsx", label: "layout.tsx" },
      { id: "app/globals.css", label: "globals.css" },
    ],
  },
  {
    id: "components",
    label: "components",
    children: [
      { id: "components/invoice-table.tsx", label: "invoice-table.tsx", meta: "M" },
      { id: "components/plan-picker.tsx", label: "plan-picker.tsx" },
      { id: "components/usage-chart.tsx", label: "usage-chart.tsx" },
    ],
  },
  {
    id: "lib",
    label: "lib",
    children: [
      { id: "lib/billing.ts", label: "billing.ts" },
      { id: "lib/db.ts", label: "db.ts" },
    ],
  },
  { id: "public", label: "public", children: [{ id: "public/og.png", label: "og.png" }] },
  { id: "next.config.ts", label: "next.config.ts" },
  { id: "package.json", label: "package.json" },
  { id: "README.md", label: "README.md" },
];

/** A Next.js repository: open folders, arrow through rows, type a name to jump to it. */
export function TreeDemo() {
  const [selected, setSelected] = useState<string | null>("app/dashboard/page.tsx");
  const count = useMemo(() => countFiles(FILES), []);
  return (
    <DemoFrame title="ledgerly-web" meta={`${count} files`}>
      <Tree
        aria-label="Files in ledgerly-web"
        items={FILES}
        defaultExpanded={["app", "app/dashboard", "components"]}
        selected={selected}
        onSelectedChange={(id) => setSelected(id)}
        className="min-h-0 flex-1 px-2.5 py-2"
      />
      <div className="flex h-10 shrink-0 items-center border-t border-line-subtle px-4 font-mono text-ui-xs text-text-muted">
        <span className="min-w-0 truncate">
          <TextSwap swapKey={selected ?? ""}>{selected ?? "No file selected"}</TextSwap>
        </span>
      </div>
    </DemoFrame>
  );
}

function countFiles(nodes: TreeNode[]): number {
  return nodes.reduce((n, node) => n + (node.children ? countFiles(node.children) : 1), 0);
}
