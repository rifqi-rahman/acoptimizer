import { AcMode, DeviceMode } from "./contract";

export type RoomClimateStatus =
  | "OCCUPIED"             // Hijau: Ada orang & AC Normal
  | "TRANSITION"           // Kuning: Kosong < 15 menit
  | "ECO"                  // Biru: Kosong >= 15m & AC Eco 27C
  | "IDLE"                 // Abu-abu: Kosong & AC Mati
  | "WASTE"                // Merah: Kosong lama tapi AC masih normal
  | "ANOMALY"              // Oranye: Ada orang tapi ruangan > 29C
  | "AFTER_HOURS_OCCUPIED" // Ungu berdenyut: Ada orang di luar jam operasional (>= 18:00)
  | "OFFLINE"              // Abu gelap: Tidak ada telemetri > 90s
  | "NO_DEVICE";           // Netral: Ruangan belum dipasang IoT node

export interface RoomStateInput {
  hasDevice: boolean;
  online: boolean;
  presence: boolean | null;
  temperature: number | null;
  humidity: number | null;
  acMode: AcMode | null;
  mode: DeviceMode | null;
  lastSeen: Date | null;
  presenceChangedAt: Date | null;
  overrideUntil?: Date | null;
}

export interface StatusConfig {
  offlineThresholdSec: number; // default: 90
  wasteGraceMin: number;       // default: 15
  workHoursEnd: number;        // default: 18 (WIB)
}

export const DEFAULT_STATUS_CONFIG: StatusConfig = {
  offlineThresholdSec: 90,
  wasteGraceMin: 15,
  workHoursEnd: 18,
};

export function deriveRoomStatus(
  state: RoomStateInput,
  now: Date,
  config: StatusConfig = DEFAULT_STATUS_CONFIG
): RoomClimateStatus {
  if (!state.hasDevice) {
    return "NO_DEVICE";
  }

  // 1. Cek Offline (jika tidak ada detak data > 90 detik)
  if (!state.online || !state.lastSeen) {
    return "OFFLINE";
  }
  const diffSec = (now.getTime() - state.lastSeen.getTime()) / 1000;
  if (diffSec > config.offlineThresholdSec) {
    return "OFFLINE";
  }

  const currentHour = now.getHours();
  const isAfterHours = currentHour >= config.workHoursEnd;

  // 2. Cek Aspek Keamanan / Safety: Ada orang di luar jam operasional kampus
  if (isAfterHours && state.presence) {
    return "AFTER_HOURS_OCCUPIED";
  }

  // 3. Cek Anomali AC: Ada penghuni tapi ruangan panas (> 29°C)
  if (state.presence && (state.temperature ?? 0) > 29.0) {
    return "ANOMALY";
  }

  // 4. Ada orang dalam jam kerja & AC menyala normal
  if (state.presence && state.acMode === "normal") {
    return "OCCUPIED";
  }

  // 5. Cek kondisi ruangan kosong
  if (!state.presence) {
    const emptyForMs = state.presenceChangedAt
      ? now.getTime() - state.presenceChangedAt.getTime()
      : 0;
    const emptyForMin = emptyForMs / (1000 * 60);

    // Pemborosan energi: Kosong >= 15m tapi AC masih menyala Normal
    if (state.acMode === "normal" && emptyForMin >= config.wasteGraceMin) {
      return "WASTE";
    }

    // Jeda transisi: Kosong < 15 menit
    if (emptyForMin < config.wasteGraceMin && state.acMode === "normal") {
      return "TRANSITION";
    }

    // Eco mode aktif
    if (state.acMode === "eco") {
      return "ECO";
    }

    // AC sudah mati
    if (state.acMode === "off") {
      return "IDLE";
    }
  }

  return "IDLE";
}

export function getStatusColor(
  status: RoomClimateStatus,
  layer: "status" | "temperature" | "presence" | "energy" = "status",
  temp: number | null = null
): string {
  // Ruangan tanpa alat IoT selalu ditampilkan dalam warna grayscale
  if (status === "NO_DEVICE") {
    return "#E2E8F0";
  }

  if (layer === "temperature" && temp !== null) {
    if (temp <= 22) return "#3B82F6"; // Biru sejuk
    if (temp <= 25) return "#10B981"; // Hijau nyaman
    if (temp <= 28) return "#F59E0B"; // Kuning hangat
    return "#EF4444"; // Merah panas
  }

  if (layer === "presence") {
    if (status === "OCCUPIED" || status === "ANOMALY" || status === "AFTER_HOURS_OCCUPIED") {
      return "#10B981"; // Hijau (Ada Penghuni)
    }
    if (status === "OFFLINE") return "#94A3B8";
    return "#CBD5E1"; // Kosong
  }

  if (layer === "energy") {
    if (status === "WASTE" || status === "ANOMALY") return "#EF4444"; // Boros / Anomali
    if (status === "OCCUPIED" || status === "TRANSITION" || status === "AFTER_HOURS_OCCUPIED") {
      return "#F59E0B"; // Beban Normal 1.2 kW
    }
    if (status === "ECO") return "#3B82F6"; // Hemat Eco 0.72 kW
    return "#10B981"; // AC Mati 0 kW (Hemat 100%)
  }

  switch (status) {
    case "OCCUPIED":
      return "#22C55E"; // Hijau
    case "TRANSITION":
      return "#EAB308"; // Kuning
    case "ECO":
      return "#3B82F6"; // Biru
    case "IDLE":
      return "#CBD5E1"; // Abu terang
    case "WASTE":
      return "#EF4444"; // Merah
    case "ANOMALY":
      return "#F97316"; // Oranye
    case "AFTER_HOURS_OCCUPIED":
      return "#A855F7"; // Ungu
    case "OFFLINE":
      return "#94A3B8"; // Abu gelap
    default:
      return "#E2E8F0"; // Grayscale netral
  }
}
