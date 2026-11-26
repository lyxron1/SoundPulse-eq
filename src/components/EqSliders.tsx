import React, { useCallback, useRef } from "react";
import { RotateCcw, Save } from "lucide-react";
import { BandGain } from "../types/eq";
import { formatFreqLabel } from "../data/presets";

interface EqSlidersProps {
  bands: BandGain[];
  preamp: number;
  bypassed: boolean;
  onBandChange: (freq: number, gain: number) => void;
  onPreampChange: (preamp: number) => void;
  onResetFlat: () => void;
  onOpenSaveModal: () => void;
}

const MIN_DB = -12;
const MAX_DB = 12;

function snapHalfDb(value: number): number {
  const clamped = Math.max(MIN_DB, Math.min(MAX_DB, value));
  return Math.round(clamped * 2) / 2;
}

interface VerticalFaderProps {
  freq: number;
  gain: number;
  bypassed: boolean;
  onChange: (gain: number) => void;
}

const VerticalFader: React.FC<VerticalFaderProps> = ({
  freq,
  gain,
  bypassed,
  onChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const updateFromClientY = useCallback(
    (clientY: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = 1 - (clientY - rect.top) / rect.height;
      const raw = MIN_DB + ratio * (MAX_DB - MIN_DB);
      onChange(snapHalfDb(raw));
    },
    [onChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (bypassed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientY(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (bypassed || e.buttons !== 1) return;
    updateFromClientY(e.clientY);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (bypassed) return;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      onChange(snapHalfDb(gain + 0.5));
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      onChange(snapHalfDb(gain - 0.5));
    }
  };

  const percent = ((gain - MIN_DB) / (MAX_DB - MIN_DB)) * 100;
  const zeroPercent = 50;
  const fillBottom = Math.min(percent, zeroPercent);
  const fillHeight = Math.abs(percent - zeroPercent);

  const formattedGain =
    gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1);

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <span
        className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-md transition-colors ${
          bypassed
            ? "text-zinc-600"
            : gain === 0
            ? "text-zinc-400"
            : "text-violet-300 bg-violet-500/10"
        }`}
      >
        {formattedGain}
      </span>

      <div
        ref={trackRef}
        role="slider"
        tabIndex={bypassed ? -1 : 0}
        aria-label={`${freq} Hz kazanç`}
        aria-valuemin={MIN_DB}
        aria-valuemax={MAX_DB}
        aria-valuenow={gain}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onDoubleClick={() => !bypassed && onChange(0)}
        onKeyDown={handleKeyDown}
        title="Çift tıkla: 0 dB sıfırla"
        className={`relative w-8 h-36 flex items-center justify-center touch-none outline-none rounded-xl ${
          bypassed ? "cursor-not-allowed opacity-45" : "cursor-ns-resize"
        }`}
      >
        {/* Background rail */}
        <div className="relative w-1.5 h-full rounded-full bg-white/[0.08] overflow-hidden">
          {/* Zero center tick */}
          <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/25" />

          {/* Active fill from 0 dB */}
          <div
            className={`absolute left-0 right-0 rounded-full transition-colors ${
              bypassed
                ? "bg-zinc-600"
                : "bg-gradient-to-t from-violet-600 to-purple-400"
            }`}
            style={{
              bottom: `${fillBottom}%`,
              height: `${fillHeight}%`,
            }}
          />
        </div>

        {/* Thumb */}
        <div
          className={`absolute w-4 h-4 rounded-full border-2 transition-transform ${
            bypassed
              ? "bg-zinc-600 border-zinc-400"
              : "bg-purple-500 border-violet-50 shadow-[0_0_12px_rgba(168,85,247,0.7)] hover:scale-110"
          }`}
          style={{
            bottom: `calc(${percent}% - 8px)`,
          }}
        />
      </div>

      <span className="text-[11px] font-medium text-zinc-400">
        {formatFreqLabel(freq)}
        <span className="text-[9px] text-zinc-600 ml-0.5">Hz</span>
      </span>
    </div>
  );
};

export const EqSliders: React.FC<EqSlidersProps> = ({
  bands,
  preamp,
  bypassed,
  onBandChange,
  onPreampChange,
  onResetFlat,
  onOpenSaveModal,
}) => {
  return (
    <div className="rounded-2xl bg-[#12121A]/90 border border-white/[0.06] p-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <span className="text-xs font-medium text-zinc-300 whitespace-nowrap">
            Preamp
          </span>
          <input
            type="range"
            min={MIN_DB}
            max={MAX_DB}
            step={0.5}
            disabled={bypassed}
            value={preamp}
            onChange={(e) => onPreampChange(parseFloat(e.target.value))}
            className={`eq-horizontal flex-1 max-w-xs ${
              bypassed ? "opacity-45 cursor-not-allowed" : ""
            }`}
          />
          <span className="text-xs font-mono tabular-nums text-violet-300 w-16 text-right">
            {preamp > 0 ? `+${preamp.toFixed(1)}` : preamp.toFixed(1)} dB
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetFlat}
            disabled={bypassed}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Sıfırla
          </button>
          <button
            type="button"
            onClick={onOpenSaveModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-violet-600/20 hover:bg-violet-600/30 text-violet-200 border border-violet-500/30 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Özel Profil Kaydet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-2 pt-1">
        {bands.map((band) => (
          <VerticalFader
            key={band.freq}
            freq={band.freq}
            gain={band.gain}
            bypassed={bypassed}
            onChange={(g) => onBandChange(band.freq, g)}
          />
        ))}
      </div>
    </div>
  );
};
