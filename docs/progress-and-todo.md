# 📍 Progress, Gap Analysis & To-Do List: Acoptimizer

**Project:** Acoptimizer (FST Smart Climate Control & Digital Twin)  
**Terakhir Diperbarui:** 22 Oktober 2026  
**Status Saat Ini:**  
- **Track B (Web Digital Twin):** **Stage 0 s/d Stage 7 sebagian besar telah selesai (~75% MVP UI/3D)**. Model 3D eksterior & interior *cutaway* Gedung FST 7 lantai, denah 2D interaktif, kompas 3D dinamis, sidebar/panel detail, dan logika domain 8 aturan otomasi sudah berjalan dengan simulasi lokal. Fokus berikutnya adalah perbaikan bug logika simulasi/layer, fungsionalitas Remote Override & Alert real-time (Stage 9), serta integrasi MQTT Broker (Stage 8).
- **Track A (Hardware IoT):** Perakitan komponen di breadboard selesai; masih **terblokir (*blocked*)** pada *power-on test* & debugging daya ESP32 serta penulisan firmware C++.
- **Track C (Backend & Persistence):** Belum dimulai (menunggu setup Docker Mosquitto & Supabase).

---

## 📊 Ringkasan Progres Per Fase (Web App)

| Stage | Area | Status | Progres | Catatan Aktual di Codebase (`src/`) |
|---|---|---|---|---|
| **Stage 0** | Prasyarat & Lingkungan | ✅ Selesai | 100% | Node.js, Git, Vite 8, TypeScript 6 siap digunakan. |
| **Stage 1** | Scaffold & Fondasi Web | ✅ Selesai | 90% | Vite + React 19 + TS + Tailwind v4 di root repo; dependensi 3D, Zustand, Zod, MQTT, Recharts terinstal. Token CSS One UI tersedia di `src/index.css`. (Kurang setup `vitest`). |
| **Stage 2** | Domain, Kontrak & Otomasi | 🟡 Hampir Selesai | 80% | `contract.ts`, `automation.ts` (8 kasus PRD), `roomStatus.ts`, `energy.ts` sudah dibuat. **Kurang:** unit test (`*.test.ts`) & dokumen acuan firmware `docs/automation-rules.md`. |
| **Stage 3** | Model Spasial Gedung FST | ✅ Selesai | 95% | `params.ts` & `generator.ts` memetakan 7 lantai Atrium, void tengah, 2 core (Lobby Sarjana Utara & Pascasarjana Selatan), tangga imperial + 2 lift, teater, kantin, mushola, dan Ruang Pilot `6-U1` (R.601). |
| **Stage 4** | Data Layer & Mock Simulator | 🟡 Parsial | 55% | `roomStore.ts`, `viewStore.ts`, dan `MockSimulation.ts` sudah berjalan. **Kurang:** abstraksi interface `DataSource`, ring buffer riwayat (`history.ts`), hook `useNow`, dan perbaikan bug `hasDevice` di simulator. |
| **Stage 5** | Antarmuka 2D, HUD & Panel | ✅ Selesai | 85% | `AppSidebar`, `SidePanel` (Building/Floor/Room view), `FloorPlan2D` (pan/zoom/pinch), `PanelTopControls`, `FloorRail`, `CompassHUD`, `LayerSwitcher`, dan 3 modal (`Automations`, `Settings`, `Account`) sudah berjalan. **Kurang:** grafik riwayat (`HistoryChart`) & sinkronisasi URL (`?floor=&room=`). |
| **Stage 6** | Visual 3D Building View | ✅ Selesai | 90% | `FstBuildingExterior.tsx` & `Building3D.tsx` menampilkan fasad otentik FST, kubah hijau, panel surya PV, taman void pohon cemara, parkiran kampus, hover lantai, dan fitur "Buka Atap" (*cutaway*). |
| **Stage 7** | Floor Focus & 3D Cutaway | ✅ Selesai | 90% | `Floor3DCutaway.tsx` menampilkan potongan 3D per lantai, tangga imperial setengah lingkaran, lift detail, Saintek Hub Lounge, ruang teater berundak, kantin Lt 1, furnitur simbolis, beacon Ruang Pilot R.601, dan transisi kamera halus di `TwinCanvas.tsx`. |
| **Stage 8** | Integrasi MQTT Broker | ⬜ Belum Dimulai | 0% | Library `mqtt` sudah di `package.json`, tetapi belum ada `infra/docker-compose.yml` (Mosquitto), `MqttSource.ts`, maupun `scripts/mock-device.ts`. |
| **Stage 9** | Remote Override & Alerts | 🟡 UI Statis | 20% | Tombol Override di `SidePanel.tsx` & menu Notifikasi di `AppSidebar.tsx` baru berupa tampilan statis (belum ada aksi, ack, countdown, maupun `AlertEngine`). |
| **Stage 10** | Multi-Layer Visualization | 🟡 Parsial | 40% | UI `LayerSwitcher` serta warna layer `status` & `temperature` sudah jalan. **Kurang:** logika warna untuk layer `presence` & `energy`, komponen `Legend`, dan efek `HeatGlow`. |
| **Stage 11** | Mode Pameran (Kiosk) & Demo | ⬜ Belum Dimulai | 0% | Belum ada mode `?kiosk=1`, auto-rotate idle, story cards, QR code, maupun `DemoPanel` (pemicu skenario presentasi). |
| **Stage 12** | Integrasi Supabase | ⬜ Belum Dimulai | 0% | Menunggu skema database & bridge dari Track C. |

