"use client";

import { useChoice } from "../_primitives/code-core/choice";
import { PACKAGE_MANAGERS, packageCommand, type PackageManager } from "../code-tabs/code-tabs";
import { DemoFrame } from "../lib/demo-frame";
import { Segmented } from "../segmented/segmented";
import { Snippet } from "./snippet";

const OPTIONS = PACKAGE_MANAGERS.map((pm) => ({ value: pm, label: pm }));

/** An install card: pick a package manager (shared with every Code Tabs on the page) and both commands follow. */
export function SnippetDemo() {
  const [pm, setPm] = useChoice("package-manager", "pnpm", PACKAGE_MANAGERS);
  const manager = pm as PackageManager;
  return (
    <DemoFrame title="Install" actions={<Segmented options={OPTIONS} value={manager} onValueChange={setPm} aria-label="Package manager" />}>
      <ol className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
        <li className="flex min-w-0 flex-col gap-2">
          <div>
            <p className="text-ui font-medium text-text">Add the component</p>
            <p className="text-ui-sm text-text-secondary">Copies the source into components/eased.</p>
          </div>
          <Snippet className="self-start" text={packageCommand(manager, { dlx: "shadcn@latest add https://eased.dev/r/code-block.json" })} />
        </li>
        <li className="flex min-w-0 flex-col gap-2">
          <div>
            <p className="text-ui font-medium text-text">Start your dev server</p>
            <p className="text-ui-sm text-text-secondary">Then open localhost:3000.</p>
          </div>
          <Snippet className="self-start" text={packageCommand(manager, { run: "dev" })} />
        </li>
        <li className="flex min-w-0 flex-col gap-2">
          <div>
            <p className="text-ui font-medium text-text">Or clone the starter</p>
            <p className="text-ui-sm text-text-secondary">A Next.js app with every free component.</p>
          </div>
          <Snippet className="self-start" text="git clone https://github.com/eased-dev/starter.git my-app" />
        </li>
      </ol>
    </DemoFrame>
  );
}
