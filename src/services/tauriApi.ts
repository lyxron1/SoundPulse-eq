import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  ApoStatus,
  ApplyEqPayload,
  ApplyEqResult,
  AudioDevice,
  EqProfile,
  TraySyncEvent,
} from "../types/eq";

const LOCAL_PROFILES_KEY = "soundpulse_custom_profiles";

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function getAudioDevices(): Promise<AudioDevice[]> {
  if (!isTauriRuntime()) {
    return [
      {
        id: "mock-speakers",
        name: "Speakers (Realtek(R) Audio)",
        isDefault: true,
      },
      {
        id: "mock-headphones",
        name: "Headphones (Wireless Stereo)",
        isDefault: false,
      },
    ];
  }
  return invoke<AudioDevice[]>("get_audio_devices");
}

export async function checkEqualizerApo(
  customPath: string | null
): Promise<ApoStatus> {
  if (!isTauriRuntime()) {
    return {
      installed: true,
      basePath: customPath || "C:\\Program Files\\EqualizerAPO",
      configPath: `${customPath || "C:\\Program Files\\EqualizerAPO"}\\config\\config.txt`,
      writable: true,
      error: null,
    };
  }
  return invoke<ApoStatus>("check_equalizer_apo", { customPath });
}

export async function applyEqProfile(
  payload: ApplyEqPayload
): Promise<ApplyEqResult> {
  if (!isTauriRuntime()) {
    const bandsStr = payload.bands
      .map((b) => `${b.freq} ${b.gain}`)
      .join("; ");
    const content = payload.bypassed
      ? "# SoundPulse EQ - Bypass (Kulaklık Modu / Devre Dışı)\nPreamp: 0.0 dB\n"
      : `Device: ${payload.deviceName}\nPreamp: ${payload.preamp} dB\nGraphicEQ: ${bandsStr}\n`;
    return {
      configPath: "C:\\Program Files\\EqualizerAPO\\config\\config.txt",
      writtenContent: content,
    };
  }
  return invoke<ApplyEqResult>("apply_eq_profile", { payload });
}

export async function loadCustomProfiles(): Promise<EqProfile[]> {
  if (!isTauriRuntime()) {
    try {
      const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
      return raw ? (JSON.parse(raw) as EqProfile[]) : [];
    } catch {
      return [];
    }
  }
  try {
    const fromDisk = await invoke<EqProfile[]>("load_custom_profiles");
    if (fromDisk.length > 0) {
      return fromDisk;
    }
    const localRaw = localStorage.getItem(LOCAL_PROFILES_KEY);
    return localRaw ? (JSON.parse(localRaw) as EqProfile[]) : [];
  } catch {
    const localRaw = localStorage.getItem(LOCAL_PROFILES_KEY);
    return localRaw ? (JSON.parse(localRaw) as EqProfile[]) : [];
  }
}

export async function saveCustomProfiles(
  profiles: EqProfile[]
): Promise<void> {
  localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
  if (isTauriRuntime()) {
    await invoke("save_custom_profiles", { profiles });
  }
}

export async function pickApoDirectory(): Promise<string | null> {
  if (!isTauriRuntime()) {
    return null;
  }
  return invoke<string | null>("pick_apo_directory");
}

export async function openExternalUrl(url: string): Promise<void> {
  if (!isTauriRuntime()) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  await invoke("open_external_url", { url });
}

export async function setTrayLanguage(lang: "en" | "tr"): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }
  await invoke("set_tray_language", { lang });
}

export async function listenTrayUpdates(
  handler: (event: TraySyncEvent) => void
): Promise<UnlistenFn> {
  if (!isTauriRuntime()) {
    return () => {};
  }
  return listen<TraySyncEvent>("tray-state-updated", (event) => {
    handler(event.payload);
  });
}
