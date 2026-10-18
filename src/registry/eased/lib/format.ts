/**
 * Number formatting shared by the finance and crypto blocks. Intl writes negatives with a
 * hyphen-minus (U+002D), which is narrower than "+" and breaks a tabular column; Eased uses the
 * true minus sign (U+2212) everywhere.
 */

/** Swap Intl's hyphen-minus for the true minus sign. */
export const trueMinus = (text: string) => text.replace(/-/g, "−");

/**
 * An Intl formatter that writes negatives with the true minus sign. Pass it to NumberRoll as
 * `formatter`, or call it directly: `const pct = minusFormatter(locale, { style: "percent" })`.
 */
export function minusFormatter(locale: Intl.LocalesArgument, options: Intl.NumberFormatOptions): (value: number) => string {
  const format = new Intl.NumberFormat(locale, options);
  return (value) => trueMinus(format.format(value));
}
