use serde::{Deserialize, Serialize};

pub const EQ_FREQUENCIES: [u32; 8] = [60, 150, 400, 1000, 2500, 6000, 12000, 16000];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BandGain {
    pub freq: u32,
    pub gain: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EqProfile {
    pub id: String,
    pub name: String,
    pub description: String,
    pub preamp: f64,
    pub bands: Vec<BandGain>,
    pub is_custom: bool,
}

pub fn built_in_presets() -> Vec<EqProfile> {
    vec![
        EqProfile {
            id: "soundpulse-signature".into(),
            name: "SoundPulse Özel (Signature)".into(),
            description: "Güçlü baslar, net vokaller ve parlak tizler".into(),
            preamp: -3.5,
            bands: make_bands([3.5, 2.0, -1.0, 0.0, 1.5, 3.0, 3.5, 2.5]),
            is_custom: false,
        },
        EqProfile {
            id: "bass-booster".into(),
            name: "Bas Güçlendirici".into(),
            description: "Küçük masaüstü hoparlörler için dolgun alt frekanslar".into(),
            preamp: -4.5,
            bands: make_bands([4.5, 4.5, 1.0, 0.0, 0.5, 1.0, 1.0, 0.0]),
            is_custom: false,
        },
        EqProfile {
            id: "gaming-fps".into(),
            name: "Oyun / FPS (Ayak Sesi)".into(),
            description: "Ayak seslerini ve yön ipuçlarını öne çıkarır".into(),
            preamp: -4.0,
            bands: make_bands([-3.5, -2.0, -1.0, 1.0, 3.5, 4.5, 3.5, 2.0]),
            is_custom: false,
        },
        EqProfile {
            id: "podcast-vocal".into(),
            name: "Podcast / Net Konuşma".into(),
            description: "İnsan sesini berraklaştırır, dip uğultuyu azaltır".into(),
            preamp: -3.5,
            bands: make_bands([-4.0, -2.5, 2.0, 3.5, 3.0, 1.0, -1.0, -1.5]),
            is_custom: false,
        },
        EqProfile {
            id: "acoustic".into(),
            name: "Akustik / Enstrüman".into(),
            description: "Doğal enstrüman tınısı ve sıcak sahne dengesi".into(),
            preamp: -2.5,
            bands: make_bands([1.0, 1.5, 1.5, 1.0, 2.5, 2.5, 2.0, 1.5]),
            is_custom: false,
        },
        EqProfile {
            id: "flat".into(),
            name: "Düz (Flat)".into(),
            description: "Tüm frekanslar nötr 0 dB referans eğrisi".into(),
            preamp: 0.0,
            bands: make_bands([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            is_custom: false,
        },
    ]
}

fn make_bands(gains: [f64; 8]) -> Vec<BandGain> {
    EQ_FREQUENCIES
        .iter()
        .zip(gains.iter())
        .map(|(&freq, &gain)| BandGain { freq, gain })
        .collect()
}
