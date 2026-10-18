"use client";

import { DemoFrame } from "../lib/demo-frame";
import { CodeBlock } from "./code-block";

const HOOK = `import { useEffect, useRef, useState } from "react";

/**
 * The value, but only once it has stopped changing for \`delay\` ms.
 * Use it to search as someone types without a request per keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [settled, setSettled] = useState(value);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = window.setTimeout(() => setSettled(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return settled;
}

// Usage
export function SearchUsers() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 300);
  const { data, isLoading } = useUsers({ search: debounced });

  return (
    <SearchField value={query} onValueChange={setQuery} busy={isLoading}>
      {data?.map((user) => <UserRow key={user.id} user={user} />)}
    </SearchField>
  );
}
`;

/** A docs page excerpt: a 38-line hook with its key lines highlighted, collapsed after 12. */
export function CodeBlockDemo() {
  return (
    <DemoFrame>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
        <h3 className="text-ui font-medium text-text">Debounce a value</h3>
        <p className="mt-1 text-ui-sm text-pretty text-text-secondary">
          The search waits for a pause in typing. Lines 7–8 keep the settled value; the timer is further down.
        </p>
        <CodeBlock
          className="mt-3 rounded-control"
          title="use-debounced-value.ts"
          code={HOOK}
          lineNumbers
          highlight="7-8, 16-17"
          collapseAfter={12}
        />
      </div>
    </DemoFrame>
  );
}
