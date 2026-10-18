"use client";

/**
 * Number Roll: tabular digits that roll in the direction of change, with locale-aware
 * separators. The engine is the shared `_primitives/number-roll` primitive that Badge,
 * Progress and the other Eased components roll their numbers with; this entry point is
 * the public import.
 *
 *   <NumberRoll value={48210.4} format={{ style: "currency", currency: "USD" }} />
 */
export {
  NumberRoll,
  toRollParts,
  type NumberRollFormat,
  type NumberRollProps,
  type RollDirection,
  type RollPart,
} from "../_primitives/number-roll/number-roll";