---

## ⚠️ Daftar Kekurangan, Bug & Hal yang Perlu Diperbaiki Saat Ini

Berdasarkan audit mendalam antara kode di `src/` dan dokumen spesifikasi di `/docs/`, berikut adalah temuan utama yang perlu segera diperbaiki:

### 1. Bug Logika & Inkonsistensi Data (Prioritas Tinggi)
1. **Bug Simulator Mengubah Semua Ruangan Menjadi `hasDevice: true` (`roomStore.ts` & `MockSimulation.ts`)**
   - **Masalah:** Di `src/stores/roomStore.ts` (baris 78), fungsi `updateTelemetry()` selalu memaksa `hasDevice: true` setiap kali telemetri masuk. Sementara itu, `useMockSimulation` di `src/data/MockSimulation.ts` memilih ruangan secara acak dari seluruh `Object.keys(rooms)` (termasuk toilet, tangga darurat, taman atrium, dan lorong terbuka). Akibatnya, ruangan non-AC ikut memiliki suhu/status AC dan status `NO_DEVICE` ("Belum terpasang") hilang dari seluruh gedung.
   - **Solusi:** Filter simulasi hanya untuk ruangan yang memiliki AC (`hasAc: true`). Pisahkan properti `hasDevice: true` (khusus ruang uji fisik `6-U1` / R.601) dari `isDemo: true` (ruangan simulasi), sehingga ruang uji fisik dan ruang simulasi demo tetap dapat dibedakan sesuai PRD §1 & §5.2.
2. **Layer Visualisasi "Presensi" dan "Daya (kW)" Belum Berfungsi (`FloorPlan2D.tsx` & `Floor3DCutaway.tsx`)**
   - **Masalah:** Fungsi `getStatusColor(status, layer, temp)` di `src/features/plan2d/FloorPlan2D.tsx` hanya menangani `layer === "temperature"` dan langsung jatuh ke `switch (status)`. Saat pengguna memilih tab **Presensi** atau **Daya (kW)** di `LayerSwitcher` (atau menu **Analisis Energi** di Sidebar), warna ruangan di 2D maupun 3D tidak berubah sama sekali.
   - **Solusi:** Tambahkan percabangan warna untuk `layer === "presence"` (hijau saat ada orang, abu muda saat kosong) dan `layer === "energy"` (gradasi warna berdasarkan beban kW dari `calculatePowerKW`), serta tambahkan komponen **Legend** dinamis di HUD.
