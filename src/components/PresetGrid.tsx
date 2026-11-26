import React from "react";
import {
  AudioLines,
  Crosshair,
  Disc3,
  Mic,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { EqProfile } from "../types/eq";

interface PresetGridProps {
  presets: EqProfile[];
  activeProfileId: string;
  bypassed: boolean;
  onSelectPreset: (preset: EqProfile) => void;
  onDeleteCustomPreset: (id: string) => void;
}

function getPresetIcon(id: string) {
  switch (id) {
    case "soundpulse-signature":
      return <Sparkles className="w-4 h-4" />;
    case "bass-booster":
      return <Disc3 className="w-4 h-4" />;
    case "gaming-fps":
      return <Crosshair className="w-4 h-4" />;
    case "podcast-vocal":
      return <Mic className="w-4 h-4" />;
    case "acoustic":
      return <AudioLines className="w-4 h-4" />;
    default:
      return <SlidersHorizontal className="w-4 h-4" />;
  }
}

export const PresetGrid: React.FC<PresetGridProps> = ({
  presets,
  activeProfileId,
  bypassed,
  onSelectPreset,
  onDeleteCustomPreset,
}) => {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Hazır & Özel Ses Profilleri
        </h2>
        <span className="text-[11px] text-zinc-500">
          Tek tıkla anlık geçiş
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {presets.map((preset) => {
          const isActive = !bypassed && activeProfileId === preset.id;
          return (
            <div
              key={preset.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPreset(preset)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPreset(preset);
                }
              }}
              className={`group relative rounded-2xl p-3.5 text-left transition-all duration-150 cursor-pointer border select-none ${
                isActive
                  ? "bg-gradient-to-br from-violet-600/25 via-purple-600/15 to-[#161622] border-violet-500/60 shadow-[0_0_24px_rgba(139,92,246,0.18)]"
                  : "bg-[#12121A]/85 hover:bg-[#171722] border-white/[0.06] hover:border-white/[0.12]"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div
                  className={`p-2 rounded-xl transition-colors ${
                    isActive
                      ? "bg-violet-500/25 text-violet-300"
                      : "bg-white/[0.05] text-zinc-400 group-hover:text-zinc-200"
                  }`}
                >
                  {getPresetIcon(preset.id)}
                </div>

                <div className="flex items-center gap-1.5">
                  {preset.isCustom && (
                    <button
                      type="button"
                      title="Özel profili sil"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustomPreset(preset.id);
                      }}
                      className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? "bg-violet-500/20 text-violet-200"
                        : "bg-white/[0.04] text-zinc-500"
                    }`}
                  >
                    {preset.preamp > 0 ? `+${preset.preamp}` : preset.preamp} dB
                  </span>
                </div>
              </div>

              <div className="font-medium text-sm text-zinc-100 leading-snug truncate">
                {preset.name}
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                {preset.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
