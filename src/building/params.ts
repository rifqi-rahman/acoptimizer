/**
 * Parameter Spasial Gedung FST UIN Syarif Hidayatullah Jakarta
 * Tipologi: Atrium 7 Lantai dengan Void Terbuka di Bagian Tengah
 * Orientasi:
 * - Sisi Utara: Lobby Sarjana (Lt 1) & Tangga Imperial + 2 Lift
 * - Sisi Selatan: Lobby Pascasarjana (Lt 1) & Tangga Imperial + 2 Lift
 * - Sudut Timur Laut (NE) & Barat Daya (SW): Toilet & Tangga Samping Darurat
 */

export interface BuildingParams {
  floorsCount: number;
  width: number;        // Sumbu X: Barat ke Timur (m)
  depth: number;        // Sumbu Z/Y: Selatan ke Utara (m)
  roomDepth: number;    // Kedalaman ruang dari fasad terluar ke koridor (m)
  corridorWidth: number;// Lebar koridor melingkar (m)
  floorHeight: number;  // Tinggi per lantai (m)
  lobbyHeight: number;  // Tinggi khusus lantai 1 (m)
  coreWidth: number;    // Lebar modul Core (Lounge + Tangga + 2 Lift) (m)
}

export const FST_PARAMS: BuildingParams = {
  floorsCount: 7,
  width: 64,
  depth: 56,
  roomDepth: 8,
  corridorWidth: 3,
  floorHeight: 3.8,
  lobbyHeight: 4.8,
  coreWidth: 14,
};

export type Wing = "U" | "T" | "S" | "B"; // Utara, Timur, Selatan, Barat

export type RoomKind =
  | "classroom"
  | "lab"
  | "office"
  | "deanery"
  | "mushola"
  | "theater"
  | "meeting"
  | "toilet"
  | "stairs"
  | "service"
  | "core"
  | "lobby"
  | "garden";

export interface RoomGeometry {
  slotId: string;       // Misal "6-U1", "3-S2", "7-WC1", "7-TD1"
  displayName: string;  // Misal "Ruang 601", "Toilet NE"
  level: number;        // Lantai 1 s/d 7
  kind: RoomKind;
  hasAc: boolean;
  hasDevice: boolean;   // True hanya untuk ruang uji pilot
  // Koordinat polygon 2D [x, y] meter (relatif terhadap titik tengah gedung [0, 0])
  polygon: [number, number][];
  center: [number, number];
  size: [number, number]; // [width, depth]
}

export interface FloorModel {
  level: number;
  label: string;
  elevation: number; // Tinggi vertikal Y dalam 3D
  rooms: RoomGeometry[];
  voidPolygon: [number, number][]; // Lubang atrium tengah
  outerPolygon: [number, number][]; // Batas luar gedung
}