3. **Perhitungan Daya Listrik (`kW`) Tidak Konsisten (`SidePanel.tsx` vs `energy.ts`)**
   - **Masalah:** `src/domain/energy.ts` mendefinisikan `DEFAULT_AC_RATING_KW = 1.2` (Normal = `1.2 kW`, Eco = `0.72 kW`), tetapi tidak pernah diimpor. Sebaliknya, `SidePanel.tsx` (baris 249, 270, 515) menghitung daya secara *hardcoded* dengan rumus `normal * 0.85 + eco * 0.45`.
   - **Solusi:** Gunakan `calculatePowerKW()` dan `formatRupiah()` dari `src/domain/energy.ts` di seluruh komponen UI agar konsisten dengan PRD.
4. **Belum Ada Timer Evaluasi Status Berkala (`useNow`)**
   - **Masalah:** `deriveRoomStatus(live, now)` hanya dievaluasi ulang ketika ada perubahan state/render. Jika sebuah perangkat berhenti mengirim sinyal, statusnya tidak otomatis berubah menjadi `OFFLINE` tepat setelah 90 detik tanpa adanya pemicu render.
   - **Solusi:** Buat hook `useNow(5000)` (tick tiap 5 detik) untuk memastikan transisi berbasis waktu (`OFFLINE` > 90s, `TRANSITION` → `WASTE` ≥ 15m, dan batas jam kerja 18.00 WIB) selalu akurat.

### 2. Fitur Fungsional Utama yang Masih Berupa Mock / Belum Aktif
5. **Tombol Remote Override Belum Memiliki Aksi (`SidePanel.tsx`)**
   - **Masalah:** Tombol `Normal 22°`, `Eco 27°`, dan `Matikan` pada detail ruangan belum memiliki `onClick` handler, belum ada tombol `Auto (Release)`, pilihan durasi override, konfirmasi, maupun status pengiriman command (`pending → sent → acked/failed`).
   - **Solusi:** Hubungkan tombol override ke action di `roomStore` / `DataSource.sendCommand()`, tampilkan badge `OVERRIDE` beserta sisa waktunya, dan terapkan efeknya langsung pada simulator maupun MQTT.
6. **Sistem Peringatan Dini / Alert Real-Time Belum Ada (`AlertEngine` & Notifikasi)**
   - **Masalah:** Salah satu tujuan utama di PRD (G3 — keselamatan mahasiswa terkunci di luar jam operasional ≥ 18.00 & deteksi AC rusak/anomali > 29°C) belum memiliki sistem notifikasi/toast maupun daftar alert. Tombol lonceng `Notifikasi (0 Alert)` di `AppSidebar.tsx` belum melakukan apa-apa.
   - **Solusi:** Bangun `AlertEngine` yang memantau perubahan status ruangan ke `AFTER_HOURS_OCCUPIED`, `ANOMALY`, `WASTE`, dan `OFFLINE`, lengkap dengan *toast notification*, badge jumlah alert aktif di sidebar, dan fitur klik alert untuk *fly-to* kamera ke ruangan terkait.
7. **Grafik Riwayat Telemetri (`HistoryChart`) Belum Ada**
   - **Masalah:** Paket `recharts` sudah terinstal di `package.json`, tetapi belum ada penyimpanan riwayat (*ring buffer* per ruangan) maupun grafik tren suhu & kelembapan di `SidePanel.tsx` (PRD WEB-3).
   - **Solusi:** Buat `history.ts` untuk menyimpan riwayat pembacaan per ruangan dan tampilkan grafik mini (*sparkline/area chart*) di panel detail ruangan.
8. **Modal Pengaturan (`SettingsModal.tsx`) Belum Terhubung ke Store Global**
   - **Masalah:** Perubahan nilai ambang suhu, durasi *grace period* (15 mnt), *auto-off* (120 mnt), URL broker MQTT, dan tarif listrik per kWh hanya tersimpan di state lokal modal dan tidak memengaruhi perhitungan `evaluateAutomation`, `deriveRoomStatus`, maupun `energy.ts`.
   - **Solusi:** Pindahkan konfigurasi ke Zustand store (dengan persistensi `localStorage`) agar perubahan pengaturan langsung berdampak pada simulasi dan kalkulasi dashboard.
