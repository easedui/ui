"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "../button/button";
import { Input } from "../input/input";
import { DemoFrame } from "../lib/demo-frame";
import { rowGrid, rowGridRow } from "../lib/layout";
import { Segmented } from "../segmented/segmented";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

type Scope = "read" | "write" | "admin";
type Key = { id: string; name: string; prefix: string; scope: Scope; created: Date };

const SCOPE_LABEL: Record<Scope, string> = { read: "Read only", write: "Read, write", admin: "Admin" };

const day = (offset: number) => new Date(Date.UTC(2026, 9, 18 - offset));
const KEYS: Key[] = [
  { id: "k1", name: "Production", prefix: "nw_live_8f2c", scope: "write", created: day(41) },
  { id: "k2", name: "Staging", prefix: "nw_test_31aa", scope: "admin", created: day(12) },
  { id: "k3", name: "Metabase sync", prefix: "nw_live_c90e", scope: "read", created: day(3) },
];

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function DialogDemo() {
  const [keys, setKeys] = useState(KEYS);

  return (
    <DemoFrame title="API keys" meta={`${keys.length} active`} actions={<NewKeyDialog onCreate={(k) => setKeys((list) => [...list, k])} />}>
      <div className="flex min-h-0 flex-1 flex-col px-(--pad) pt-4">
        <p className="text-ui-sm text-pretty text-text-secondary">Keys act as your workspace. Revoking one stops every request that uses it.</p>
        <ul className={`${rowGrid} mt-3 -mx-2 gap-x-3 overflow-y-auto [--col:auto]`} aria-label="API keys">
          {keys.map((k) => (
            <li key={k.id} className={`${rowGridRow} h-14 rounded-control px-2 hover-fine:bg-surface-hover [transition:background-color_150ms_var(--eased-ease-standard)]`}>
              <KeyIcon />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-ui-sm font-medium text-text">{k.name}</span>
                <span className="truncate text-ui-xs text-text-muted">
                  <span className="font-mono slashed-zero">{k.prefix}…</span> · {SCOPE_LABEL[k.scope]} · {dateFmt.format(k.created)}
                </span>
              </span>
              <RevokeDialog name={k.name} onRevoke={() => setKeys((list) => list.filter((x) => x.id !== k.id))} />
            </li>
          ))}
          {keys.length === 0 && (
            <li className="col-span-full flex h-28 flex-col items-center justify-center gap-1 text-center">
              <span className="text-ui-sm text-text">No active keys</span>
              <span className="text-ui-xs text-text-muted">Create one to call the API.</span>
            </li>
          )}
        </ul>
      </div>
    </DemoFrame>
  );
}

/** The create dialog. Cancelling with a name typed asks first, in a nested alert dialog. */
function NewKeyDialog({ onCreate }: { onCreate: (k: Key) => void }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<Scope>("read");

  const reset = () => {
    setName("");
    setScope("read");
  };
  const dirty = name.trim().length > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    const hex = Math.random().toString(16).slice(2, 6);
    onCreate({ id: crypto.randomUUID(), name: name.trim(), prefix: `nw_live_${hex}`, scope, created: day(0) });
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing with a name typed (Esc, outside click, Cancel) asks first.
        if (!next && dirty) return setConfirm(true);
        setOpen(next);
      }}
      onOpenChangeComplete={(o) => !o && reset()}
    >
      <DialogTrigger variant="primary">New key</DialogTrigger>
      <DialogContent>
        <DialogTitle>Create API key</DialogTitle>
        <DialogDescription>The secret is shown once, right after you create it.</DialogDescription>
        <form onSubmit={submit}>
          <DialogBody className="gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={id} className="text-ui-sm font-medium text-text">
                Name
              </label>
              <Input id={id} value={name} onValueChange={setName} placeholder="e.g. Zapier export" autoComplete="off" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span id={`${id}-scope`} className="text-ui-sm font-medium text-text">
                Permissions
              </span>
              <Segmented
                aria-labelledby={`${id}-scope`}
                className="self-start"
                options={[
                  { value: "read", label: "Read" },
                  { value: "write", label: "Write" },
                  { value: "admin", label: "Admin" },
                ]}
                value={scope}
                onValueChange={(v) => setScope(v as Scope)}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button size="md" />}>Cancel</DialogClose>
            <Button type="submit" variant="primary" size="md" disabled={!dirty}>
              Create key
            </Button>
          </DialogFooter>
        </form>

        <AlertDialog open={confirm} onOpenChange={setConfirm}>
          <AlertDialogContent>
            <AlertDialogTitle>Discard this key?</AlertDialogTitle>
            <AlertDialogDescription>“{name.trim()}” hasn’t been created yet.</AlertDialogDescription>
            <DialogFooter>
              <AlertDialogClose render={<Button size="md" />}>Keep editing</AlertDialogClose>
              <Button
                variant="danger-solid"
                size="md"
                onClick={() => {
                  setConfirm(false);
                  setOpen(false);
                }}
              >
                Discard
              </Button>
            </DialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

function RevokeDialog({ name, onRevoke }: { name: string; onRevoke: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger variant="ghost" edge="end">
        Revoke
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Revoke “{name}”?</AlertDialogTitle>
        <AlertDialogDescription>Requests signed with this key start failing within a minute. This can’t be undone.</AlertDialogDescription>
        <DialogFooter>
          <AlertDialogClose render={<Button size="md" />}>Cancel</AlertDialogClose>
          <AlertDialogClose render={<Button variant="danger-solid" size="md" onClick={onRevoke} />}>Revoke key</AlertDialogClose>
        </DialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function KeyIcon() {
  return (
    <span aria-hidden className="flex size-8 items-center justify-center rounded-control-sm bg-surface-sunken text-text-muted">
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5.5" cy="10.5" r="2.75" />
        <path d="m7.5 8.5 5.5-5.5M11 5l1.5 1.5M9.5 6.5 11 8" />
      </svg>
    </span>
  );
}
