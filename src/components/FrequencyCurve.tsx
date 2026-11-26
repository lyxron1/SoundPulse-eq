import React, { useMemo } from "react";
import { BandGain } from "../types/eq";
import { formatFreqLabel } from "../data/presets";

interface FrequencyCurveProps {
  bands: BandGain[];
  preamp: number;
  bypassed: boolean;
}

const SVG_WIDTH = 760;
const SVG_HEIGHT = 176;
const PAD_X = 36;
const PAD_Y = 18;
const PLOT_W = SVG_WIDTH - PAD_X * 2;
const PLOT_H = SVG_HEIGHT - PAD_Y * 2;

function gainToY(gain: number): number {
  const clamped = Math.max(-12, Math.min(12, gain));
  const norm = (12 - clamped) / 24;
  return PAD_Y + norm * PLOT_H;
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const tension = 0.22;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export const FrequencyCurve: React.FC<FrequencyCurveProps> = ({
  bands,
  preamp,
  bypassed,
}) => {
  const { points, linePath, areaPath } = useMemo(() => {
    const pts = bands.map((band, index) => {
      const x =
        PAD_X + (index / Math.max(1, bands.length - 1)) * PLOT_W;
      const y = gainToY(bypassed ? 0 : band.gain);
      return { x, y, ...band };
    });

    const line = buildSmoothPath(pts);
    const baselineY = gainToY(0);
    const area =
      pts.length > 0
        ? `${line} L ${pts[pts.length - 1].x.toFixed(2)} ${baselineY.toFixed(2)} L ${pts[0].x.toFixed(2)} ${baselineY.toFixed(2)} Z`
        : "";

    return { points: pts, linePath: line, areaPath: area };
  }, [bands, bypassed]);

  const dbLines = [12, 6, 0, -6, -12];

  return (
    <div className="relative w-full rounded-2xl bg-[#12121A]/90 border border-white/[0.06] p-3 overflow-hidden">
      <div className="flex items-center justify-between px-2 mb-1">
        <span className="text-[11px] font-medium tracking-wider uppercase text-zinc-400">
          Canlı Frekans Tepki Eğrisi
        </span>
        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <span>
            Preamp:{" "}
            <strong
              className={
                bypassed ? "text-zinc-500" : "text-violet-300 font-semibold"
              }
            >
              {bypassed ? "0.0" : preamp > 0 ? `+${preamp.toFixed(1)}` : preamp.toFixed(1)} dB
            </strong>
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
              bypassed
                ? "bg-zinc-800/80 text-zinc-400 border border-white/5"
                : "bg-violet-500/15 text-violet-300 border border-violet-500/30"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                bypassed ? "bg-zinc-500" : "bg-violet-400 animate-pulse"
              }`}
            />
            {bypassed ? "Bypass" : "Aktif"}
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-40 select-none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="eqLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
          <linearGradient id="eqAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
          </linearGradient>
          <filter id="eqGlow" x="-10%" y="-20%" width="120%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Horizontal dB grid lines */}
        {dbLines.map((db) => {
          const y = gainToY(db);
          const isZero = db === 0;
          return (
            <g key={db}>
              <line
                x1={PAD_X}
                y1={y}
                x2={SVG_WIDTH - PAD_X}
                y2={y}
                stroke={isZero ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)"}
                strokeDasharray={isZero ? undefined : "4 4"}
                strokeWidth={isZero ? 1.2 : 1}
              />
              <text
                x={PAD_X - 8}
                y={y + 3.5}
                textAnchor="end"
                className="fill-zinc-500 text-[10px] font-mono"
              >
                {db > 0 ? `+${db}` : db}
              </text>
            </g>
          );
        })}

        {/* Vertical frequency guide lines */}
        {points.map((pt) => (
          <g key={pt.freq}>
            <line
              x1={pt.x}
              y1={PAD_Y}
              x2={pt.x}
              y2={SVG_HEIGHT - PAD_Y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={1}
            />
            <text
              x={pt.x}
              y={SVG_HEIGHT - 3}
              textAnchor="middle"
              className="fill-zinc-500 text-[10px] font-medium"
            >
              {formatFreqLabel(pt.freq)}
            </text>
          </g>
        ))}

        {/* Area fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill={bypassed ? "rgba(113, 113, 122, 0.12)" : "url(#eqAreaGrad)"}
            className="transition-all duration-200"
          />
        )}

        {/* Smooth curve */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={bypassed ? "#52525b" : "url(#eqLineGrad)"}
            strokeWidth={2.75}
            strokeLinecap="round"
            filter={bypassed ? undefined : "url(#eqGlow)"}
            className="transition-all duration-200"
          />
        )}

        {/* Band nodes */}
        {points.map((pt) => (
          <g key={pt.freq}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={4.5}
              fill={bypassed ? "#3f3f46" : "#0B0B10"}
              stroke={bypassed ? "#71717a" : "#A855F7"}
              strokeWidth={2.2}
              className="transition-all duration-150"
            />
          </g>
        ))}
      </svg>
    </div>
  );
};