9. ** belum Ada Mode Skenario Demo (`DemoPanel`) untuk Presentasi / Sidang / Booth**
   - **Masalah:** Saat presentasi di depan dosen penguji atau pengunjung booth, tim butuh cara instan untuk mendemonstrasikan kasus spesifik (mis. *"Simulasikan kelas kosong 15 menit → AC pindah ke Eco"*, *"Simulasikan ada mahasiswa terkunci jam 20.00 → Muncul Alert Ungu"*, *"Simulasikan AC rusak suhu 31°C"*). Saat ini simulasi berjalan acak sepenuhnya.
   - **Solusi:** Tambahkan kontrol skenario demo (bisa diakses cepat lewat tombol/shortcut atau di dalam panel) untuk memicu ke-8 kasus tabel otomasi secara deterministik pada Ruang Pilot R.601.

### 3. Optimasi Performa, Arsitektur & Kebersihan Kode
10. **Update State Kamera Setiap Frame di `TwinCanvas.tsx`**
    - **Masalah:** Di `TwinCameraController` (`src/features/twin3d/TwinCanvas.tsx` baris 77), `setCameraAzimuth(azimuth)` dipanggil di dalam `useFrame` pada setiap frame (60 kali/detik) meskipun kamera sedang diam. Ini memicu update Zustand store terus-menerus.
    - **Solusi:** Hanya panggil `setCameraAzimuth` jika selisih sudut `Math.abs(azimuth - prevAzimuth) > 0.01` radian.
11. **File Duplikat Tidak Terpakai (`src/features/room/RoomSheet.tsx`)**
    - **Masalah:** `RoomSheet.tsx` sudah digantikan oleh `SidePanel.tsx` dan tidak lagi diimpor di mana pun.
    - **Solusi:** Hapus `RoomSheet.tsx` atau konsolidasikan sub-komponennya ke dalam `SidePanel.tsx`.
12. **Sinkronisasi Dokumen Arsitektur Gedung (`spesifikasi-gedung.md` vs `generator.ts`)**
    - **Catatan:** Berdasarkan referensi foto asli di `docs/reference/FST-building-photo/teater-room-in-corner-every-floor.png`, sudut Timur (NE & SE) telah diimplementasikan sebagai Ruang Teater berundak dan sudut Barat (NW & SW) sebagai Toilet + Tangga Darurat. Dokumen `web-implementation-plan.md` perlu diberi catatan agar sinkron dengan implementasi visual terbaru.

---

## 🛠️ Track A: Hardware & Firmware IoT (PIC: Ulil & Irsyad)
*Fase perakitan fisik komponen IoT ke breadboard dan firmware ESP32.*

- [x] Memilih komponen (ESP32, mmWave HLK-LD2410C, DHT22, KY-005).
- [x] Penempatan ESP32 di breadboard menggunakan teknik *straddling* (menggantung).
- [x] Membuat "Jembatan Setrum" (Jalur distribusi daya 5V, 3.3V, dan GND).
- [x] *Wiring* sensor mmWave HLK-LD2410C (Pin 13).
- [x] *Wiring* sensor suhu DHT22 (Pin 15, daya 3.3V).
- [x] *Wiring* IR Transmitter KY-005 (Pin 4, daya 5V).
- [x] *Wiring* LED Hijau (Pin 16) & LED Merah (Pin 17) menggunakan resistor 220 Ohm.
- [ ] **[BLOCKED]** *Power-on test* & *Hardware Debugging* (Mengatasi isu lampu indikator merah ESP32 tidak menyala saat dicolok USB laptop).
- [ ] Rekam raw/protocol kode IR remote AC ruang kelas FST (Normal 22°C, Eco 27°C, Power OFF).
- [ ] Implementasi Firmware ESP32 C++ di folder `/firmware` (sesuai kontrak `docs/web-implementation-plan.md` Bagian D):
  - [ ] WiFi & MQTT Client dengan `PubSubClient` (reconnect non-blocking).
  - [ ] Sinkronisasi waktu NTP (`Asia/Jakarta` / WIB) untuk aturan jam kerja `< 18:00`.
  - [ ] Pembacaan sensor DHT22 & radar mmWave HLK-LD2410.
  - [ ] Logika otomasi 8 kasus sesuai `src/domain/automation.ts`.
  - [ ] IR Transmitter dengan `IRremoteESP8266` (kode Normal 22°C / Eco 27°C / OFF).
  - [ ] Publisher telemetri ke `acoptimizer/v1/6-U1/telemetry` (on-change + heartbeat 30s, `retain = true`).
  - [ ] Subscriber command override (`acoptimizer/v1/6-U1/cmd`) + pengiriman `ack`.
  - [ ] Last Will & Testament (`acoptimizer/v1/6-U1/status` → `"offline"`, `retain = true`).

