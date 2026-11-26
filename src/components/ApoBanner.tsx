import React from "react";
import { AlertTriangle, Download, FolderOpen } from "lucide-react";
import { ApoStatus } from "../types/eq";

interface ApoBannerProps {
  status: ApoStatus;
  onPickFolder: () => void;
  onDownload: () => void;
}

export const ApoBanner: React.FC<ApoBannerProps> = ({
  status,
  onPickFolder,
  onDownload,
}) => {
  if (status.installed && status.writable) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-start gap-3 min-w-[240px] flex-1">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <div className="font-semibold text-amber-200">
            {status.installed
              ? "Equalizer APO Yazma İzni Uyarısı"
              : "Equalizer APO Kurulumu Bulunamadı"}
          </div>
          <div className="text-amber-200/80 mt-0.5">
            {status.error ||
              `Beklenen dizin: ${status.basePath}. Kurulum klasörünü seçebilir veya Equalizer APO'yu indirebilirsiniz.`}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onPickFolder}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-zinc-100 border border-white/10 transition cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Klasör Seç
        </button>
        {!status.installed && (
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500 hover:bg-amber-400 text-zinc-950 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            İndir
          </button>
        )}
      </div>
    </div>
  );
};
