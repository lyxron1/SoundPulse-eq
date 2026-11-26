import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Headphones,
  RefreshCw,
  Speaker,
  Volume2,
  X,
} from "lucide-react";
import { BUILT_IN_PRESETS } from "./data/presets";
import {
  applyEqProfile,
  checkEqualizerApo,
  getAudioDevices,
  listenTrayUpdates,
  loadCustomProfiles,
  openExternalUrl,
  pickApoDirectory,
  saveCustomProfiles,
} from "./services/tauriApi";
import { ApoStatus, AudioDevice, BandGain, EqProfile } from "./types/eq";
import { ApoBanner } from "./components/ApoBanner";
import { PresetGrid } from "./components/PresetGrid";
import { FrequencyCurve } from "./components/FrequencyCurve";
import { EqSliders } from "./components/EqSliders";

const SAVED_DEVICE_KEY = "soundpulse_selected_device";
const SAVED_APO_PATH_KEY = "soundpulse_apo_path";
const EQUALIZER_APO_URL = "https://sourceforge.net/projects/equalizerapo/";

export function App() {
  const defaultPreset = BUILT_IN_PRESETS[0];

  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>(
    () => localStorage.getItem(SAVED_DEVICE_KEY) || ""
  );
  const [loadingDevices, setLoadingDevices] = useState<boolean>(false);

  const [customApoPath, setCustomApoPath] = useState<string | null>(
    () => localStorage.getItem(SAVED_APO_PATH_KEY)
  );
  const [apoStatus, setApoStatus] = useState<ApoStatus | null>(null);

  const [customProfiles, setCustomProfiles] = useState<EqProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>(
    defaultPreset.id
  );
  const [preamp, setPreamp] = useState<number>(defaultPreset.preamp);
  const [bands, setBands] = useState<BandGain[]>(defaultPreset.bands);
  const [bypassed, setBypassed] = useState<boolean>(false);

  const [syncMessage, setSyncMessage] = useState<string>("");
  const [syncError, setSyncError] = useState<string | null>(null);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [newProfileName, setNewProfileName] = useState<string>("");
  const [newProfileDesc, setNewProfileDesc] = useState<string>("");

  const applyTimerRef = useRef<number | null>(null);
  const skipNextAutoApplyRef = useRef<boolean>(false);

  const allPresets = useMemo(
    () => [...BUILT_IN_PRESETS, ...customProfiles],
    [customProfiles]
  );

  const refreshDevices = useCallback(async () => {
    setLoadingDevices(true);
    try {
      const list = await getAudioDevices();
      setDevices(list);
      setSelectedDevice((prev) => {
        if (prev && list.some((d) => d.name === prev)) {
          return prev;
        }
        const def = list.find((d) => d.isDefault) || list[0];
        return def ? def.name : "";
      });
    } catch (err) {
      setSyncError(
        err instanceof Error ? err.message : "Ses aygıtları alınamadı."
      );
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  const refreshApoStatus = useCallback(async (path: string | null) => {
    try {
      const status = await checkEqualizerApo(path);
      setApoStatus(status);
    } catch {
      // Ignore in non-tauri preview
    }
  }, []);

  useEffect(() => {
    refreshDevices();
    refreshApoStatus(customApoPath);
    loadCustomProfiles().then(setCustomProfiles).catch(() => {});
  }, [refreshDevices, refreshApoStatus, customApoPath]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listenTrayUpdates((evt) => {
      skipNextAutoApplyRef.current = true;
      setActiveProfileId(evt.profileId);
      setPreamp(evt.preamp);
      setBands(evt.bands);
      setBypassed(evt.bypassed);
      setSyncMessage(
        evt.bypassed
          ? "Sistem tepsisinden Bypass (Kulaklık Modu) etkinleştirildi"
          : "Sistem tepsisinden profil güncellendi"
      );
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Persist selected device
  useEffect(() => {
    if (selectedDevice) {
      localStorage.setItem(SAVED_DEVICE_KEY, selectedDevice);
    }
  }, [selectedDevice]);

  // Debounced atomic write to Equalizer APO config.txt
  useEffect(() => {
    if (!selectedDevice) return;
    if (skipNextAutoApplyRef.current) {
      skipNextAutoApplyRef.current = false;
      return;
    }

    if (applyTimerRef.current !== null) {
      window.clearTimeout(applyTimerRef.current);
    }

    applyTimerRef.current = window.setTimeout(async () => {
      try {
        await applyEqProfile({
          deviceName: selectedDevice,
          profileId: activeProfileId,
          preamp,
          bands,
          bypassed,
          customApoPath,
        });
        setSyncError(null);
        setSyncMessage(
          bypassed
            ? "Bypass aktif — kulaklıkta EQ devre dışı"
            : `${selectedDevice} için uygulandı`
        );
      } catch (err) {
        setSyncError(typeof err === "string" ? err : String(err));
      }
    }, 60);

    return () => {
      if (applyTimerRef.current !== null) {
        window.clearTimeout(applyTimerRef.current);
      }
    };
  }, [selectedDevice, activeProfileId, preamp, bands, bypassed, customApoPath]);

  const handleSelectPreset = (preset: EqProfile) => {
    setActiveProfileId(preset.id);
    setPreamp(preset.preamp);
    setBands(preset.bands.map((b) => ({ ...b })));
    setBypassed(false);
  };

  const handleBandChange = (freq: number, gain: number) => {
    setActiveProfileId("custom-unsaved");
    setBands((prev) =>
      prev.map((b) => (b.freq === freq ? { ...b, gain } : b))
    );
  };

  const handlePreampChange = (val: number) => {
    setActiveProfileId("custom-unsaved");
    setPreamp(val);
  };

  const handleResetFlat = () => {
    const flat = BUILT_IN_PRESETS.find((p) => p.id === "flat")!;
    handleSelectPreset(flat);
  };

  const handlePickApoFolder = async () => {
    const picked = await pickApoDirectory();
    if (picked) {
      localStorage.setItem(SAVED_APO_PATH_KEY, picked);
      setCustomApoPath(picked);
      await refreshApoStatus(picked);
    }
  };

  const handleSaveCustomProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newProfileName.trim();
    if (!trimmed) return;

    const newProfile: EqProfile = {
      id: `custom-${Date.now()}`,
      name: trimmed,
      description: newProfileDesc.trim() || "Kullanıcı özel EQ profili",
      preamp,
      bands: bands.map((b) => ({ ...b })),
      isCustom: true,
    };

    const updated = [...customProfiles, newProfile];
    setCustomProfiles(updated);
    setActiveProfileId(newProfile.id);
    setBypassed(false);
    setIsSaveModalOpen(false);
    setNewProfileName("");
    setNewProfileDesc("");

    try {
      await saveCustomProfiles(updated);
    } catch (err) {
      setSyncError(typeof err === "string" ? err : "Özel profil kaydedilemedi.");
    }
  };

  const handleDeleteCustomPreset = async (id: string) => {
    const updated = customProfiles.filter((p) => p.id !== id);
    setCustomProfiles(updated);
    if (activeProfileId === id) {
      setActiveProfileId("custom-unsaved");
    }
    try {
      await saveCustomProfiles(updated);
    } catch (err) {
      setSyncError(typeof err === "string" ? err : "Profil silinemedi.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B10] text-zinc-100 flex flex-col">
      {/* Ambient top purple glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-gradient-to-b from-violet-600/12 via-purple-700/5 to-transparent" />

      <div className="relative z-10 max-w-5xl w-full mx-auto px-5 py-5 flex flex-col gap-4 flex-1">
        {/* Top Bar: Brand + Target Speaker + Big Bypass Toggle */}
        <header className="rounded-2xl bg-[#12121A]/90 backdrop-blur-xl border border-white/[0.06] px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.45)]">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-white leading-none">
                SoundPulse EQ
              </h1>
              <p className="text-[11px] text-zinc-400 mt-1">
                Equalizer APO Motoru • Anlık Profil Kontrolü
              </p>
            </div>
          </div>

          {/* Target Speaker Selector */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <div className="relative flex-1">
              <Speaker className="w-4 h-4 text-violet-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="Hedef Hoparlör Seçimi"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full appearance-none rounded-xl bg-[#181823] hover:bg-[#1E1E2C] border border-white/[0.08] focus:border-violet-500/60 focus:outline-none pl-9 pr-8 py-2 text-xs font-medium text-zinc-100 transition cursor-pointer truncate"
              >
                {devices.length === 0 && (
                  <option value="">Ses aygıtı bulunamadı</option>
                )}
                {devices.map((dev) => (
                  <option key={dev.id} value={dev.name}>
                    {dev.isDefault ? `★ ${dev.name}` : dev.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={refreshDevices}
              disabled={loadingDevices}
              title="Ses aygıtlarını yenile"
              className="p-2 rounded-xl bg-[#181823] hover:bg-[#1E1E2C] border border-white/[0.08] text-zinc-300 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingDevices ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {/* Large EQ Active / Bypass (Headphone Mode) Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={!bypassed}
            onClick={() => setBypassed((b) => !b)}
            className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all cursor-pointer select-none ${
              bypassed
                ? "bg-zinc-900/90 border-white/10 text-zinc-300"
                : "bg-violet-600/20 border-violet-500/50 text-white shadow-[0_0_24px_rgba(139,92,246,0.22)]"
            }`}
          >
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold leading-tight">
                {bypassed ? "Bypass (Kulaklık Modu)" : "EQ Aktif"}
              </span>
              <span className="text-[10px] text-zinc-400">
                {bypassed ? "Tüm EQ devre dışı" : "Seçili hoparlörde etkin"}
              </span>
            </div>

            <div
              className={`relative w-12 h-7 rounded-full transition-colors ${
                bypassed ? "bg-zinc-700" : "bg-gradient-to-r from-violet-500 to-purple-500"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-200 ${
                  bypassed ? "translate-x-0" : "translate-x-5"
                }`}
              >
                {bypassed ? (
                  <Headphones className="w-3 h-3 text-zinc-700" />
                ) : (
                  <Speaker className="w-3 h-3 text-violet-600" />
                )}
              </span>
            </div>
          </button>
        </header>

        {/* Equalizer APO Installation / Permission Banner */}
        {apoStatus && (
          <ApoBanner
            status={apoStatus}
            onPickFolder={handlePickApoFolder}
            onDownload={() => openExternalUrl(EQUALIZER_APO_URL)}
          />
        )}

        {/* Preset Cards */}
        <PresetGrid
          presets={allPresets}
          activeProfileId={activeProfileId}
          bypassed={bypassed}
          onSelectPreset={handleSelectPreset}
          onDeleteCustomPreset={handleDeleteCustomPreset}
        />

        {/* Live Frequency Response Curve */}
        <FrequencyCurve bands={bands} preamp={preamp} bypassed={bypassed} />

        {/* 8-Band Vertical EQ Sliders & Preamp */}
        <EqSliders
          bands={bands}
          preamp={preamp}
          bypassed={bypassed}
          onBandChange={handleBandChange}
          onPreampChange={handlePreampChange}
          onResetFlat={handleResetFlat}
          onOpenSaveModal={() => setIsSaveModalOpen(true)}
        />

        {/* Footer Status */}
        <footer className="flex items-center justify-between px-1 text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            {syncError ? (
              <span className="text-rose-400">{syncError}</span>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
                <span>{syncMessage || "Hazır"}</span>
              </>
            )}
          </div>
          <span>Kapatıldığında sistem tepsisine küçülür</span>
        </footer>
      </div>

      {/* Save Custom Profile Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCustomProfile}
            className="w-full max-w-sm rounded-2xl bg-[#151520] border border-white/10 p-5 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Özel Ses Profili Kaydet
              </h3>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Profil Adı
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Örn: Gece Sineması"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full rounded-xl bg-[#0E0E16] border border-white/10 focus:border-violet-500 focus:outline-none px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Açıklama (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Yumuşak tizler, sıcak bas"
                  value={newProfileDesc}
                  onChange={(e) => setNewProfileDesc(e.target.value)}
                  className="w-full rounded-xl bg-[#0E0E16] border border-white/10 focus:border-violet-500 focus:outline-none px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-300 transition cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-600/25 transition cursor-pointer"
              >
                Kaydet
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
