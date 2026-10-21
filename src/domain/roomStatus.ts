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