---

## 🖥️ Track B: Frontend Web App — Digital Twin Gedung FST (PIC: Rifqi)

### Stage 0 & 1: Prasyarat, Scaffold & Fondasi Web
- [x] Verifikasi lingkungan pengembangan & Git repository.
- [x] Inisialisasi Vite + React 19 + TypeScript.
- [x] Konfigurasi Tailwind CSS v4 & design tokens One UI-like di `src/index.css`.
- [x] Instalasi dependensi 3D (`three`, `@react-three/fiber`, `@react-three/drei`), state (`zustand`), validasi (`zod`), MQTT client (`mqtt`), chart (`recharts`), dan ikon (`lucide-react`).
- [ ] Konfigurasi `vitest` di `package.json` untuk menjalankan unit test domain.

### Stage 2: Domain, Kontrak & Aturan Otomasi
- [x] Skema Zod untuk `TelemetryPayload`, `DeviceStatusPayload`, `CommandPayload`, dan `AckPayload` + topic helpers di `src/domain/contract.ts`.
- [x] Implementasi pure function `evaluateAutomation` (8 kasus PRD) di `src/domain/automation.ts`.
- [x] Implementasi `deriveRoomStatus` (9 prioritas status ruangan) di `src/domain/roomStatus.ts`.
- [x] Kalkulasi estimasi daya listrik (`calculatePowerKW`) & format Rupiah di `src/domain/energy.ts`.
- [ ] Unit test (`src/domain/*.test.ts`) untuk memverifikasi ke-8 kasus otomasi dan prioritas status ruangan.
- [ ] Dokumentasi `docs/automation-rules.md` sebagai acuan uji silang dengan firmware ESP32.

### Stage 3: Model Spasial Parametrik Gedung FST (Atrium 7 Lantai)
- [x] Parameter dimensi gedung di `src/building/params.ts`.
- [x] Generator poligon & katalog ruangan 7 lantai di `src/building/generator.ts` (void atrium tengah, 2 core Utara/Selatan, tangga imperial + lift, ruang teater sudut Timur, toilet & tangga darurat sudut Barat, kantin & area belajar komunal Lt 1).
- [x] Penetapan Ruang Uji Coba Pilot pada **Ruang 601** (`slotId: "6-U1"`).

### Stage 4: Data Layer Abstraction & Simulator
- [x] Zustand `roomStore.ts` & `viewStore.ts`.
- [x] Simulator client `MockSimulation.ts` berbasis `evaluateAutomation`.
- [ ] **Perbaikan Bug:** Pastikan `MockSimulation.ts` hanya mensimulasikan ruangan ber-AC (`hasAc: true`) dan tidak menimpa flag `hasDevice` milik ruang pilot `6-U1`.
- [ ] Implementasi ring buffer riwayat telemetri per ruangan (`src/data/history.ts`).
- [ ] Implementasi abstraksi `DataSource` (`MockSource`, `MqttSource`, `SupabaseSource`) yang dapat dipilih via environment variable `VITE_DATA_SOURCE`.
- [ ] Implementasi hook timer `useNow` (interval 5 detik) untuk evaluasi status real-time (`OFFLINE`, `WASTE`, pergantian jam kerja).

