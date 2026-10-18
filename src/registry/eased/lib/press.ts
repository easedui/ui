/**
 * Press feedback as one class string per control size (rule 63). Colour moves at 150ms on
 * the standard curve; scale presses down in `--eased-duration-instant` and releases on the snappy
 * spring. Keyboard focus draws Eased's ring (`focus-ring`). Append your own colour classes;
 * do not add another `transition-*` class.
 *
 *   press      text buttons (`--eased-press-scale`, 0.97)
 *   pressIcon  icon buttons ≤ 48px (`--eased-press-scale-icon`, 0.96)
 *   pressWide  bars and cards > 220px (`--eased-press-scale-wide`, 0.985)
 */
const base =
  "[transition:color_150ms_var(--eased-ease-standard),background-color_150ms_var(--eased-ease-standard),border-color_150ms_var(--eased-ease-standard),opacity_150ms_var(--eased-ease-standard),scale_var(--eased-duration-spring-snappy)_var(--eased-spring-snappy),box-shadow_var(--eased-duration-focus)_var(--eased-ease-standard)] active:duration-(--eased-duration-instant) active:ease-standard reduced:active:scale-none focus-ring";

export const press = `${base} active:scale-(--eased-press-scale)`;
export const pressIcon = `${base} active:scale-(--eased-press-scale-icon)`;
export const pressWide = `${base} active:scale-(--eased-press-scale-wide)`;
