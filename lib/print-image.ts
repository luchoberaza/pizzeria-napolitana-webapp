/**
 * Prints the current page using window.print().
 * The @media print CSS rules in globals.css handle:
 * - hiding everything except .print-only elements
 * - sizing the page to 80mm (thermal receipt paper)
 * - removing margins for full-width printing
 *
 * The XP-80T (and similar thermal printers) work as standard
 * Windows printers — the browser sends the rendered HTML directly
 * through the print spooler. No image rasterization needed.
 */
export function printReceipt(): void {
  window.print()
}
