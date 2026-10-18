/**
 * Alignment recipes for rules 101–109, as class strings to compose with your own.
 *
 *   rowGrid     a list whose rows share tracks: leading item, flexible text, then a fixed
 *               trailing column set by `--col` (default 5rem). Rows are `rowGridRow`, which
 *               subgrids the parent, so every role, menu or value starts on one x (R102, R103).
 *   rowGridRow  one row of a `rowGrid`. Add a height (`h-9`) and any row padding.
 *
 *   <ul className={`${rowGrid} gap-x-2.5 [--col:5.5rem]`}>
 *     <li className={`${rowGridRow} h-11`}><Avatar /><span>…</span><span>Can edit</span></li>
 *   </ul>
 */
export const rowGrid = "grid grid-cols-[auto_minmax(0,1fr)_var(--col,5rem)] items-center";
export const rowGridRow = "col-span-full grid grid-cols-subgrid items-center";
