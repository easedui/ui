"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "../button/button";
import { MacDesktop } from "../lib/mac-desktop";
import { Segmented } from "../segmented/segmented";
import { MacHud, MacHudIcon, useMacHud, type MacHudKind, type MacHudVariant } from "./mac-hud";

type Levels = Record<MacHudKind, number> & { muted: boolean };

const VARIANTS = [
  { value: "classic", label: "Classic" },
  { value: "pill", label: "Pill" },
] as const;

// macOS moves a level one segment (1/16) per press, or a quarter segment with ⌥⇧ held.
const QUARTERS = 64;
// Close to macOS's default key repeat: a pause, then about twelve steps a second.
const DELAY = 400;
const REPEAT = 80;

/*
 * The keys sit 6px apart, so a mouse gets the 32px key alone. On touch they take the 44px
 * target: neighbours' areas meet only in the gap, never over each other's key.
 */
const TOUCH_TARGET = "pointer-coarse:hit-area";

const ARROWS: Record<string, [MacHudKind, 1 | -1]> = {
  ArrowUp: ["volume", 1],
  ArrowDown: ["volume", -1],
  ArrowRight: ["brightness", 1],
  ArrowLeft: ["brightness", -1],
};

export function MacHudDemo() {
  const [variant, setVariant] = useState<MacHudVariant>("classic");
  const { hud, show } = useMacHud();
  const levels = useRef<Levels>({ volume: 0.5, brightness: 0.75, keyboard: 0.5, muted: false });
  const hold = useHold();

  const showLevel = useCallback(
    (kind: MacHudKind) => {
      const l = levels.current;
      show(kind, l[kind], { muted: kind === "volume" && l.muted });
    },
    [show],
  );

  // Pressing a volume key unmutes, as on a Mac.
  const nudge = useCallback(
    (kind: MacHudKind, dir: 1 | -1, fine = false) => {
      const l = levels.current;
      l[kind] = Math.min(QUARTERS, Math.max(0, Math.round(l[kind] * QUARTERS) + dir * (fine ? 1 : 4))) / QUARTERS;
      if (kind === "volume") l.muted = false;
      showLevel(kind);
    },
    [showLevel],
  );

  const mute = () => {
    levels.current.muted = !levels.current.muted;
    showLevel("volume");
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) return;
    const arrow = ARROWS[e.key];
    if (arrow) {
      e.preventDefault();
      nudge(arrow[0], arrow[1], e.altKey && e.shiftKey);
    } else if (e.key.toLowerCase() === "m" && !e.repeat) {
      mute();
    }
  };

  const key = (kind: MacHudKind, dir: 1 | -1) => (fine: boolean) => nudge(kind, dir, fine);

  return (
    <MacDesktop
      app="Music"
      menus={["File", "Edit", "Song", "View"]}
      footer={
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line-subtle px-(--pad) py-3">
          <Segmented
            aria-label="HUD style"
            // Segments are 26px tall; on touch each gets the 44px target without growing.
            className="pointer-coarse:[&>button]:hit-area"
            options={VARIANTS}
            value={variant}
            onValueChange={(v) => {
              setVariant(v);
              showLevel(hud.kind);
            }}
          />
          <div className="flex items-center gap-2" onKeyDown={onKeyDown}>
            <KeyGroup label="Display brightness">
              <MediaKey label="Brightness down" hold={hold} onPress={key("brightness", -1)}>
                <MacHudIcon kind="brightness" value={0} className="size-4" />
              </MediaKey>
              <MediaKey label="Brightness up" hold={hold} onPress={key("brightness", 1)}>
                <MacHudIcon kind="brightness" value={1} className="size-4" />
              </MediaKey>
            </KeyGroup>
            <KeyGroup label="Keyboard brightness" className="@max-sm:hidden">
              <MediaKey label="Keyboard brightness down" hold={hold} onPress={key("keyboard", -1)}>
                <MacHudIcon kind="keyboard" value={0} className="size-4" />
              </MediaKey>
              <MediaKey label="Keyboard brightness up" hold={hold} onPress={key("keyboard", 1)}>
                <MacHudIcon kind="keyboard" value={1} className="size-4" />
              </MediaKey>
            </KeyGroup>
            <KeyGroup label="Volume">
              <Button variant="secondary" size="icon-sm" hitArea={false} className={TOUCH_TARGET} aria-label="Mute" onClick={mute}>
                <MacHudIcon kind="volume" value={0} muted className="size-4" />
              </Button>
              <MediaKey label="Volume down" hold={hold} onPress={key("volume", -1)}>
                <MacHudIcon kind="volume" value={0.3} className="size-4" />
              </MediaKey>
              <MediaKey label="Volume up" hold={hold} onPress={key("volume", 1)}>
                <MacHudIcon kind="volume" value={1} className="size-4" />
              </MediaKey>
            </KeyGroup>
          </div>
        </div>
      }
    >
      {/* The desktop under the menu bar: the pill sits 12px below it, the classic HUD centres. */}
      <div
        tabIndex={0}
        role="group"
        aria-label="Desktop. Arrow keys change volume and brightness, M mutes."
        onKeyDown={onKeyDown}
        className="absolute inset-0 focus-ring [outline-offset:-2px]"
      >
        <MacHud {...hud} variant={variant} position="absolute" />
      </div>
    </MacDesktop>
  );
}

function KeyGroup({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className={`flex gap-1.5 ${className}`}>
      {children}
    </div>
  );
}

type Hold = ReturnType<typeof useHold>;

/** A media key: fires on press, then repeats while held. Enter repeats through the keyboard's own auto-repeat. */
function MediaKey({ label, hold, onPress, children }: { label: string; hold: Hold; onPress: (fine: boolean) => void; children: ReactNode }) {
  return (
    <Button
      variant="secondary"
      size="icon-sm"
      hitArea={false}
      className={TOUCH_TARGET}
      aria-label={label}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        const fine = e.altKey && e.shiftKey;
        hold.start(() => onPress(fine));
      }}
      onPointerUp={hold.stop}
      onPointerLeave={hold.stop}
      onPointerCancel={hold.stop}
      // Pointer presses already fired on pointer down; detail 0 is a keyboard click.
      onClick={(e) => {
        if (e.detail === 0) onPress(e.altKey && e.shiftKey);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </Button>
  );
}

/** Fire once now, again after DELAY, then every REPEAT ms until stopped. */
function useHold() {
  const timer = useRef<number | undefined>(undefined);
  const stop = useCallback(() => {
    window.clearTimeout(timer.current);
    window.clearInterval(timer.current);
  }, []);
  const start = useCallback(
    (action: () => void) => {
      stop();
      action();
      timer.current = window.setTimeout(() => {
        timer.current = window.setInterval(action, REPEAT);
      }, DELAY);
    },
    [stop],
  );
  useEffect(() => {
    window.addEventListener("blur", stop);
    return () => {
      stop();
      window.removeEventListener("blur", stop);
    };
  }, [stop]);
  return { start, stop };
}
