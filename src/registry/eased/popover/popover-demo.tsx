"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Avatar } from "../avatar/avatar";
import { Button } from "../button/button";
import { Input } from "../input/input";
import { DemoFrame } from "../lib/demo-frame";
import { rowGrid, rowGridRow } from "../lib/layout";
import { TextSwap } from "../text-swap/text-swap";
import { Popover, PopoverClose, PopoverContent, PopoverDescription, PopoverFooter, PopoverTitle, PopoverTrigger } from "./popover";

type Person = { name: string; email: string; role: "Owner" | "Can edit" | "Can view" };

const PEOPLE: Person[] = [
  { name: "Mara Lindqvist", email: "mara@northwind.io", role: "Owner" },
  { name: "Devon Okafor", email: "devon@northwind.io", role: "Can edit" },
];

export function PopoverDemo() {
  const [people, setPeople] = useState(PEOPLE);

  return (
    <DemoFrame
      title="Q3 launch plan"
      meta={`${people.length} people`}
      actions={
        <Popover>
          <PopoverTrigger>
            <ShareIcon />
            Share
          </PopoverTrigger>
          {/* --col is the Invite button's width and the role column's, so the roles start under it. */}
          <PopoverContent align="end" className="[--col:5.5rem]">
            <SharePanel people={people} onInvite={(p) => setPeople((list) => [...list, p])} />
          </PopoverContent>
        </Popover>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-5">
        <div className="flex flex-col gap-2">
          <p className="text-ui-md font-medium text-text">Goals</p>
          <p className="text-ui text-pretty text-text-secondary">
            Ship offline sync to every workspace, cut first-load time under 1.2s and open the API to the waitlist.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          {[
            ["Offline sync GA", "Aug 14"],
            ["Perf budget in CI", "Aug 28"],
            ["Public API beta", "Sep 18"],
          ].map(([label, date]) => (
            <div key={label} className="flex items-center justify-between gap-3 text-ui-sm">
              <span className="flex min-w-0 items-center gap-2 text-text">
                <span aria-hidden className="size-1.5 shrink-0 rounded-pill bg-text-muted" />
                <span className="truncate">{label}</span>
              </span>
              <span className="shrink-0 text-text-muted tabular-nums">{date}</span>
            </div>
          ))}
        </div>
      </div>
    </DemoFrame>
  );
}

function SharePanel({ people, onInvite }: { people: Person[]; onInvite: (p: Person) => void }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const invite = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const address = email.trim().toLowerCase();
    const name = address.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    onInvite({ name, email: address, role: "Can view" });
    setEmail("");
  };

  const copy = () => {
    void navigator.clipboard?.writeText("https://northwind.io/d/q3-launch").catch(() => {});
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <>
      <PopoverTitle>Share “Q3 launch plan”</PopoverTitle>
      <PopoverDescription>People you invite can view and comment.</PopoverDescription>

      <form onSubmit={invite} className="mt-4 flex gap-2">
        <label htmlFor={id} className="sr-only">
          Email address
        </label>
        <Input
          id={id}
          type="email"
          size="sm"
          value={email}
          onValueChange={setEmail}
          placeholder="name@company.com"
          autoComplete="off"
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={!valid} className="w-(--col)">
          Invite
        </Button>
      </form>

      <ul className={`${rowGrid} mt-3 max-h-36 gap-x-2.5 overflow-y-auto`} aria-label="People with access">
        {people.map((p) => (
          <li key={p.email} className={`${rowGridRow} h-11`}>
            <Avatar name={p.name} size="md" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-ui-sm text-text">{p.name}</span>
              <span className="truncate text-ui-xs text-text-muted">{p.email}</span>
            </span>
            <span className="truncate text-ui-xs text-text-muted">{p.role}</span>
          </li>
        ))}
      </ul>

      <PopoverFooter>
        <Button variant="ghost" size="sm" edge="start" onClick={copy}>
          <LinkIcon />
          <TextSwap>{copied ? "Copied" : "Copy link"}</TextSwap>
          <span className="sr-only" aria-live="polite">
            {copied ? "Link copied" : ""}
          </span>
        </Button>
        <PopoverClose render={<Button variant="primary" size="sm" />}>Done</PopoverClose>
      </PopoverFooter>
    </>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 10V2.5M5 5.25 8 2.25l3 3M3.5 8.5v3.75c0 .7.55 1.25 1.25 1.25h6.5c.7 0 1.25-.55 1.25-1.25V8.5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 9a2.5 2.5 0 0 0 3.5 0l2-2A2.5 2.5 0 0 0 9 3.5l-.5.5M9 7a2.5 2.5 0 0 0-3.5 0l-2 2A2.5 2.5 0 0 0 7 12.5l.5-.5" />
    </svg>
  );
}
