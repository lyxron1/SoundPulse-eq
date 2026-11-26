# SoundPulse EQ

Windows için **Tauri v2 (Rust backend + React / TypeScript / Tailwind CSS)** ile geliştirilmiş, **Equalizer APO** tabanlı ultra hafif masaüstü ses ekolayzır (EQ) ve ses profili kontrol uygulaması.

An ultra-lightweight desktop audio equalizer (EQ) and sound profile controller for Windows, built with **Tauri v2 (Rust + React / TypeScript / Tailwind CSS)** and powered by **Equalizer APO**.

---

## Temel Özellikler / Key Features

- **Cihaz Kilidi (Device Lock):** Windows Core Audio (`IMMDeviceEnumerator`) ile aktif ses çıkış aygıtlarını otomatik listeler. `Device:` satırı sayesinde ekolayzır yalnızca seçtiğiniz masaüstü hoparlörde devreye girer; kulaklığa geçtiğinizde EQ otomatik olarak pasif kalır.
- **6 Hazır Ses Profili (6 Built-in Presets):**
  - **SoundPulse Özel (Signature):** Güçlü baslar, net vokaller ve parlak tizler
  - **Bas Güçlendirici:** Küçük masaüstü hoparlörler için dolgun alt frekanslar
  - **Oyun / FPS (Ayak Sesi):** Ayak seslerini ve yön ipuçlarını öne çıkarır
  - **Podcast / Net Konuşma:** İnsan sesini berraklaştırır, dip uğultuyu azaltır
  - **Akustik / Enstrüman:** Doğal enstrüman tınısı ve sıcak sahne dengesi
  - **Düz (Flat):** Tüm frekanslar nötr `0 dB` referans eğrisi
- **Canlı Frekans Tepki Eğrisi (Live Frequency Curve):** 8 bant (`60 Hz` – `16 kHz`) için gerçek zamanlı SVG frekans eğrisi ve `-12 dB` / `+12 dB` dikey fader kontrolleri + Preamp ayarı.
- **Özel Profil Kaydetme (Custom Profiles):** Kendi EQ ayarlarınızı kaydedin ve tek tıkla geçiş yapın (`custom_profiles.json`).
- **Sistem Tepsisi Desteği (System Tray):** Pencere kapatıldığında uygulama kapanmaz, sistem tepsisine küçülür. Sağ tık menüsünden hazır profiller arasında tek tıkla geçiş yapabilir veya **Bypass (Devre Dışı)** modunu açabilirsiniz.
- **Atomik Yapılandırma Yazımı:** `config.txt` dosyası geçici dosya üzerinden atomik olarak güncellenir.

---

## Kurulum ve Kullanım / Installation & Usage

### Gereksinimler / Prerequisites
1. Sisteminizde **[Equalizer APO](https://sourceforge.net/projects/equalizerapo/)** kurulu olmalıdır (varsayılan dizin: `C:\Program Files\EqualizerAPO`).
2. Equalizer APO kurulumu sırasında **Configurator** aracından EQ uygulamak istediğiniz hoparlör cihazını etkinleştirdiğinizden emin olun.
3. **`config` Klasörü Yazma İzni:** Uygulamanın `C:\Program Files\EqualizerAPO\config\config.txt` dosyasını güncelleyebilmesi için `config` klasörüne yazma izni gerekir. İzin hatası alırsanız `C:\Program Files\EqualizerAPO\config` klasörünün Güvenlik (Security) ayarlarından kullanıcınıza **Yazma / Değiştirme** izni verin veya uygulamayı yönetici olarak çalıştırın.

### Çalıştırma / Running the App
- **Hazır Uygulama:** [Releases](../../releases) sekmesinden `soundpulse-eq.exe` dosyasını indirip doğrudan çalıştırabilirsiniz.
- **Kaynak Koddan Derleme (Build from Source):**
  ```powershell
  npm install
  npm run tauri build -- --no-bundle
  ```
  Derlenen `.exe` dosyası `src-tauri/target/release/soundpulse-eq.exe` konumunda oluşturulur.

---

## Yasal Uyarı / Disclaimer

Bu proje Anker veya Soundcore ile ilişkili değildir; Equalizer APO için geliştirilmiş bağımsız, açık kaynaklı bir arayüz uygulamasıdır.

*This project is not affiliated with, endorsed by, or connected to Anker or Soundcore; it is an independent, open-source frontend application developed for Equalizer APO.*