### Stage 5: Antarmuka 2D, HUD & Panel Detail
- [x] Layout utama `App.tsx` dengan `AppSidebar` (hover-expand), area visual 3/4, dan `SidePanel` 1/4.
- [x] Kontrol HUD: `PanelTopControls` (2D/3D toggle, status koneksi, tombol kembali, tombol Buka Atap), `CompassHUD` (kompas mata angin interaktif U/T/S/B), `FloorRail` (navigasi Lt 7–1), `LayerSwitcher`.
- [x] `FloorPlan2D.tsx` (SVG interaktif dengan fitur drag pan, scroll wheel zoom, pinch zoom, dan tombol reset).
- [x] `SidePanel.tsx` dengan 3 mode tampilan: Ringkasan Gedung FST, Detail Lantai, dan Detail Ruangan + penjelasan aturan otomasi (`RuleExplainer`).
- [x] Modal pendukung: `AutomationsModal.tsx`, `SettingsModal.tsx`, `AccountModal.tsx`.
- [ ] **Perbaikan:** Gunakan `calculatePowerKW` dari `src/domain/energy.ts` pada kalkulasi kW di `SidePanel.tsx`.
- [ ] Tambahkan grafik riwayat suhu & kelembapan (`HistoryChart` dengan Recharts) di detail ruangan `SidePanel.tsx`.
- [ ] Hubungkan state `SettingsModal.tsx` ke Zustand store agar perubahan parameter otomasi & tarif PLN langsung berlaku.
- [ ] Bersihkan file `src/features/room/RoomSheet.tsx` yang sudah digantikan oleh `SidePanel.tsx`.

### Stage 6 & 7: Visual 3D Building View & Floor Cutaway Inspection
- [x] Eksterior 3D Gedung FST (`FstBuildingExterior.tsx` & `Building3D.tsx`): dinding krem & pilaster merah terakota, colonnade Lt 1, kanopi kuning, jendela lengkung Islamik Lt 7, atap limasan genteng + panel surya PV + 2 kubah hijau, taman void pohon cemara, jalan & parkiran.
- [x] Fitur "Buka Atap" (*cutaway* di mode gedung) & interaksi double-click lantai untuk masuk ke mode fokus lantai.
- [x] Interior 3D Cutaway per lantai (`Floor3DCutaway.tsx`): pelat lantai berlubang void, balkon selasar dengan tanaman gantung, tangga imperial setengah lingkaran, 2 unit lift detail, Saintek Hub Lounge, ruang teater amphitheater, kantin Lt 1, furnitur kelas, dan penanda khusus Ruang Pilot R.601.
- [x] Transisi kamera mulus (`TwinCameraController` di `TwinCanvas.tsx`) saat berpindah antara Building, Floor, dan Room + reset arah Utara dari kompas.
- [ ] **Optimasi Performa:** Batasi pemanggilan `setCameraAzimuth` di `useFrame` (`TwinCanvas.tsx`) hanya saat sudut kamera benar-benar berubah, dan tambahkan *lazy loading* untuk `TwinCanvas`.
- [ ] Tambahkan navigasi keyboard (`Esc` untuk kembali ke level atas, panah `↑`/`↓` untuk pindah lantai) & sinkronisasi URL query params (`?floor=6&room=6-U1`).

### Stage 8: Integrasi MQTT Broker (Mosquitto Docker)
- [ ] Buat `infra/docker-compose.yml` & konfigurasi Mosquitto (`listener 1883` TCP untuk ESP32 & `listener 9001` WebSocket untuk browser).
- [ ] Implementasi `MqttSource.ts` menggunakan `mqtt` (subscribe `acoptimizer/v1/+/telemetry`, `+/status`, `+/ack` + validasi Zod).
- [ ] Buat script `scripts/mock-device.ts` (Node.js) untuk meniru node ESP32 Ruang 601 melalui protokol TCP 1883.
- [ ] Mode *Hybrid Demo*: Ruang 601 (`6-U1`) membaca data asli dari MQTT, sementara ruangan kelas lain diisi oleh simulator demo.

