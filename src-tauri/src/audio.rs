use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioDevice {
    pub id: String,
    pub name: String,
    pub is_default: bool,
}

#[cfg(target_os = "windows")]
pub fn get_playback_devices() -> Result<Vec<AudioDevice>, String> {
    use windows::Win32::Devices::FunctionDiscovery::PKEY_Device_FriendlyName;
    use windows::Win32::Media::Audio::{
        eConsole, eRender, IMMDevice, IMMDeviceEnumerator, MMDeviceEnumerator, DEVICE_STATE_ACTIVE,
    };
    use windows::Win32::System::Com::StructuredStorage::PropVariantClear;
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CoTaskMemFree, CoUninitialize, CLSCTX_ALL,
        COINIT_MULTITHREADED, STGM_READ,
    };

    unsafe {
        let hr = CoInitializeEx(None, COINIT_MULTITHREADED);
        let should_uninit = hr.is_ok();

        let result = (|| -> Result<Vec<AudioDevice>, String> {
            let enumerator: IMMDeviceEnumerator =
                CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)
                    .map_err(|e| format!("IMMDeviceEnumerator oluşturulamadı: {e}"))?;

            let default_id = enumerator
                .GetDefaultAudioEndpoint(eRender, eConsole)
                .ok()
                .and_then(|dev| get_device_id(&dev).ok());

            let collection = enumerator
                .EnumAudioEndpoints(eRender, DEVICE_STATE_ACTIVE)
                .map_err(|e| format!("Ses çıkış aygıtları listelenemedi: {e}"))?;

            let count = collection
                .GetCount()
                .map_err(|e| format!("Aygıt sayısı alınamadı: {e}"))?;

            let mut devices = Vec::with_capacity(count as usize);

            for i in 0..count {
                let device: IMMDevice = match collection.Item(i) {
                    Ok(d) => d,
                    Err(_) => continue,
                };

                let id = get_device_id(&device).unwrap_or_else(|_| format!("device-{i}"));
                let name = match get_device_friendly_name(&device) {
                    Ok(n) if !n.trim().is_empty() => n,
                    _ => continue,
                };

                let is_default = default_id.as_deref() == Some(id.as_str());
                devices.push(AudioDevice {
                    id,
                    name,
                    is_default,
                });
            }

            // Keep default device first for convenience
            devices.sort_by(|a, b| b.is_default.cmp(&a.is_default).then(a.name.cmp(&b.name)));
            Ok(devices)
        })();

        unsafe fn get_device_id(device: &IMMDevice) -> Result<String, String> {
            let pwstr = device
                .GetId()
                .map_err(|e| format!("Aygıt kimliği alınamadı: {e}"))?;
            let id = pwstr.to_string().unwrap_or_default();
            CoTaskMemFree(Some(pwstr.0 as *const _));
            Ok(id)
        }

        unsafe fn get_device_friendly_name(device: &IMMDevice) -> Result<String, String> {
            let store = device
                .OpenPropertyStore(STGM_READ)
                .map_err(|e| format!("Özellik deposu açılamadı: {e}"))?;
            let mut prop = store
                .GetValue(&PKEY_Device_FriendlyName)
                .map_err(|e| format!("Aygıt adı okunamadı: {e}"))?;
            let name = prop.to_string();
            let _ = PropVariantClear(&mut prop);
            Ok(name)
        }

        if should_uninit {
            CoUninitialize();
        }

        result
    }
}

#[cfg(not(target_os = "windows"))]
pub fn get_playback_devices() -> Result<Vec<AudioDevice>, String> {
    Ok(vec![])
}
