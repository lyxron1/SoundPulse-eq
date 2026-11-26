mod apo;
mod audio;
mod presets;

use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, State, WindowEvent};

use apo::{check_apo_installation, format_apo_config, resolve_apo_paths, write_apo_config_atomic, ApoStatus};
use audio::{get_playback_devices, AudioDevice};
use presets::{built_in_presets, BandGain, EqProfile};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyEqPayload {
    pub device_name: String,
    pub profile_id: String,
    pub preamp: f64,
    pub bands: Vec<BandGain>,
    pub bypassed: bool,
    pub custom_apo_path: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyEqResult {
    pub config_path: String,
    pub written_content: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TraySyncEvent {
    pub profile_id: String,
    pub preamp: f64,
    pub bands: Vec<BandGain>,
    pub bypassed: bool,
}

pub struct TrayHandles {
    pub preset_items: Vec<(String, CheckMenuItem<tauri::Wry>)>,
    pub bypass_item: CheckMenuItem<tauri::Wry>,
    pub show_item: MenuItem<tauri::Wry>,
    pub quit_item: MenuItem<tauri::Wry>,
}

fn tray_preset_label<'a>(id: &str, lang: &str, fallback: &'a str) -> &'a str {
    if lang == "tr" {
        match id {
            "soundpulse-signature" => "SoundPulse Özel (Signature)",
            "bass-booster" => "Bas Güçlendirici",
            "gaming-fps" => "Oyun / FPS (Ayak Sesi)",
            "podcast-vocal" => "Podcast / Net Konuşma",
            "acoustic" => "Akustik / Enstrüman",
            "flat" => "Düz (Flat)",
            _ => fallback,
        }
    } else {
        match id {
            "soundpulse-signature" => "SoundPulse Signature",
            "bass-booster" => "Bass Booster",
            "gaming-fps" => "Gaming / FPS (Footsteps)",
            "podcast-vocal" => "Podcast / Clear Voice",
            "acoustic" => "Acoustic / Instrument",
            "flat" => "Flat",
            _ => fallback,
        }
    }
}

pub struct AppState {
    pub inner: Mutex<InnerState>,
    pub tray: Mutex<Option<TrayHandles>>,
}

pub struct InnerState {
    pub device_name: String,
    pub active_profile_id: String,
    pub preamp: f64,
    pub bands: Vec<BandGain>,
    pub bypassed: bool,
    pub custom_apo_path: Option<String>,
}

impl Default for AppState {
    fn default() -> Self {
        let default_preset = built_in_presets().into_iter().next().unwrap();
        Self {
            inner: Mutex::new(InnerState {
                device_name: String::new(),
                active_profile_id: default_preset.id,
                preamp: default_preset.preamp,
                bands: default_preset.bands,
                bypassed: false,
                custom_apo_path: None,
            }),
            tray: Mutex::new(None),
        }
    }
}

fn sync_tray_checks(state: &AppState, active_profile_id: &str, bypassed: bool) {
    if let Ok(guard) = state.tray.lock() {
        if let Some(handles) = guard.as_ref() {
            let _ = handles.bypass_item.set_checked(bypassed);
            for (id, item) in &handles.preset_items {
                let _ = item.set_checked(!bypassed && id == active_profile_id);
            }
        }
    }
}

#[tauri::command]
fn get_audio_devices() -> Result<Vec<AudioDevice>, String> {
    get_playback_devices()
}

#[tauri::command]
fn check_equalizer_apo(custom_path: Option<String>) -> ApoStatus {
    check_apo_installation(custom_path.as_deref())
}

#[tauri::command]
fn apply_eq_profile(
    state: State<'_, AppState>,
    payload: ApplyEqPayload,
) -> Result<ApplyEqResult, String> {
    {
        let mut inner = state.inner.lock().map_err(|_| "Durum kilidi alınamadı".to_string())?;
        inner.device_name = payload.device_name.clone();
        inner.active_profile_id = payload.profile_id.clone();
        inner.preamp = payload.preamp;
        inner.bands = payload.bands.clone();
        inner.bypassed = payload.bypassed;
        inner.custom_apo_path = payload.custom_apo_path.clone();
    }

    sync_tray_checks(&state, &payload.profile_id, payload.bypassed);

    let (_, config_path) = resolve_apo_paths(payload.custom_apo_path.as_deref());
    let content = format_apo_config(
        &payload.device_name,
        payload.preamp,
        &payload.bands,
        payload.bypassed,
    );

    write_apo_config_atomic(&config_path, &content)?;

    Ok(ApplyEqResult {
        config_path: config_path.to_string_lossy().to_string(),
        written_content: content,
    })
}

