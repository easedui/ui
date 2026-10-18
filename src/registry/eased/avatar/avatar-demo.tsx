"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "../badge/badge";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import { useScrollFades } from "../lib/dom";
import { enter, reducedFade, smooth, useSafeReducedMotion } from "../lib/motion";
import { Avatar, AvatarGroup } from "./avatar";

/** Generated portraits (soft gradient blobs), inlined so the demo needs no image host. */
function portrait(a: string, b: string, c: string, x: number, y: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><filter id="f"><feGaussianBlur stdDeviation="7"/></filter></defs><rect width="64" height="64" fill="${a}"/><g filter="url(#f)"><circle cx="${x}" cy="${y}" r="22" fill="${b}"/><circle cx="${64 - x}" cy="${64 - y * 0.6}" r="18" fill="${c}"/></g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

type Member = { id: string; name: string; email: string; role: "Owner" | "Admin" | "Member"; src?: string };

const TEAM: Member[] = [
  { id: "1", name: "Maya Okafor", email: "maya@northwind.studio", role: "Owner", src: portrait("#f4c9a8", "#e0795b", "#f7e3b5", 18, 20) },
  { id: "2", name: "Jonas Weber", email: "jonas@northwind.studio", role: "Admin", src: portrait("#b9d3e8", "#4e7fb3", "#d7ecd9", 44, 16) },
  { id: "3", name: "Priya Raman", email: "priya@northwind.studio", role: "Member" },
  { id: "4", name: "Leo Martín", email: "leo@northwind.studio", role: "Member", src: portrait("#d9cff1", "#8a6fd1", "#f2c6dc", 24, 40) },
  // A broken image: the initials take over at once instead of waiting out the delay.
  { id: "5", name: "Hana Sato", email: "hana@northwind.studio", role: "Member", src: "data:image/png;base64,broken" },
];

const INVITES: Member[] = [
  { id: "6", name: "Amara Diallo", email: "amara@northwind.studio", role: "Member", src: portrait("#cfe7d2", "#3f9466", "#f1e6a6", 40, 38) },
  { id: "7", name: "Tomás Rivera", email: "tomas@northwind.studio", role: "Member" },
  { id: "8", name: "Elif Kaya", email: "elif@northwind.studio", role: "Member", src: portrait("#f6d0d6", "#d0566e", "#fbe2c4", 20, 44) },
  { id: "9", name: "Noah Fischer", email: "noah@northwind.studio", role: "Member", src: portrait("#d2dcf0", "#5368b5", "#c9eef0", 46, 28) },
];

const ROLE_TONE = { Owner: "brand", Admin: "info", Member: "neutral" } as const;

export function AvatarDemo() {
  const reduced = useSafeReducedMotion();
  const [members, setMembers] = useState(TEAM);
  const next = INVITES.find((m) => !members.some((x) => x.id === m.id));
  const list = useRef<HTMLUListElement>(null);
  useScrollFades(list);

  // Bring a new member into view once it has been added (skipped on mount).
  const count = useRef(members.length);
  useEffect(() => {
    if (members.length > count.current) {
      list.current?.scrollTo({ top: list.current.scrollHeight, behavior: reduced ? "auto" : "smooth" });
    }
    count.current = members.length;
  }, [members.length, reduced]);

  return (
    <DemoFrame
      title="Members"
      meta={`${members.length} people`}
      actions={
        <Button size="sm" disabled={!next} onClick={() => next && setMembers((m) => [...m, next])}>
          Invite
        </Button>
      }
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <AvatarGroup aria-label="Northwind design team" max={5} size="md">
          {members.map((m) => (
            <Avatar key={m.id} name={m.name} src={m.src} />
          ))}
        </AvatarGroup>
        <p className="text-ui-sm text-text-muted">Hover the stack</p>
      </div>

      <ul
        ref={list}
        className="min-h-0 flex-1 overflow-y-auto p-1.5 pt-0 [mask-image:linear-gradient(to_bottom,transparent,#000_var(--fade-top,0px),#000_calc(100%-var(--fade-bottom,0px)),transparent)] [scrollbar-width:thin]"
      >
        <AnimatePresence initial={false}>
          {members.map((m) => (
            <motion.li
              key={m.id}
              layout
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={reduced ? reducedFade : { ...smooth, opacity: enter, filter: enter }}
              className="flex h-12 min-w-0 items-center gap-3 rounded-control px-2.5"
            >
              <Avatar name={m.name} src={m.src} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-ui-sm text-text">{m.name}</p>
                <p className="truncate text-ui-xs text-text-muted">{m.email}</p>
              </div>
              <Badge tone={ROLE_TONE[m.role]} className="min-w-16">{m.role}</Badge>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </DemoFrame>
  );
}
