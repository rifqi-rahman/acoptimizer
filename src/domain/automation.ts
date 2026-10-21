import { AcMode } from "./contract";

export interface AutomationInput {
  presence: boolean;
  emptyForMin: number;
  temperature: number;
  nowHour: number; // 0 - 23 (WIB)
}

export interface AutomationResult {
  acMode: AcMode;
  rule: number;
  ruleDescription: string;
}

/**
 * Evaluasi 8 Kasus Otomasi Acoptimizer (Sesuai Proposal & PRD Bagian 6)
 * Batas Jam Kerja: < 18:00 WIB
 */
export function evaluateAutomation(input: AutomationInput): AutomationResult {
  const isWorkHours = input.nowHour < 18;

  // Kasus 7: Kapan saja, Kosong >= 15 menit, dan suhu > 29C (Spam prevention, suhu panas = AC sudah mati)
  if (!input.presence && input.emptyForMin >= 15 && input.temperature > 29.0) {
    return {
      acMode: "off",
      rule: 7,
      ruleDescription: "Kosong & Panas: AC divalidasi sudah mati",
    };
  }

  // Kasus 8: Kapan saja, Ada orang, tapi suhu > 29C (Anomali: AC rusak atau dimatikan manual)
  if (input.presence && input.temperature > 29.0) {
    return {
      acMode: "normal", // Sistem tetap targetkan normal tapi beri notifikasi anomali
      rule: 8,
      ruleDescription: "Peringatan Anomali: Ada orang tapi ruangan sangat panas (>29°C)",
    };
  }

  // Kasus di Luar Jam Kerja (>= 18.00 WIB)
  if (!isWorkHours) {
    if (!input.presence && input.emptyForMin >= 15) {
      // Kasus 5: Malam hari, kosong >= 15 menit -> Matikan Total
      return {
        acMode: "off",
        rule: 5,
        ruleDescription: "Luar Jam Operasional: Kelas kosong dimatikan total",
      };
    }
    if (input.presence) {
      // Kasus 6: Malam hari, ada orang (Lembur / Rapat Mahasiswa)
      return {
        acMode: "normal",
        rule: 6,
        ruleDescription: "Luar Jam Operasional: Terpakai lembur malam",
      };
    }
  }

  // Kasus di Jam Kerja (< 18.00 WIB)
  if (input.presence) {
    // Kasus 1: Jam kerja, ada orang -> Set Normal 22°C
    return {
      acMode: "normal",
      rule: 1,
      ruleDescription: "Kondisi Ideal: Kelas aktif digunakan (AC Normal 22°C)",
    };
  } else {
    if (input.emptyForMin < 15) {
      // Kasus 2: Jam kerja, jeda kosong < 15 menit -> Pertahankan (Cegah short-cycling kompresor)
      return {
        acMode: "normal",
        rule: 2,
        ruleDescription: "Jeda Transisi: Mahasiswa/Dosen jeda singkat (<15m)",
      };
    } else if (input.emptyForMin < 120) {
      // Kasus 3: Jam kerja, kosong >= 15 menit s/d 2 jam -> Set Eco 27°C
      return {
        acMode: "eco",
        rule: 3,
        ruleDescription: "Kondisi Eco: Kelas kosong tervalidasi (Eco Mode 27°C)",
      };
    } else {
      // Kasus 4: Jam kerja, kosong >= 2 jam -> Matikan Total
      return {
        acMode: "off",
        rule: 4,
        ruleDescription: "Kosong Lama (≥2 Jam): AC dimatikan total",
      };
    }
  }
}
