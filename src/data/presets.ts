import { EQ_FREQUENCIES, EqProfile } from "../types/eq";

function makeBands(gains: number[]) {
  return EQ_FREQUENCIES.map((freq, idx) => ({
    freq,
    gain: gains[idx] ?? 0,
  }));
}

export const BUILT_IN_PRESETS: EqProfile[] = [
  {
    id: "soundpulse-signature",
    name: "SoundPulse Özel (Signature)",
    description: "Güçlü baslar, net vokaller ve parlak tizler",
    preamp: -3.5,
    bands: makeBands([3.5, 2.0, -1.0, 0, 1.5, 3.0, 3.5, 2.5]),
    isCustom: false,
  },
  {
    id: "bass-booster",
    name: "Bas Güçlendirici",
    description: "Küçük hoparlör uyumlu dolgun alt frekanslar",
    preamp: -4.5,
    bands: makeBands([4.5, 4.5, 1.0, 0, 0.5, 1.0, 1.0, 0]),
    isCustom: false,
  },
  {
    id: "gaming-fps",
    name: "Oyun / FPS (Ayak Sesi)",
    description: "Ayak seslerini ve yön ipuçlarını öne çıkarır",
    preamp: -4.0,
    bands: makeBands([-3.5, -2.0, -1.0, 1.0, 3.5, 4.5, 3.5, 2.0]),
    isCustom: false,
  },
  {
    id: "podcast-vocal",
    name: "Podcast / Net Konuşma",
    description: "İnsan sesini berraklaştırır, dip uğultuyu azaltır",
    preamp: -3.5,
    bands: makeBands([-4.0, -2.5, 2.0, 3.5, 3.0, 1.0, -1.0, -1.5]),
    isCustom: false,
  },
  {
    id: "acoustic",
    name: "Akustik / Enstrüman",
    description: "Doğal enstrüman tınısı ve sıcak sahne dengesi",
    preamp: -2.5,
    bands: makeBands([1.0, 1.5, 1.5, 1.0, 2.5, 2.5, 2.0, 1.5]),
    isCustom: false,
  },
  {
    id: "flat",
    name: "Düz (Flat)",
    description: "Tüm bantlar 0 dB nötr referans eğrisi",
    preamp: 0,
    bands: makeBands([0, 0, 0, 0, 0, 0, 0, 0]),
    isCustom: false,
  },
];

export function formatFreqLabel(freq: number): string {
  if (freq >= 1000) {
    const khz = freq / 1000;
    return Number.isInteger(khz) ? `${khz}k` : `${khz.toFixed(1)}k`;
  }
  return `${freq}`;
}
