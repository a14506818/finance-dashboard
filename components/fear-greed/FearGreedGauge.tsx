import { getLabelColor } from '@/lib/fear-greed';

interface FearGreedGaugeProps {
  title: string;
  value: number;          // 0–100
  label: string;
  subtitle?: string;
  isLoading?: boolean;
}

// --- SVG geometry helpers ---
function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number,
  endDeg: number
) {
  const o1 = polarToCartesian(cx, cy, outerR, startDeg);
  const o2 = polarToCartesian(cx, cy, outerR, endDeg);
  const i1 = polarToCartesian(cx, cy, innerR, endDeg);
  const i2 = polarToCartesian(cx, cy, innerR, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y}`,
    'Z',
  ].join(' ');
}

// 5 color zones mapped onto 180° arc (180° → 360°)
const ZONES = [
  { from: 0,  to: 25,  color: '#ef4444' }, // Extreme Fear
  { from: 25, to: 45,  color: '#f97316' }, // Fear
  { from: 45, to: 55,  color: '#eab308' }, // Neutral
  { from: 55, to: 75,  color: '#84cc16' }, // Greed
  { from: 75, to: 100, color: '#22c55e' }, // Extreme Greed
];

const CX = 100, CY = 100, OUTER = 88, INNER = 60;

// value 0–100  →  angle 180°–360°
function valueToAngle(v: number) {
  return 180 + (Math.max(0, Math.min(100, v)) / 100) * 180;
}

export function FearGreedGauge({
  title,
  value,
  label,
  subtitle,
  isLoading,
}: FearGreedGaugeProps) {
  const color = getLabelColor(value);
  const needleAngle = valueToAngle(value);
  const needleTip = polarToCartesian(CX, CY, OUTER - 6, needleAngle);
  const needleLeft = polarToCartesian(CX, CY, 8, needleAngle - 90);
  const needleRight = polarToCartesian(CX, CY, 8, needleAngle + 90);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col items-center">
      <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
        {title}
      </h3>

      {isLoading ? (
        <div className="w-48 h-24 animate-pulse bg-zinc-200 dark:bg-zinc-700 rounded" />
      ) : (
        <svg
          viewBox="0 0 200 110"
          className="w-48"
          aria-label={`Fear & Greed: ${value} – ${label}`}
        >
          {/* Arc zones */}
          {ZONES.map((zone, i) => (
            <path
              key={i}
              d={arcPath(
                CX, CY, OUTER, INNER,
                valueToAngle(zone.from),
                valueToAngle(zone.to)
              )}
              fill={zone.color}
              opacity={0.85}
            />
          ))}

          {/* Needle */}
          <polygon
            points={`${needleTip.x},${needleTip.y} ${needleLeft.x},${needleLeft.y} ${needleRight.x},${needleRight.y}`}
            fill={color}
            style={{
              transformOrigin: `${CX}px ${CY}px`,
              transition: 'all 0.8s ease-out',
            }}
          />
          <circle cx={CX} cy={CY} r={7} fill="white" className="dark:fill-zinc-900" />
          <circle cx={CX} cy={CY} r={4} fill={color} />

          {/* Value text */}
          <text
            x={CX}
            y={CY - 12}
            textAnchor="middle"
            fontSize="22"
            fontWeight="700"
            fill={color}
            fontFamily="system-ui"
          >
            {value}
          </text>
        </svg>
      )}

      <p className="mt-1 text-base font-semibold" style={{ color }}>
        {isLoading ? '—' : label}
      </p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>
      )}
    </div>
  );
}
