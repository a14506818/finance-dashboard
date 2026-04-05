// VIX historically: <12 complacency, 12-20 normal, 20-30 elevated, >30 fear, >40 extreme fear
// Inverted and mapped to 0-100 (higher = more greed)
export function vixToFearGreedScore(vix: number): number {
  const clamped = Math.max(10, Math.min(80, vix));
  return Math.round(90 - ((clamped - 10) / 70) * 90);
}

export type FearGreedLabel =
  | 'Extreme Fear'
  | 'Fear'
  | 'Neutral'
  | 'Greed'
  | 'Extreme Greed';

export function getLabel(value: number): FearGreedLabel {
  if (value <= 25) return 'Extreme Fear';
  if (value <= 45) return 'Fear';
  if (value <= 55) return 'Neutral';
  if (value <= 75) return 'Greed';
  return 'Extreme Greed';
}

export function getLabelColor(value: number): string {
  if (value <= 25) return '#ef4444'; // red-500
  if (value <= 45) return '#f97316'; // orange-500
  if (value <= 55) return '#eab308'; // yellow-500
  if (value <= 75) return '#84cc16'; // lime-500
  return '#22c55e';                  // green-500
}
