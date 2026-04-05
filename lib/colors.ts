/**
 * Returns Tailwind text color class for a gain/loss value based on convention.
 * western: green = positive, red = negative (default)
 * taiwan:  red   = positive, green = negative (台灣股市慣例：紅漲綠跌)
 */
export function gainColor(
  isPositive: boolean,
  convention: 'western' | 'taiwan' = 'western'
): string {
  if (convention === 'taiwan') {
    return isPositive ? 'text-red-500' : 'text-green-500';
  }
  return isPositive ? 'text-green-500' : 'text-red-500';
}

/**
 * Returns Tailwind bg + text classes for a badge (e.g. AssetCard percent badge).
 */
export function gainBadgeClass(
  isPositive: boolean,
  convention: 'western' | 'taiwan' = 'western'
): string {
  if (convention === 'taiwan') {
    return isPositive
      ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
      : 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400';
  }
  return isPositive
    ? 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400'
    : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400';
}