### Stage 9: Remote Override & Real-time Alerts
- [ ] Aktifkan tombol **Remote Override** (`Normal 22°`, `Eco 27°`, `Matikan`, dan `Kembali Auto`) di `SidePanel.tsx` beserta pilihan durasi (30/60/120 menit).
- [ ] Tampilkan siklus status perintah (`pending → sent → acked / failed`) dan badge countdown `OVERRIDE` pada ruangan.
- [ ] Implementasi `AlertEngine` untuk mendeteksi kondisi darurat/anomali:
  - `AFTER_HOURS_OCCUPIED`: Peringatan keselamatan ada orang di luar jam operasional ($\ge$ 18.00 WIB).
  - `ANOMALY`: Ada penghuni tetapi suhu ruangan $> 29^\circ\text{C}$ (indikasi AC rusak/mati).
  - `WASTE`: Ruangan kosong $\ge 15$ menit tetapi AC masih menyala normal.
  - `OFFLINE`: Perangkat tidak mengirim heartbeat $> 90$ detik.
- [ ] Buat panel/drawer daftar notifikasi saat menu **Notifikasi** di `AppSidebar.tsx` diklik (dengan fitur klik alert untuk langsung mengarahkan kamera ke ruangan tersebut).

### Stage 10: Multi-Layer Visualization (Penyempurnaan)
- [x] Komponen `LayerSwitcher.tsx` & pewarnaan untuk layer `status` dan `temperature`.
- [ ] **Perbaikan:** Implementasikan pewarnaan untuk layer `presence` (Presensi) dan `energy` (Daya kW) di `getStatusColor()`.
- [ ] Tambahkan komponen `Legend` dinamis di sudut kanvas agar pengguna memahami arti warna pada setiap layer.

### Stage 11: Mode Pameran (Kiosk) & Panel Skenario Demo
- [ ] Buat **Demo Scenario Trigger Panel** (untuk presentasi sidang & booth) agar operator/juri dapat langsung menguji skenario:
  1. *Kelas Aktif Kuliah* (Kasus #1 — Normal 22°C)
  2. *Jeda Singkat < 15 Menit* (Kasus #2 — Transisi)
  3. *Kelas Kosong $\ge$ 15 Menit* (Kasus #3 — Otomatis Eco 27°C)
  4. *Kelas Kosong $\ge$ 2 Jam* (Kasus #4 — Otomatis Mati)
  5. *Malam Hari Ada Mahasiswa Lembur / Terkunci* (Kasus #6 — Alert Keselamatan Ungu)
  6. *Anomali AC Rusak / Panas $> 29^\circ\text{C}$* (Kasus #8 — Alert Oranye)
- [ ] Implementasi Mode Kiosk (`?kiosk=1`): layar penuh, *auto-rotate* kamera saat idle 60 detik, *story cards* (Masalah $\rightarrow$ Solusi $\rightarrow$ Dampak), dan QR Code akses pengunjung.

---

## 🗄️ Track C: Backend & Data Persistence (PIC: Almarino)
- [ ] Setup Docker Compose untuk Mosquitto Broker & Supabase / Cloud Project.
- [ ] Migrasi tabel database (`rooms`, `room_state`, `sensor_logs`, `commands`, `alerts`, `settings`) beserta kebijakan RLS sesuai `docs/implementation-plan.md` Phase 1.
- [ ] Implementasi layanan Node.js MQTT-to-Supabase Bridge (mencatat telemetri dari Mosquitto ke Postgres & meneruskan perintah override).

---

## 🧪 Track D: QA & Pengujian Integrasi (PIC: Sulthan)
- [ ] Menyusun matriks pengujian 8 kasus otomasi (memastikan hasil `evaluateAutomation` di web, simulator, dan firmware ESP32 identik).
- [ ] Pengujian akurasi sensor mmWave HLK-LD2410 di ruang kelas (deteksi mahasiwa duduk diam vs ruangan kosong).
- [ ] Pengujian jangkauan dan keandalan sinyal IR Blaster KY-005 terhadap unit AC ruang kelas FST.
- [ ] Pengujian *end-to-end* latensi telemetri ($\le 2$ detik) dan eksekusi *remote override* ($\le 3$ detik).
