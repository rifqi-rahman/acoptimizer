import { BuildingParams, FloorModel, FST_PARAMS, RoomGeometry, RoomKind } from "./params";

/**
 * Generator Poligon Parametrik untuk Setiap Lantai Gedung FST
 * Titik tengah gedung di (0, 0).
 * Sumbu X: Barat (-halfW) ke Timur (+halfW)
 * Sumbu Y (2D) / Z (3D): Selatan (-halfD) ke Utara (+halfD)
 */
export function generateFloorModel(
  level: number,
  params: BuildingParams = FST_PARAMS,
  pilotSlot = "6-U1" // Default ruang uji coba: Ruang 601 (Lantai 6 Sayap Utara 1)
): FloorModel {
  const halfW = params.width / 2;   // 32
  const halfD = params.depth / 2;   // 28
  const rDepth = params.roomDepth;  // 8
  const cWidth = params.corridorWidth; // 3
  const coreW = params.coreWidth;   // 14

  // Elevasi Y (3D)
  const elevation =
    level === 1 ? 0 : params.lobbyHeight + (level - 2) * params.floorHeight;

  // 1. Batas luar gedung (persegi panjang tumpul)
  const outerPolygon: [number, number][] = [
    [-halfW, -halfD],
    [halfW, -halfD],
    [halfW, halfD],
    [-halfW, halfD],
  ];

  // 2. Void Atrium Tengah (di dalam cincin koridor melingkar)
  const innerVoidX = halfW - (rDepth + cWidth); // 32 - 11 = 21 (lebar void = 42m)
  const innerVoidY = halfD - (rDepth + cWidth); // 28 - 11 = 17 (kedalaman void = 34m)

  const voidPolygon: [number, number][] = [
    [-innerVoidX, -innerVoidY],
    [innerVoidX, -innerVoidY],
    [innerVoidX, innerVoidY],
    [-innerVoidX, innerVoidY],
  ];

  const rooms: RoomGeometry[] = [];

  const addRoom = (
    slotId: string,
    displayName: string,
    kind: RoomKind,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    hasAc = true
  ) => {
    const polygon: [number, number][] = [
      [xMin, yMin],
      [xMax, yMin],
      [xMax, yMax],
      [xMin, yMax],
    ];
    const center: [number, number] = [(xMin + xMax) / 2, (yMin + yMax) / 2];
    const size: [number, number] = [Math.abs(xMax - xMin), Math.abs(yMax - yMin)];
    const hasDevice = slotId === pilotSlot;

    rooms.push({
      slotId,
      displayName,
      level,
      kind,
      hasAc,
      hasDevice,
      polygon,
      center,
      size,
    });
  };

  // Sudut-sudut Gedung (Menara Sudut Mencuat Lebih Besar):
  // Sisi Kiri (Barat): Toilet + Tangga Darurat di setiap sudut
  // Pojok Barat Laut (NW): Toilet 1 & Tangga Darurat 1
  addRoom(`${level}-WC1`, `Toilet NW`, "toilet", -halfW, -halfW + rDepth, halfD - rDepth, halfD - 3.5, false);
  addRoom(`${level}-TD1`, `Tangga Darurat NW`, "stairs", -halfW, -halfW + rDepth, halfD - 3.5, halfD, false);

  // Pojok Barat Daya (SW): Toilet 2 & Tangga Darurat 2
  addRoom(`${level}-WC2`, `Toilet SW`, "toilet", -halfW, -halfW + rDepth, -halfD, -halfD + 4.5, false);
  addRoom(`${level}-TD2`, `Tangga Darurat SW`, "stairs", -halfW, -halfW + rDepth, -halfD + 4.5, -halfD + rDepth, false);

  // Sisi Kanan (Timur): Ruang Teater / Seminar di setiap sudut
  // Pojok Timur Laut (NE): Ruang Teater 1
  addRoom(`${level}-TR1`, `Ruang Teater 1`, "theater", halfW - rDepth, halfW, halfD - rDepth, halfD, true);

  // Pojok Tenggara (SE): Ruang Teater 2
  addRoom(`${level}-TR2`, `Ruang Teater 2`, "theater", halfW - rDepth, halfW, -halfD, -halfD + rDepth, true);

  // Core Utara (Lounge + Tangga Imperial + 2 Lift)
  addRoom(
    `${level}-CU`,
    level === 1 ? "Lobby Sarjana & Tangga Utama" : "Lounge & Tangga Utama",
    level === 1 ? "lobby" : "core",
    -coreW / 2,
    coreW / 2,
    halfD - rDepth,
    halfD,
    true
  );

  // Core Selatan (Lounge + Tangga Imperial + 2 Lift)
  addRoom(
    `${level}-CS`,
    level === 1 ? "Lobby Pascasarjana & Tangga Selatan" : "Lounge & Tangga Selatan",
    level === 1 ? "lobby" : "core",
    -coreW / 2,
    coreW / 2,
    -halfD,
    -halfD + rDepth,
    true
  );

  // Sayap Utara: 6 Ruangan (3 di kiri core, 3 di kanan core)
  const uLeftSpan = -coreW / 2 - (-halfW + rDepth); // Jarak dari sudut NW ke Core
  const uRoomW = uLeftSpan / 3;
  for (let i = 0; i < 3; i++) {
    const xMin = -halfW + rDepth + i * uRoomW;
    const xMax = xMin + uRoomW;
    const slot = `${level}-U${i + 1}`;
    const roomNum = `${level}0${i + 1}`;
    addRoom(slot, `Ruang ${roomNum}`, level <= 2 ? "office" : "classroom", xMin, xMax, halfD - rDepth, halfD);
  }
  for (let i = 0; i < 3; i++) {
    const xMin = coreW / 2 + i * uRoomW;
    const xMax = xMin + uRoomW;
    const slot = `${level}-U${i + 4}`;
    const roomNum = `${level}0${i + 4}`;
    addRoom(slot, `Ruang ${roomNum}`, level <= 2 ? "office" : "classroom", xMin, xMax, halfD - rDepth, halfD);
  }

  // Sayap Selatan: 6 Ruangan (3 di kiri core, 3 di kanan core)
  for (let i = 0; i < 3; i++) {
    const xMin = -halfW + rDepth + i * uRoomW;
    const xMax = xMin + uRoomW;
    const slot = `${level}-S${i + 1}`;
    const roomNum = `${level}0${i + 7}`;
    addRoom(slot, `Ruang ${roomNum}`, level <= 2 ? "office" : "classroom", xMin, xMax, -halfD, -halfD + rDepth);
  }
  for (let i = 0; i < 3; i++) {
    const xMin = coreW / 2 + i * uRoomW;
    const xMax = xMin + uRoomW;
    const slot = `${level}-S${i + 4}`;
    const roomNum = `${level}${i + 10}`;
    addRoom(slot, `Ruang ${roomNum}`, level <= 2 ? "office" : "classroom", xMin, xMax, -halfD, -halfD + rDepth);
  }

  // Sayap Barat: 6 Ruang Kelas berjejer dari Selatan ke Utara (sesuai spesifikasi pengguna)
  const bSpan = (halfD - rDepth) - (-halfD + rDepth);
  const bRoomH = bSpan / 6;
  for (let i = 0; i < 6; i++) {
    const yMin = -halfD + rDepth + i * bRoomH;
    const yMax = yMin + bRoomH;
    const slot = `${level}-B${i + 1}`;
    const roomNum = `${level}${i + 13}`;
    addRoom(slot, `Ruang ${roomNum}`, level <= 2 ? "meeting" : "classroom", -halfW, -halfW + rDepth, yMin, yMax);
  }

  // Sayap Timur: 6 Ruang Kelas berjejer dari Selatan ke Utara (sesuai spesifikasi pengguna)
  for (let i = 0; i < 6; i++) {
    const yMin = -halfD + rDepth + i * bRoomH;
    const yMax = yMin + bRoomH;
    const slot = `${level}-T${i + 1}`;
    const roomNum = `${level}${i + 19}`;
    addRoom(slot, `Ruang ${roomNum}`, level <= 2 ? "office" : "classroom", halfW - rDepth, halfW, yMin, yMax);
  }

  // Khusus Lantai 1: Tambahkan representasi Taman Atrium Tengah
  if (level === 1) {
    addRoom(
      `1-GARDEN`,
      `Taman & Area Terbuka Atrium`,
      "garden",
      -innerVoidX * 0.7,
      innerVoidX * 0.7,
      -innerVoidY * 0.7,
      innerVoidY * 0.7,
      false
    );
  }

  return {
    level,
    label: `Lantai ${level}`,
    elevation,
    rooms,
    voidPolygon,
    outerPolygon,
  };
}

export function generateEntireBuilding(params = FST_PARAMS, pilotSlot = "6-U1"): FloorModel[] {
  const floors: FloorModel[] = [];
  for (let lvl = 1; lvl <= params.floorsCount; lvl++) {
    floors.push(generateFloorModel(lvl, params, pilotSlot));
  }
  return floors;
}