fn custom_profiles_file(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Uygulama veri dizini alınamadı: {e}"))?;
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Uygulama veri dizini oluşturulamadı: {e}"))?;
    }
    Ok(dir.join("custom_profiles.json"))
}

#[tauri::command]
fn load_custom_profiles(app: AppHandle) -> Result<Vec<EqProfile>, String> {
    let path = custom_profiles_file(&app)?;
    if !path.exists() {
        return Ok(vec![]);
    }
    let raw = fs::read_to_string(&path)
        .map_err(|e| format!("Özel profiller okunamadı: {e}"))?;
    let profiles: Vec<EqProfile> = serde_json::from_str(&raw)
        .map_err(|e| format!("Özel profiller ayrıştırılamadı: {e}"))?;
    Ok(profiles)
}

#[tauri::command]
fn save_custom_profiles(app: AppHandle, profiles: Vec<EqProfile>) -> Result<(), String> {
    let path = custom_profiles_file(&app)?;
    let json = serde_json::to_string_pretty(&profiles)
        .map_err(|e| format!("Profiller serileştirilemedi: {e}"))?;
    fs::write(&path, json).map_err(|e| format!("Özel profiller kaydedilemedi: {e}"))?;
    Ok(())
}

#[tauri::command]
fn pick_apo_directory() -> Result<Option<String>, String> {
    #[cfg(target_os = "windows")]
    {
        use windows::core::PCWSTR;
        use windows::Win32::System::Com::{
            CoCreateInstance, CoInitializeEx, CoTaskMemFree, CoUninitialize, CLSCTX_ALL,
            COINIT_APARTMENTTHREADED,
        };
        use windows::Win32::UI::Shell::{
            FileOpenDialog, IFileOpenDialog, FOS_PICKFOLDERS, SIGDN_FILESYSPATH,
        };

        unsafe {
            let hr = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
            let should_uninit = hr.is_ok();

            let result = (|| -> Result<Option<String>, String> {
                let dialog: IFileOpenDialog =
                    CoCreateInstance(&FileOpenDialog, None, CLSCTX_ALL)
                        .map_err(|e| format!("Klasör seçici açılamadı: {e}"))?;

                let opts = dialog
                    .GetOptions()
                    .map_err(|e| format!("Seçenekler alınamadı: {e}"))?;
                dialog
                    .SetOptions(opts | FOS_PICKFOLDERS)
                    .map_err(|e| format!("Klasör modu ayarlanamadı: {e}"))?;

                let title: Vec<u16> = "Equalizer APO Kurulum Klasörünü Seçin\0"
                    .encode_utf16()
                    .collect();
                let _ = dialog.SetTitle(PCWSTR(title.as_ptr()));

                match dialog.Show(None) {
                    Ok(()) => {
                        let item = dialog
                            .GetResult()
                            .map_err(|e| format!("Seçilen klasör alınamadı: {e}"))?;
                        let pwstr = item
                            .GetDisplayName(SIGDN_FILESYSPATH)
                            .map_err(|e| format!("Klasör yolu okunamadı: {e}"))?;
                        let path = pwstr.to_string().unwrap_or_default();
                        CoTaskMemFree(Some(pwstr.0 as *const _));
                        if path.is_empty() {
                            Ok(None)
                        } else {
                            Ok(Some(path))
                        }
                    }
                    Err(_) => Ok(None),
                }
            })();

            if should_uninit {
                CoUninitialize();
            }

            return result;
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(None)
    }
}

#[tauri::command]
fn set_tray_language(state: State<'_, AppState>, lang: String) -> Result<(), String> {
    let lang_norm = if lang == "tr" { "tr" } else { "en" };
    if let Ok(guard) = state.tray.lock() {
        if let Some(handles) = guard.as_ref() {
            for (id, item) in &handles.preset_items {
                let label = tray_preset_label(id, lang_norm, id);
                let _ = item.set_text(label);
            }
            if lang_norm == "tr" {
                let _ = handles.bypass_item.set_text("Bypass (Devre Dışı)");
                let _ = handles.show_item.set_text("Pencereyi Göster");
                let _ = handles.quit_item.set_text("Çıkış");
            } else {
                let _ = handles.bypass_item.set_text("Bypass (Disabled)");
                let _ = handles.show_item.set_text("Show Window");
                let _ = handles.quit_item.set_text("Quit");
            }
        }
    }
    Ok(())
}

#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
    if !url.starts_with("https://") && !url.starts_with("http://") {
        return Err("Yalnızca http/https bağlantıları açılabilir".to_string());
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &url])
            .spawn()
            .map_err(|e| format!("Bağlantı açılamadı: {e}"))?;
    }
    Ok(())
}

