use serde::Serialize;
use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};

use crate::presets::{BandGain, EQ_FREQUENCIES};

pub const DEFAULT_APO_DIR: &str = r"C:\Program Files\EqualizerAPO";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApoStatus {
    pub installed: bool,
    pub base_path: String,
    pub config_path: String,
    pub writable: bool,
    pub error: Option<String>,
}

pub fn resolve_apo_paths(custom_path: Option<&str>) -> (PathBuf, PathBuf) {
    let base = match custom_path.map(str::trim).filter(|s| !s.is_empty()) {
        Some(p) => PathBuf::from(p),
        None => PathBuf::from(DEFAULT_APO_DIR),
    };
    let config = base.join("config").join("config.txt");
    (base, config)
}

pub fn check_apo_installation(custom_path: Option<&str>) -> ApoStatus {
    let (base, config) = resolve_apo_paths(custom_path);
    let config_dir = base.join("config");

    let installed = base.exists() && config_dir.exists();
    if !installed {
        return ApoStatus {
            installed: false,
            base_path: base.to_string_lossy().to_string(),
            config_path: config.to_string_lossy().to_string(),
            writable: false,
            error: Some(format!(
                "Equalizer APO kurulum dizini bulunamadı: {}",
                config_dir.display()
            )),
        };
    }

    let test_probe = config_dir.join(".soundpulse_write_test.tmp");
    let writable = match File::create(&test_probe) {
        Ok(mut f) => {
            let _ = f.flush();
            drop(f);
            let _ = fs::remove_file(&test_probe);
            true
        }
        Err(_) => false,
    };

    ApoStatus {
        installed: true,
        base_path: base.to_string_lossy().to_string(),
        config_path: config.to_string_lossy().to_string(),
        writable,
        error: if writable {
            None
        } else {
            Some(
                "config.txt dizinine yazma izni yok. Equalizer APO klasör izinlerini kontrol edin veya uygulamayı yönetici olarak çalıştırın."
                    .to_string(),
            )
        },
    }
}

pub fn format_apo_config(
    device_name: &str,
    preamp: f64,
    bands: &[BandGain],
    bypassed: bool,
) -> String {
    if bypassed || device_name.trim().is_empty() {
        return "# SoundPulse EQ - Bypass (Kulaklık Modu / Devre Dışı)\r\nPreamp: 0.0 dB\r\n"
            .to_string();
    }

    let ordered_bands: Vec<String> = EQ_FREQUENCIES
        .iter()
        .map(|&freq| {
            let gain = bands
                .iter()
                .find(|b| b.freq == freq)
                .map(|b| b.gain.clamp(-12.0, 12.0))
                .unwrap_or(0.0);
            format!("{} {}", freq, format_db(gain))
        })
        .collect();

    format!(
        "Device: {}\r\nPreamp: {} dB\r\nGraphicEQ: {}\r\n",
        device_name.trim(),
        format_db(preamp.clamp(-12.0, 12.0)),
        ordered_bands.join("; ")
    )
}

fn format_db(val: f64) -> String {
    let rounded = (val * 10.0).round() / 10.0;
    if (rounded - rounded.trunc()).abs() < f64::EPSILON {
        format!("{:.0}", rounded)
    } else {
        format!("{:.1}", rounded)
    }
}

/// Atomically writes `config.txt` by writing to a temporary file in the same directory,
/// flushing to disk, and renaming over `config.txt`.
pub fn write_apo_config_atomic(
    config_path: &Path,
    content: &str,
) -> Result<(), String> {
    let parent = config_path
        .parent()
        .ok_or_else(|| "Geçersiz config.txt yolu".to_string())?;

    if !parent.exists() {
        return Err(format!(
            "Equalizer APO config dizini bulunamadı: {}",
            parent.display()
        ));
    }

    let tmp_path = parent.join("config.txt.tmp");

    {
        let mut file = File::create(&tmp_path).map_err(|e| {
            format!(
                "Geçici yapılandırma dosyası oluşturulamadı ({}): {e}",
                tmp_path.display()
            )
        })?;
        file.write_all(content.as_bytes())
            .map_err(|e| format!("Yapılandırma dosyasına yazılamadı: {e}"))?;
        file.sync_all()
            .map_err(|e| format!("Dosya diske eşitlenemedi: {e}"))?;
    }

    fs::rename(&tmp_path, config_path).map_err(|e| {
        let _ = fs::remove_file(&tmp_path);
        format!(
            "config.txt atomik olarak güncellenemedi ({}): {e}",
            config_path.display()
        )
    })?;

    Ok(())
}
