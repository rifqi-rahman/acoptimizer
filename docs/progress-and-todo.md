# 📍 Progress & To-Do List: Acoptimizer

**Project:** Acoptimizer (FST Smart Climate Control & Digital Twin)  
**Status Saat Ini:** Perencanaan Web Digital Twin Selesai, Menuju Eksekusi Web Stage 0 & 1 (Scaffold). Hardware dalam status perakitan (pending power-on test).

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
- [ ] **[BLOCKED]** *Power-on test* & *Hardware Debugging* (Mengatasi isu lampu indikator merah ESP32 tidak menyala saat dicolok USB laptop). *Note: Menunggu sesi perbaikan bersama teman.*
- [ ] Implementasi Firmware ESP32 C++ (sesuai kontrak `docs/web-implementation-plan.md` Bagian D):
  - [ ] WiFi & MQTT Client dengan PubSubClient (reconnect non-blocking).
  - [ ] Baca DHT22 & mmWave HLK-LD2410.
  - [ ] Logika otomasi 8 kasus sesuai tabel PRD.
  - [ ] IR Transmitter dengan IRremoteESP8266 (kode ON/OFF/Eco).
  - [ ] Publisher telemetri (on-change + heartbeat 30s, retained).
  - [ ] Subscriber command override + pengiriman ack.
  - [ ] Last Will & Testament (`status: offline`).

---

## 🖥️ Track B: Frontend Web App — Digital Twin Gedung FST (PIC: Rifqi)
*Fase pembangunan antarmuka Digital Twin (berdasarkan `web-implementation-plan.md`).*

### Stage 0: Prasyarat & Lingkungan
- [ ] Verifikasi Node.js ≥ 20 LTS & Docker Desktop.
- [ ] Menyiapkan branch git `feat/web-twin`.

### Stage 1: Scaffold & Fondasi Web
- [ ] Inisialisasi Vite + React 19 + TypeScript (`/web`).
- [ ] Konfigurasi Tailwind CSS v4 & token One UI-like (Samsung style).
- [ ] Setup path alias `@/` & instalasi komponen dasar shadcn/ui.
- [ ] Instalasi dependensi 3D (`three`, `@react-three/fiber`, `@react-three/drei`), state (`zustand`), MQTT client (`mqtt`), icons, motion, vitest.

### Stage 2: Domain, Kontrak & Aturan Otomasi
- [ ] Skema Zod untuk Telemetry, Status, Command, dan Ack.
- [ ] Implementasi pure function `evaluateAutomation` (8 kasus PRD) & `deriveRoomStatus` + unit test.
- [ ] Estimasi kalkulasi energi (kW/kWh).

### Stage 3: Model Spasial Parametrik Gedung FST (Atrium 7 Lantai)
- [ ] Generator poligon denah lantai: 22 ruang luar, void tengah, 2 core (tangga imperial + lift), 2 toilet & tangga darurat (NE & SW).
- [ ] Katalog ruangan: penomoran kelas (601, 602, dst.), mushola, teater, lobby Sarjana (Utara) & Pascasarjana (Selatan).
- [ ] Pengaturan slot target pilot (1 ruang kelas uji).

### Stage 4: Data Layer Abstraction & Mock
- [ ] Interface `DataSource` (Mock, MQTT, Supabase).
- [ ] Zustand `roomStore` & `viewStore` (state lantai, ruangan, layer).
- [ ] Implementasi `MockSource` untuk simulasi lokal mandiri tanpa hardware/broker.

### Stage 5: Antarmuka 2D & HUD
- [ ] `AppShell`, `TopBar` (status Live/Demo), `FloorRail` navigasi lantai.
- [ ] `FloorPlan2D` (SVG) interaktif per lantai (klik kamar -> buka detail).
- [ ] `RoomSheet` detail ruangan (suhu, kelembapan, presensi, AC mode, grafik riwayat, rule explainer).

### Stage 6: Visual 3D Building View (Atrium & Exploded Slabs)
- [ ] Canvas 3D dengan Three.js / R3F (lazy loaded, frameloop on-demand).
- [ ] Geometri prosedural pelat lantai dengan lubang void tengah, dinding cutaway, fasad kaca, dan taman lantai 1.
- [ ] Interaksi CameraControls: orbit drag, zoom pinch, pan 2 jari, touch-friendly.

### Stage 7: Floor Focus & Room Inspection 3D
- [ ] Animasi transisi kamera ke lantai terpilih (lantai atas naik & fade out).
- [ ] Label ruangan (`<Html>`), pin status IoT berdenyut pada ruang kelas pilot.
- [ ] Navigasi keyboard & deep link URL (`?floor=6&room=601`).

### Stage 8: Integrasi MQTT Broker (Mosquitto Docker)
- [ ] Docker Compose untuk Mosquitto (TCP 1883 untuk ESP32, WebSocket 9001 untuk browser).
- [ ] Implementasi `MqttSource` (browser connect via WS langsung ke Mosquitto).
- [ ] Script Node.js `mock-device.ts` (mengirim via TCP 1883 meniru ESP32).
- [ ] Uji coba end-to-end data MQTT masuk ke tampilan denah secara real-time.

### Stage 9: Remote Override & Real-time Alerts
- [ ] Kontrol Override AC dari web (Normal, Eco, Matikan, Auto) + dialog konfirmasi & pengiriman via MQTT.
- [ ] Feedback visual status command (pending -> sent -> acked).
- [ ] Notifikasi darurat / alert: "Ada orang di luar jam operasional (≥18.00)" & anomali suhu.

### Stage 10: Multi-Layer Visualization
- [ ] Mode layer: Status Ruang, Suhu (Heatmap), Kehadiran Orang, dan Estimasi Energi.
- [ ] Visual HeatGlow lembut di lantai sesuai suhu sensor.

### Stage 11: Mode Pameran (Kiosk) & Demo Booth
- [ ] Fullscreen kiosk mode + auto-attract rotation saat idle 60s.
- [ ] Story cards alur sistem (Masalah -> Solusi -> Dampak hemat energi & safety).
- [ ] Demo scenario trigger panel (simulasi kondisi darurat/kelas kosong untuk juri).
- [ ] QR Code generator agar pengunjung bisa buka versi view di HP masing-masing.

---

## 🗄️ Track C: Backend & Data Persistence (PIC: Almarino)
- [ ] Setup Docker Supabase / Cloud Project.
- [ ] Migrasi database (`rooms`, `room_state`, `sensor_logs`, `commands`, `alerts`).
- [ ] Implementasi Supabase Bridge (merekam data MQTT ke database & rekap harian).