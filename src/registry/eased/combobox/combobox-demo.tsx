"use client";

import { FieldLabel, FieldRoot } from "../_primitives/field/field";
import { Avatar } from "../avatar/avatar";
import { DemoFrame } from "../lib/demo-frame";
import { Combobox, type ComboboxOption, type ComboboxOptionGroup } from "./combobox";

const person = (value: string, label: string, team: string): ComboboxOption => ({
  value,
  label,
  detail: team,
  icon: <Avatar name={label} size="xs" />,
});

const PEOPLE: ComboboxOptionGroup[] = [
  {
    label: "Platform",
    items: [
      person("priya", "Priya Raman", "Platform"),
      person("jonas", "Jonas Lindqvist", "Platform"),
      person("mei", "Mei Tanaka", "Platform"),
    ],
  },
  {
    label: "Reliability",
    items: [
      person("adaeze", "Adaeze Okafor", "SRE"),
      person("lucas", "Lucas Moreau", "SRE"),
      person("rafael", "Rafael Ortiz", "On call"),
    ],
  },
  {
    label: "Product",
    items: [person("sofia", "Sofia Esposito", "Design"), person("noor", "Noor Haddad", "PM")],
  },
];

const dot = (tone: string) => <span className={`size-2 rounded-pill ${tone}`} />;

const LABELS: ComboboxOption[] = [
  { value: "bug", label: "bug", icon: dot("bg-danger") },
  { value: "deploys", label: "deploys", icon: dot("bg-brand") },
  { value: "flaky-test", label: "flaky-test", icon: dot("bg-warning") },
  { value: "performance", label: "performance", icon: dot("bg-info") },
  { value: "docs", label: "docs", icon: dot("bg-success") },
  { value: "needs-backport", label: "needs-backport", icon: dot("bg-text-muted") },
];

const REPOS: ComboboxOption[] = [
  { value: "deploy-api", label: "fathom/deploy-api", detail: "Go" },
  { value: "edge-router", label: "fathom/edge-router", detail: "Rust" },
  { value: "dashboard", label: "fathom/dashboard", detail: "TypeScript" },
  { value: "cli", label: "fathom/cli", detail: "Go" },
  { value: "docs", label: "fathom/docs", detail: "MDX" },
  { value: "terraform-modules", label: "fathom/terraform-modules", detail: "HCL" },
];

const flat = PEOPLE.flatMap((g) => g.items);

export function ComboboxDemo() {
  return (
    <DemoFrame title="Fix flaky deploy retries" meta="#482">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-(--pad) py-5">
        <FieldRoot name="repository">
          <FieldLabel>Repository</FieldLabel>
          <Combobox items={REPOS} defaultValue={REPOS[0]} placeholder="Search repositories" />
        </FieldRoot>
        <FieldRoot name="reviewers">
          <FieldLabel>Reviewers</FieldLabel>
          <Combobox
            multiple
            items={PEOPLE}
            defaultValue={[flat[0], flat[3]]}
            placeholder="Add reviewers"
            emptyText={(q) => `No one called “${q}” in Fathom`}
          />
        </FieldRoot>
        <FieldRoot name="labels">
          <FieldLabel>Labels</FieldLabel>
          <Combobox multiple items={LABELS} defaultValue={[LABELS[0], LABELS[2]]} placeholder="Add labels" />
        </FieldRoot>
      </div>
    </DemoFrame>
  );
}
