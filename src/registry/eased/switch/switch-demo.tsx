"use client";

import { useState } from "react";
import { DemoFrame } from "../lib/demo-frame";
import { Switch } from "./switch";

/** Notification settings: label and description on the left, switches on one right edge. */
export function SwitchDemo() {
  const [digest, setDigest] = useState(true);
  return (
    <DemoFrame title="Notifications" meta={digest ? "Digest on Mondays" : "No digest"}>
      <div className="flex min-h-0 flex-1 flex-col divide-y divide-line-subtle overflow-y-auto px-(--pad)">
        <Switch defaultChecked description="Replies and @mentions in threads you follow." className="py-3.5">
          Comments and mentions
        </Switch>
        <Switch checked={digest} onCheckedChange={setDigest} description="A summary of the week, every Monday at 9:00." className="py-3.5">
          Weekly digest
        </Switch>
        <Switch description="New features and changelog posts, about twice a month." className="py-3.5">
          Product updates
        </Switch>
        <Switch defaultChecked disabled description="Required for workspace owners." className="py-3.5">
          Sign-in alerts
        </Switch>
      </div>
    </DemoFrame>
  );
}
