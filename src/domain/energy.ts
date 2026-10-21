import { AcMode } from "./contract";

export const DEFAULT_AC_RATING_KW = 1.2; // Rata-rata AC 1.5 PK ruang kelas FST
export const DEFAULT_TARIFF_PER_KWH = 1444.7; // Tarif Listrik PLN Golongan Pemerintah/Kampus

export function calculatePowerKW(acMode: AcMode | null, ratingKW = DEFAULT_AC_RATING_KW): number {
  if (!acMode || acMode === "off") return 0;
  if (acMode === "eco") return ratingKW * 0.6; // Eco mode ~ 60% load
  return ratingKW; // Normal 100%
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
