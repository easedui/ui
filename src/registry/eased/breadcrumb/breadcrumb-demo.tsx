"use client";

import { useState } from "react";
import { DemoFrame } from "../lib/demo-frame";
import { Breadcrumb, type BreadcrumbItem } from "./breadcrumb";

type Node = { name: string; modified: string; children?: Node[]; size?: string };

const TREE: Node = {
  name: "Acme",
  modified: "",
  children: [
    {
      name: "Marketing",
      modified: "Oct 16",
      children: [
        {
          name: "Website redesign",
          modified: "Oct 17",
          children: [
            {
              name: "Design files",
              modified: "Oct 17",
              children: [
                {
                  name: "Homepage",
                  modified: "Today",
                  children: [
                    { name: "Hero light.fig", modified: "Today", size: "4.2 MB" },
                    { name: "Hero dark.fig", modified: "Today", size: "4.4 MB" },
                    { name: "Pricing table.fig", modified: "Yesterday", size: "1.8 MB" },
                    { name: "Footer.fig", modified: "Oct 14", size: "640 KB" },
                    { name: "Nav.fig", modified: "Oct 15", size: "310 KB" },
                    { name: "Testimonials.fig", modified: "Oct 15", size: "920 KB" },
                    { name: "CTA band.fig", modified: "Oct 13", size: "410 KB" },
                    { name: "Icons.fig", modified: "Oct 9", size: "1.1 MB" },
                  ],
                },
                { name: "Product pages", modified: "Oct 15", children: [{ name: "Overview.fig", modified: "Oct 15", size: "3.1 MB" }] },
                { name: "Brand assets", modified: "Oct 9", children: [{ name: "Logo kit.zip", modified: "Oct 9", size: "12 MB" }] },
              ],
            },
            { name: "Copy deck.docx", modified: "Oct 12", size: "88 KB" },
            { name: "Launch plan.pdf", modified: "Oct 10", size: "1.2 MB" },
          ],
        },
        { name: "Q4 campaign", modified: "Oct 2", children: [{ name: "Brief.pdf", modified: "Oct 2", size: "320 KB" }] },
      ],
    },
    { name: "Finance", modified: "Oct 11", children: [{ name: "Budget 2027.xlsx", modified: "Oct 11", size: "210 KB" }] },
  ],
};

const Folder = () => (
  <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
    <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.6l1.4 1.5h5A1.5 1.5 0 0 1 14 6v5.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5v-7Z" />
  </svg>
);

const File = () => (
  <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
    <path d="M4 1.75h5L12.5 5.25v8a1 1 0 0 1-1 1h-7.5a1 1 0 0 1-1-1V2.75a1 1 0 0 1 1-1Z M9 1.75v3.5h3.5" />
  </svg>
);

const Logo = () => (
  <span className="flex size-4 items-center justify-center rounded-control-2xs bg-brand text-ui-2xs font-semibold text-text-on-brand">A</span>
);

// Starts five folders deep, so a narrow tile has something to fold.
const START = ["Marketing", "Website redesign", "Design files", "Homepage"];

export function BreadcrumbDemo() {
  const [path, setPath] = useState<string[]>(START);

  const trail: Node[] = [TREE];
  for (const name of path) trail.push(trail.at(-1)!.children!.find((c) => c.name === name)!);
  const here = trail.at(-1)!;

  const items: BreadcrumbItem[] = trail.map((node, i) => ({
    label: node.name,
    icon: i === 0 ? <Logo /> : undefined,
    onClick: () => setPath(path.slice(0, i)),
  }));

  return (
    <DemoFrame>
      <div className="flex h-12 shrink-0 items-center border-b border-line-subtle px-(--pad)">
        <Breadcrumb items={items} aria-label="Folder" className="w-full" />
      </div>
      <ul className="grid min-h-0 flex-1 grid-cols-[1fr_auto] content-start overflow-y-auto px-2 py-2">
        {here.children?.map((node) => {
          const folder = !!node.children;
          const row = (
            <>
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="text-text-muted">{folder ? <Folder /> : <File />}</span>
                <span className="truncate text-ui text-text">{node.name}</span>
              </span>
              <span className="text-end text-ui-sm text-text-muted tabular-nums">{folder ? node.modified : node.size}</span>
            </>
          );
          return (
            <li key={node.name} className="col-span-2 grid grid-cols-subgrid">
              {folder ? (
                <button
                  type="button"
                  onClick={() => setPath([...path, node.name])}
                  className="col-span-2 grid h-10 cursor-pointer grid-cols-subgrid items-center gap-x-4 rounded-control px-2 text-start transition-colors duration-150 ease-standard focus-ring hover-fine:bg-surface-hover active:bg-surface-active"
                >
                  {row}
                </button>
              ) : (
                <div className="col-span-2 grid h-10 grid-cols-subgrid items-center gap-x-4 px-2">{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </DemoFrame>
  );
}
