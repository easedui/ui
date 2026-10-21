"use client";

import { useId, useState } from "react";
import { Avatar } from "../avatar/avatar";
import { Badge } from "../badge/badge";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import { Progress } from "../progress/progress";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardLink, CardTitle } from "./card";

const PROJECTS = [
  { name: "northwind-web", env: "Production", deployed: "Deployed 4m ago" },
  { name: "billing-api", env: "Preview", deployed: "Deployed 2h ago" },
] as const;

const ACTIVITY = [
  { who: "Maya Chen", what: "deployed northwind-web to production", when: "4m" },
  { who: "Jonas Weber", what: "invited priya@northwind.com", when: "38m" },
  { who: "Priya Raman", what: "rotated the Stripe API key", when: "2h" },
  { who: "Maya Chen", what: "opened a preview for billing-api", when: "2h" },
  { who: "Tom Okafor", what: "raised the seat limit to 12", when: "Yesterday" },
  { who: "Jonas Weber", what: "connected the GitHub app", when: "Oct 18" },
] as const;

/** A workspace overview: a plan card with an action, a plain stat, two project link cards and an activity card that grows. */
export function CardDemo() {
  const [all, setAll] = useState(false);
  const listId = useId();
  const shown = all ? ACTIVITY : ACTIVITY.slice(0, 3);

  return (
    <DemoFrame title="Northwind" height={600}>
      <div className="grid min-h-0 flex-1 auto-rows-min content-start gap-3 overflow-y-auto p-(--pad) [scrollbar-width:thin] @min-[36rem]:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Pro plan</CardTitle>
            <CardDescription>Renews Nov 1 for $249.00</CardDescription>
            <CardAction>
              <Button size="sm">Manage</Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Progress label="9 of 12 seats used" value={9} max={12} showValue={false} size="sm" />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Uptime</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="flex items-baseline justify-between gap-3">
            <p className="text-display-2xl font-semibold tabular-nums">99.98%</p>
            <p className="min-w-0 text-ui-sm text-text-muted text-pretty">1 incident, 14 min</p>
          </CardContent>
        </Card>

        {PROJECTS.map((p) => (
          <Card key={p.name} size="sm">
            <CardHeader>
              <CardTitle className="font-mono">
                <CardLink href={`#${p.name}`} onClick={(e) => e.preventDefault()}>
                  {p.name}
                </CardLink>
              </CardTitle>
              <CardDescription>{p.deployed}</CardDescription>
              <CardAction>
                <Badge tone={p.env === "Production" ? "success" : "neutral"} dot>
                  {p.env}
                </Badge>
              </CardAction>
            </CardHeader>
          </Card>
        ))}

        <Card size="sm" autoHeight className="@min-[36rem]:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Changes to this workspace, newest first</CardDescription>
          </CardHeader>
          <CardContent>
            <ul id={listId} className="flex flex-col">
              {shown.map((a, i) => (
                <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-2">
                  <Avatar name={a.who} size="sm" />
                  <p className="min-w-0 truncate text-text-secondary">
                    <span className="font-medium text-text">{a.who}</span> {a.what}
                  </p>
                  <span className="text-ui-sm text-text-muted tabular-nums">{a.when}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button size="sm" variant="ghost" edge="start" aria-expanded={all} aria-controls={listId} onClick={() => setAll(!all)}>
              {all ? "Show fewer" : `Show all ${ACTIVITY.length}`}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DemoFrame>
  );
}
