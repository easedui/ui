/**
 * The macOS look for the Eased Mac pack: system type, translucent "vibrancy" materials and
 * hairlines, in light and dark. Motion stays Eased's (`./motion`); only the material and the
 * geometry follow macOS, so a Mac component still moves like the rest of the library.
 *
 *   macFont          the San Francisco stack, at macOS's 13px body size
 *   macMaterial      frosted panel: translucent tint + backdrop blur/saturate, hairline, shadow
 *   MAC_RADIUS       corner radii macOS uses for popovers, HUDs and controls (px)
 *
 * Dark follows Eased's convention: a `.dark` class or `data-theme="dark"` on an ancestor.
 *
 * Inside a Tauri/Electron window that already draws native vibrancy (Tauri `windowEffects`,
 * `window-vibrancy`, Electron `vibrancy`), pass `"native"`: the CSS blur and tint drop out so
 * the real material shows through, and the hairline stays.
 */

/** -apple-system resolves to SF Pro on Apple platforms; elsewhere the platform UI font. */
export const macFont = "font-[-apple-system,BlinkMacSystemFont,system-ui,sans-serif] text-[13px] leading-[16px] antialiased";

/** `css` approximates vibrancy in the browser; `native` leaves it to the window behind. */
export type MacMaterialMode = "css" | "native";

/** The materials the pack draws, after the NSVisualEffectView materials they stand in for. */
export type MacMaterialKind = "popover" | "hud";

/*
 * Values are measured approximations of macOS's materials (estimates, not Apple constants):
 * popover ≈ NSVisualEffectView.Material.popover, hud ≈ .hudWindow. Every class is written out
 * in full (no string building) so Tailwind finds it; dark repeats each one under `in-[.dark]:`
 * and `in-data-[theme=dark]:`.
 */
const FILL: Record<MacMaterialKind, string> = {
  popover:
    "bg-[rgb(236_236_236/0.72)] in-[.dark]:bg-[rgb(44_44_46/0.72)] in-data-[theme=dark]:bg-[rgb(44_44_46/0.72)] backdrop-blur-[40px] backdrop-saturate-[1.8]",
  hud: "bg-[rgb(240_240_240/0.78)] in-[.dark]:bg-[rgb(30_30_30/0.72)] in-data-[theme=dark]:bg-[rgb(30_30_30/0.72)] backdrop-blur-[30px] backdrop-saturate-[1.5]",
};

/** Half-pixel hairline as an inset ring, so it never changes the box size. */
const HAIRLINE =
  "shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.15)] in-[.dark]:shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.14)] in-data-[theme=dark]:shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.14)]";

/**
 * The same hairline as an SVG stroke colour, for shapes a box-shadow can't follow (the popover's
 * arrow). Stroke 1px along the clip edge: the clip keeps the inner half, a 0.5px hairline.
 */
export const macHairlineStroke =
  "stroke-[rgb(0_0_0/0.15)] in-[.dark]:stroke-[rgb(255_255_255/0.14)] in-data-[theme=dark]:stroke-[rgb(255_255_255/0.14)]";

/** Text colours on the materials: macOS's label and secondaryLabel. */
export const macText =
  "text-[rgb(0_0_0/0.85)] in-[.dark]:text-[rgb(255_255_255/0.85)] in-data-[theme=dark]:text-[rgb(255_255_255/0.85)]";
export const macTextSecondary =
  "text-[rgb(0_0_0/0.5)] in-[.dark]:text-[rgb(255_255_255/0.55)] in-data-[theme=dark]:text-[rgb(255_255_255/0.55)]";

/**
 * Classes for a frosted macOS surface. Add a radius and padding. The outer drop shadow is
 * separate (`macShadow`) because a clip-path shape (the popover's arrow) clips box-shadow.
 * Pass `hairline: false` when the shape draws its own (`macHairlineStroke`).
 */
export function macMaterial(kind: MacMaterialKind, mode: MacMaterialMode = "css", { hairline = true }: { hairline?: boolean } = {}) {
  return `${mode === "native" ? "" : FILL[kind]} ${hairline ? HAIRLINE : ""} ${macText}`;
}

/**
 * The floating shadow for a popover-like surface, as a filter so it follows clip-path shapes.
 * Put it on a sibling layer behind the surface, never an ancestor: a `filter` (or opacity < 1)
 * on an ancestor stops the surface's backdrop blur from seeing the page behind it.
 */
export const macShadow =
  "drop-shadow-[0_8px_24px_rgb(0_0_0/0.22)] in-[.dark]:drop-shadow-[0_8px_24px_rgb(0_0_0/0.45)] in-data-[theme=dark]:drop-shadow-[0_8px_24px_rgb(0_0_0/0.45)]";

/** Corner radii in px (measured on macOS 14–15; macOS 26 rounds popovers to ~16). */
export const MAC_RADIUS = { popover: 11, hud: 18, pill: 9999, control: 6 } as const;
