export type Language = "en" | "tr";

export interface Translations {
  appSubtitle: string;
  targetSpeakerAria: string;
  noDevicesFound: string;
  refreshDevicesTitle: string;
  eqActive: string;
  eqActiveDesc: string;
  bypassTitle: string;
  bypassDesc: string;
  presetsHeading: string;
  presetsHint: string;
  deleteCustomPresetTitle: string;
  liveCurveTitle: string;
  preampLabel: string;
  statusActive: string;
  statusBypass: string;
  resetBtn: string;
  saveCustomBtn: string;
  doubleClickResetTitle: string;
  apoPermWarningTitle: string;
  apoMissingTitle: string;
  apoFallbackError: (basePath: string) => string;
  selectFolderBtn: string;
  downloadBtn: string;
  readyStatus: string;
  trayHint: string;
  trayBypassSynced: string;
  trayProfileSynced: string;
  appliedForDevice: (device: string) => string;
  bypassAppliedStatus: string;
  devicesFetchError: string;
  saveProfileError: string;
  deleteProfileError: string;
  modalTitle: string;
  modalNameLabel: string;
  modalNamePlaceholder: string;
  modalDescLabel: string;
  modalDescPlaceholder: string;
  modalDefaultDesc: string;
  cancelBtn: string;
  saveBtn: string;
  presets: Record<string, { name: string; description: string }>;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    appSubtitle: "Equalizer APO Engine • Instant Profile Control",
    targetSpeakerAria: "Target Speaker Selection",
    noDevicesFound: "No audio output devices found",
    refreshDevicesTitle: "Refresh audio devices",
    eqActive: "EQ Active",
    eqActiveDesc: "Enabled on selected speaker",
    bypassTitle: "Bypass (Headphone Mode)",
    bypassDesc: "All EQ disabled",
    presetsHeading: "Built-in & Custom Sound Profiles",
    presetsHint: "One-click instant switch",
    deleteCustomPresetTitle: "Delete custom profile",
    liveCurveTitle: "Live Frequency Response Curve",
    preampLabel: "Preamp",
    statusActive: "Active",
    statusBypass: "Bypass",
    resetBtn: "Reset",
    saveCustomBtn: "Save Custom Profile",
    doubleClickResetTitle: "Double-click to reset to 0 dB",
    apoPermWarningTitle: "Equalizer APO Write Permission Warning",
    apoMissingTitle: "Equalizer APO Installation Not Found",
    apoFallbackError: (basePath) =>
      `Expected directory: ${basePath}. You can select the installation folder or download Equalizer APO.`,
    selectFolderBtn: "Select Folder",
    downloadBtn: "Download",
    readyStatus: "Ready",
    trayHint: "Minimizes to system tray when closed",
    trayBypassSynced: "Bypass (Headphone Mode) enabled from system tray",
    trayProfileSynced: "Profile updated from system tray",
    appliedForDevice: (device) => `Applied for ${device}`,
    bypassAppliedStatus: "Bypass active — EQ disabled on headphones",
    devicesFetchError: "Failed to list audio devices.",
    saveProfileError: "Failed to save custom profile.",
    deleteProfileError: "Failed to delete profile.",
    modalTitle: "Save Custom Sound Profile",
    modalNameLabel: "Profile Name",
    modalNamePlaceholder: "e.g. Late Night Cinema",
    modalDescLabel: "Description (Optional)",
    modalDescPlaceholder: "e.g. Smooth highs, warm bass",
    modalDefaultDesc: "User custom EQ profile",
    cancelBtn: "Cancel",
    saveBtn: "Save",
    presets: {
      "soundpulse-signature": {
        name: "SoundPulse Signature",
        description: "Punchy bass, clear vocals, and crisp highs",
      },
      "bass-booster": {
        name: "Bass Booster",
        description: "Rich low-end tuned for compact desktop speakers",
      },
      "gaming-fps": {
        name: "Gaming / FPS (Footsteps)",
        description: "Enhances footsteps and directional audio cues",
      },
      "podcast-vocal": {
        name: "Podcast / Clear Voice",
        description: "Clarifies speech and reduces low-end rumble",
      },
      acoustic: {
        name: "Acoustic / Instrument",
        description: "Natural instrument timbre and warm soundstage",
      },
      flat: {
        name: "Flat",
        description: "Neutral 0 dB reference curve across all bands",
      },
    },
  },
  tr: {
    appSubtitle: "Equalizer APO Motoru • Anlık Profil Kontrolü",
    targetSpeakerAria: "Hedef Hoparlör Seçimi",
    noDevicesFound: "Ses aygıtı bulunamadı",
    refreshDevicesTitle: "Ses aygıtlarını yenile",
    eqActive: "EQ Aktif",
    eqActiveDesc: "Seçili hoparlörde etkin",
    bypassTitle: "Bypass (Kulaklık Modu)",
    bypassDesc: "Tüm EQ devre dışı",
    presetsHeading: "Hazır & Özel Ses Profilleri",
    presetsHint: "Tek tıkla anlık geçiş",
    deleteCustomPresetTitle: "Özel profili sil",
    liveCurveTitle: "Canlı Frekans Tepki Eğrisi",
    preampLabel: "Preamp",
    statusActive: "Aktif",
    statusBypass: "Bypass",
    resetBtn: "Sıfırla",
    saveCustomBtn: "Özel Profil Kaydet",
    doubleClickResetTitle: "Çift tıkla: 0 dB sıfırla",
    apoPermWarningTitle: "Equalizer APO Yazma İzni Uyarısı",
    apoMissingTitle: "Equalizer APO Kurulumu Bulunamadı",
    apoFallbackError: (basePath) =>
      `Beklenen dizin: ${basePath}. Kurulum klasörünü seçebilir veya Equalizer APO'yu indirebilirsiniz.`,
    selectFolderBtn: "Klasör Seç",
    downloadBtn: "İndir",
    readyStatus: "Hazır",
    trayHint: "Kapatıldığında sistem tepsisine küçülür",
    trayBypassSynced: "Sistem tepsisinden Bypass (Kulaklık Modu) etkinleştirildi",
    trayProfileSynced: "Sistem tepsisinden profil güncellendi",
    appliedForDevice: (device) => `${device} için uygulandı`,
    bypassAppliedStatus: "Bypass aktif — kulaklıkta EQ devre dışı",
    devicesFetchError: "Ses aygıtları alınamadı.",
    saveProfileError: "Özel profil kaydedilemedi.",
    deleteProfileError: "Profil silinemedi.",
    modalTitle: "Özel Ses Profili Kaydet",
    modalNameLabel: "Profil Adı",
    modalNamePlaceholder: "Örn: Gece Sineması",
    modalDescLabel: "Açıklama (İsteğe Bağlı)",
    modalDescPlaceholder: "Örn: Yumuşak tizler, sıcak bas",
    modalDefaultDesc: "Kullanıcı özel EQ profili",
    cancelBtn: "İptal",
    saveBtn: "Kaydet",
    presets: {
      "soundpulse-signature": {
        name: "SoundPulse Özel (Signature)",
        description: "Güçlü baslar, net vokaller ve parlak tizler",
      },
      "bass-booster": {
        name: "Bas Güçlendirici",
        description: "Küçük hoparlör uyumlu dolgun alt frekanslar",
      },
      "gaming-fps": {
        name: "Oyun / FPS (Ayak Sesi)",
        description: "Ayak seslerini ve yön ipuçlarını öne çıkarır",
      },
      "podcast-vocal": {
        name: "Podcast / Net Konuşma",
        description: "İnsan sesini berraklaştırır, dip uğultuyu azaltır",
      },
      acoustic: {
        name: "Akustik / Enstrüman",
        description: "Doğal enstrüman tınısı ve sıcak sahne dengesi",
      },
      flat: {
        name: "Düz (Flat)",
        description: "Tüm bantlar 0 dB nötr referans eğrisi",
      },
    },
  },
};
