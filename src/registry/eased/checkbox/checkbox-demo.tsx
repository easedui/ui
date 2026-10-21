"use client";

import { useState } from "react";
import { DemoFrame } from "../lib/demo-frame";
import { Checkbox, CheckboxGroup } from "./checkbox";

const COLUMNS = [
  { value: "invoice", label: "Invoice number" },
  { value: "customer", label: "Customer" },
  { value: "amount", label: "Amount" },
  { value: "status", label: "Status" },
  { value: "due", label: "Due date" },
];

/** An export dialog: "All columns" fills, dashes and clears as the columns below change. */
export function CheckboxDemo() {
  const [value, setValue] = useState<string[]>(["invoice", "amount", "status"]);
  return (
    <DemoFrame title="Export to CSV" meta={`${value.length} of ${COLUMNS.length} columns`}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-(--pad) py-3">
        <CheckboxGroup aria-label="Columns" value={value} onValueChange={setValue} allValues={COLUMNS.map((c) => c.value)}>
          <Checkbox parent>All columns</Checkbox>
          <div className="ms-1.5 flex flex-col border-s border-line-subtle ps-4">
            {COLUMNS.map((c) => (
              <Checkbox key={c.value} value={c.value}>
                {c.label}
              </Checkbox>
            ))}
          </div>
        </CheckboxGroup>
        <div className="flex flex-col border-t border-line-subtle pt-3">
          <Checkbox defaultChecked description="Adds a row with the total of each number column.">
            Include totals
          </Checkbox>
          <Checkbox disabled description="Available on the Business plan.">
            Schedule a weekly export
          </Checkbox>
        </div>
      </div>
    </DemoFrame>
  );
}
