"use client";

import { useState } from "react";
import { FieldLabel, FieldRoot } from "../_primitives/field/field";
import { teamMembers, type Member } from "../_primitives/fixtures/saas";
import { Avatar } from "../avatar/avatar";
import { DemoFrame } from "../lib/demo-frame";
import { rowGrid, rowGridRow } from "../lib/layout";
import { Select, type SelectOption, type SelectOptionGroup } from "./select";

const REGIONS: SelectOptionGroup<string>[] = [
  {
    label: "Americas",
    items: [
      { value: "us-east", label: "US East (Virginia)" },
      { value: "us-west", label: "US West (Oregon)" },
      { value: "sa-east", label: "South America (São Paulo)" },
    ],
  },
  {
    label: "Europe",
    items: [
      { value: "eu-west", label: "EU West (Dublin)" },
      { value: "eu-central", label: "EU Central (Frankfurt)" },
    ],
  },
  {
    label: "Asia Pacific",
    items: [
      { value: "ap-southeast", label: "Singapore" },
      { value: "ap-northeast", label: "Tokyo" },
      { value: "ap-south", label: "Sydney", disabled: true, description: "Opens in January" },
    ],
  },
];

const ZONES = [
  "Pacific/Honolulu",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Helsinki",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

// "Berlin (GMT+2)", from Intl, on the fixtures' date so the offsets don't drift with DST.
const offsetOf = (timeZone: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" })
    .formatToParts(Date.UTC(2026, 9, 18, 14, 30))
    .find((p) => p.type === "timeZoneName")?.value ?? "GMT";

const TIMEZONES: SelectOption<string>[] = ZONES.map((zone) => ({
  value: zone,
  label: `${zone.split("/")[1].replace(/_/g, " ")} (${offsetOf(zone)})`,
}));

const ROLES: SelectOption<Member["role"]>[] = [
  { value: "Owner", label: "Owner" },
  { value: "Admin", label: "Admin" },
  { value: "Member", label: "Member" },
  { value: "Viewer", label: "Viewer" },
];

export function SelectDemo() {
  const [members, setMembers] = useState(() => teamMembers.slice(0, 3));

  return (
    <DemoFrame title="Workspace settings" meta="Orbit">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-(--pad) py-5">
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
          <FieldRoot name="region">
            <FieldLabel nativeLabel={false} render={<div />}>
              Data region
            </FieldLabel>
            <Select items={REGIONS} defaultValue="eu-west" />
          </FieldRoot>
          <FieldRoot name="timezone">
            <FieldLabel nativeLabel={false} render={<div />}>
              Timezone
            </FieldLabel>
            <Select items={TIMEZONES} defaultValue="Europe/Berlin" />
          </FieldRoot>
        </div>

        <section className="flex flex-col gap-1.5">
          <h3 className="text-ui font-medium text-text">Members</h3>
          {/* --col is the role column: every role select has one width and one x (R102, R108). */}
          <ul className={`${rowGrid} gap-x-3 [--col:7rem]`}>
            {members.map((m) => (
              <li key={m.id} className={`${rowGridRow} h-11`}>
                <Avatar name={m.name} size="md" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-ui-sm text-text">{m.name}</span>
                  <span className="truncate text-ui-xs text-text-muted">{m.email}</span>
                </span>
                <Select
                  items={ROLES}
                  size="sm"
                  value={m.role}
                  disabled={m.role === "Owner"}
                  aria-label={`Role for ${m.name}`}
                  onValueChange={(role) => role && setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, role } : x)))}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </DemoFrame>
  );
}