fn apply_from_tray(app: &AppHandle, preset_id: Option<&str>, toggle_bypass: bool) {
    let state = app.state::<AppState>();
    let presets = built_in_presets();

    let (device_name, profile_id, preamp, bands, bypassed, custom_apo_path) = {
        let mut inner = match state.inner.lock() {
            Ok(g) => g,
            Err(_) => return,
        };

        if toggle_bypass {
            inner.bypassed = !inner.bypassed;
        } else if let Some(id) = preset_id {
            if let Some(preset) = presets.iter().find(|p| p.id == id) {
                inner.active_profile_id = preset.id.clone();
                inner.preamp = preset.preamp;
                inner.bands = preset.bands.clone();
                inner.bypassed = false;
            }
        }

        (
            inner.device_name.clone(),
            inner.active_profile_id.clone(),
            inner.preamp,
            inner.bands.clone(),
            inner.bypassed,
            inner.custom_apo_path.clone(),
        )
    };

    sync_tray_checks(&state, &profile_id, bypassed);

    if !device_name.trim().is_empty() {
        let (_, config_path) = resolve_apo_paths(custom_apo_path.as_deref());
        let content = format_apo_config(&device_name, preamp, &bands, bypassed);
        let _ = write_apo_config_atomic(&config_path, &content);
    }

    let _ = app.emit(
        "tray-state-updated",
        TraySyncEvent {
            profile_id,
            preamp,
            bands,
            bypassed,
        },
    );
}

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let presets = built_in_presets();
    let mut preset_items = Vec::new();

    for (idx, preset) in presets.iter().enumerate() {
        let item_id = format!("preset:{}", preset.id);
        let label = tray_preset_label(&preset.id, "en", &preset.name);
        let item = CheckMenuItem::with_id(
            app,
            item_id,
            label,
            true,
            idx == 0,
            None::<&str>,
        )?;
        preset_items.push((preset.id.clone(), item));
    }

    let bypass_item = CheckMenuItem::with_id(
        app,
        "bypass",
        "Bypass (Disabled)",
        true,
        false,
        None::<&str>,
    )?;
    let show_item = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let sep1 = PredefinedMenuItem::separator(app)?;
    let sep2 = PredefinedMenuItem::separator(app)?;

    let menu = Menu::new(app)?;
    for (_, item) in &preset_items {
        menu.append(item)?;
    }
    menu.append(&sep1)?;
    menu.append(&bypass_item)?;
    menu.append(&sep2)?;
    menu.append(&show_item)?;
    menu.append(&quit_item)?;

    {
        let state = app.state::<AppState>();
        if let Ok(mut guard) = state.tray.lock() {
            *guard = Some(TrayHandles {
                preset_items,
                bypass_item,
                show_item,
                quit_item,
            });
        };
    }

    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or("Varsayılan pencere ikonu bulunamadı")?;

    TrayIconBuilder::with_id("main-tray")
        .icon(icon)
        .tooltip("SoundPulse EQ")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            let id = event.id().as_ref();
            if let Some(preset_id) = id.strip_prefix("preset:") {
                apply_from_tray(app, Some(preset_id), false);
            } else if id == "bypass" {
                apply_from_tray(app, None, true);
            } else if id == "show" {
                show_main_window(app);
            } else if id == "quit" {
                app.exit(0);
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .setup(|app| {
            setup_tray(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_audio_devices,
            check_equalizer_apo,
            apply_eq_profile,
            load_custom_profiles,
            save_custom_profiles,
            pick_apo_directory,
            set_tray_language,
            open_external_url
        ])
        .run(tauri::generate_context!())
        .expect("SoundPulse EQ başlatılırken hata oluştu");
}
