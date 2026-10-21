import React, { useMemo } from "react";
import {
  Activity,
  ArrowLeft,
  Building2,
  ChevronRight,
  Flame,
  Home,
  Info,
  Layers,
  Sparkles,
  Thermometer,
  UserCheck,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { FloorModel, RoomGeometry } from "../../building/params";
import { deriveRoomStatus } from "../../domain/roomStatus";
import { useRoomStore } from "../../stores/roomStore";
import { useViewStore } from "../../stores/viewStore";

const FLOOR_METADATA: Record<number, { title: string; subtitle: string }> = {
  7: { title: "Laboratorium Riset & Komputasi", subtitle: "Lab Komputer, Riset Terpadu & Kelas Teori" },
  6: { title: "Ruang Kelas & Pilot IoT", subtitle: "Ruang Kelas Teori & Pilot R.601" },
  5: { title: "Ruang Kelas & Perkuliahan", subtitle: "Ruang Perkuliahan Sarjana & Ruang Dosen" },
  4: { title: "Ruang Kelas & Diskusi", subtitle: "Ruang Perkuliahan Teori & Diskusi Mahasiswa" },
  3: { title: "Ruang Kelas & Fasilitas", subtitle: "Ruang Perkuliahan & Ruang Sidang Kecil" },
  2: { title: "Dekanat & Ruang Sidang", subtitle: "Pimpinan Dekanat FST, Ruang Sidang, Musolla & Teater" },
  1: { title: "Lobby Utama & Atrium", subtitle: "Lobby Sarjana & Pascasarjana, Void Taman & Musolla" },
};

interface SidePanelProps {
  room: RoomGeometry | null;
  currentFloor: FloorModel;
  floors: FloorModel[];
}

export const SidePanel: React.FC<SidePanelProps> = ({ room, currentFloor, floors }) => {
  const { mode, selectRoom, selectFloor, resetToBuilding } = useViewStore();
  const { rooms: liveRooms } = useRoomStore();

  const now = new Date();

  // Ruangan pilot R.601 live data
  const pilotLive = liveRooms["6-U1"];

  // =========================================================================
  // 1. TAMPILAN DETAIL RUANGAN (ROOM DETAIL)
  // =========================================================================
  if (room) {
    const live = liveRooms[room.slotId];
    const status = live
      ? deriveRoomStatus(live, now)
      : room.hasDevice
      ? "OCCUPIED"
      : "NO_DEVICE";

    const kindLabel =
      room.kind === "stairs"
        ? "Tangga Darurat"
        : room.kind === "toilet"
        ? "Toilet"
        : room.kind === "service"
        ? "Ruang Fasilitas / Teknis"
        : room.kind === "classroom"
        ? "Ruang Kelas"
        : room.kind === "office"
        ? "Ruang Dosen & Staf"
        : room.kind === "core"
        ? "Tangga Utama & Lift"
        : room.kind === "lobby"
        ? "Lobby Utama"
        : room.kind === "garden"
        ? "Taman Atrium"
        : room.kind;

    return (
      <div className="w-full h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-200">
        {/* Header Ruangan */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Slot {room.slotId}
              </span>
              {room.hasDevice && (
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  IoT Active
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              {room.displayName}
            </h3>
            <p className="text-xs text-slate-500">
              Lantai {room.level} • {kindLabel}
            </p>
          </div>

          <button
            onClick={() => selectRoom(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
            title="Tutup Detail"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Data Ruangan (Scrollable) */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Status Operasional Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 flex-shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                Status Operasional
              </span>
              <span className="text-sm font-bold text-slate-800">{status}</span>
            </div>
          </div>

          {/* Telemetri Lingkungan Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                <span>Suhu</span>
              </div>
              <span className="text-xl font-black text-slate-800">
                {live?.temperature ? `${live.temperature}°C` : "--"}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Wind className="w-3.5 h-3.5 text-blue-500" />
                <span>Kelembapan</span>
              </div>
              <span className="text-xl font-black text-slate-800">
                {live?.humidity ? `${live.humidity}%` : "--"}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Kehadiran</span>
              </div>
              <span className="text-sm font-bold text-slate-800">
                {live?.presence ? "Ada Orang" : "Kosong"}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Flame className="w-3.5 h-3.5 text-purple-500" />
                <span>Mode AC</span>
              </div>
              <span className="text-sm font-bold text-slate-800 uppercase">
                {live?.acMode ?? "OFF"}
              </span>
            </div>
          </div>

          {/* Aturan Otomasi Aktif */}
          {live?.rule && (
            <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100 text-blue-900 text-xs">
              <span className="font-bold block mb-1">
                Aturan Otomasi #{live.rule}:
              </span>
              <span>
                {live.rule === 1 && "Kondisi Ideal: Kelas aktif digunakan (AC Normal 22°C)"}
                {live.rule === 2 && "Jeda Transisi: Mahasiswa/Dosen jeda singkat (<15m)"}
                {live.rule === 3 && "Kondisi Eco: Kelas kosong tervalidasi (Eco Mode 27°C)"}
                {live.rule === 4 && "Kosong Lama (≥2 Jam): AC dimatikan total"}
                {live.rule === 5 && "Luar Jam Operasional: Kelas kosong dimatikan total"}
                {live.rule === 6 && "Luar Jam Operasional: Terpakai lembur malam"}
                {live.rule === 7 && "Kosong & Panas: AC divalidasi sudah mati"}
                {live.rule === 8 && "Peringatan Anomali: Ada orang tapi suhu sangat panas"}
              </span>
            </div>
          )}

          {/* Remote Override IR Blaster */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Remote Override (IR Blaster)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button className="py-2.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-sm shadow-blue-500/25 cursor-pointer">
                Normal 22°
              </button>
              <button className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer">
                Eco 27°
              </button>
              <button className="py-2.5 px-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer">
                Matikan
              </button>
            </div>
          </div>

          {/* Tombol kembali ke lantai */}
          <button
            onClick={() => selectRoom(null)}
            className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Lantai {room.level}</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. TAMPILAN DASHBOARD KESELURUHAN GEDUNG FST (BUILDING OVERVIEW)
  // Saat mode === "building" (bukan lantai spesifik)
  // =========================================================================
  if (mode === "building") {
    // Agregasi metrik seluruh gedung FST (7 Lantai)
    const allRooms = floors.flatMap((f) => f.rooms);

    let buildingNormal = 0;
    let buildingEco = 0;
    let buildingIdle = 0;
    let totalTemp = 0;
    let tempCount = 0;
    let buildingOccupiedRooms = 0;

    allRooms.forEach((r) => {
      const live = liveRooms[r.slotId];
      if (live?.acMode === "normal") buildingNormal++;
      else if (live?.acMode === "eco") buildingEco++;
      else buildingIdle++;

      if (live?.temperature) {
        totalTemp += live.temperature;
        tempCount++;
      }
      if (live?.presence) buildingOccupiedRooms++;
    });

    const buildingTotalKw = (buildingNormal * 0.85 + buildingEco * 0.45).toFixed(1);
    const avgTemp = tempCount > 0 ? (totalTemp / tempCount).toFixed(1) : "23.8";

    // Breakdown statistik tiap lantai (LT.7 down to LT.1)
    const floorBreakdown = floors
      .slice()
      .reverse()
      .map((f) => {
        let normal = 0;
        let eco = 0;
        let idle = 0;
        let occupied = 0;

        f.rooms.forEach((r) => {
          const live = liveRooms[r.slotId];
          if (live?.acMode === "normal") normal++;
          else if (live?.acMode === "eco") eco++;
          else idle++;
          if (live?.presence) occupied++;
        });

        const kw = (normal * 0.85 + eco * 0.45).toFixed(1);
        const meta = FLOOR_METADATA[f.level] ?? {
          title: f.label,
          subtitle: `${f.rooms.length} Ruangan`,
        };

        return {
          floor: f,
          meta,
          normal,
          eco,
          idle,
          occupied,
          kw,
        };
      });

    return (
      <div className="w-full h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-200">
        {/* Header Panel: Gedung FST Dashboard */}
        <div className="p-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-600" />
              Digital Twin FST
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Aktif
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">
            Gedung FST UIN Jakarta
          </h3>
          <p className="text-xs text-slate-500">
            7 Lantai • Tipologi Atrium • {allRooms.length} Ruangan Spasial
          </p>
        </div>

        {/* Konten Dashboard Gedung (Scrollable) */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Metrik Utama Gedung (Building KPIs) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Ringkasan Operasional Gedung
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-500 block">
                  Beban Daya Listrik
                </span>
                <span className="text-xl font-black text-blue-600">
                  ~{buildingTotalKw} kW
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Estimasi kompresor AC
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-500 block">
                  Rata-rata Suhu
                </span>
                <span className="text-xl font-black text-slate-800">
                  {avgTemp}°C
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Sensor telemetri live
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <span className="text-[10px] font-semibold text-emerald-600 block">
                  AC Terpakai (22°C)
                </span>
                <span className="text-xl font-black text-emerald-700">
                  {buildingNormal} Unit
                </span>
                <span className="text-[10px] text-emerald-600/70 block mt-0.5">
                  Kelas aktif berpenghuni
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
                <span className="text-[10px] font-semibold text-blue-600 block">
                  Mode Eco (27°C)
                </span>
                <span className="text-xl font-black text-blue-700">
                  {buildingEco} Unit
                </span>
                <span className="text-[10px] text-blue-600/70 block mt-0.5">
                  Penghematan daya aktif
                </span>
              </div>
            </div>
          </div>

          {/* Banner Efisiensi Energi */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-500/25">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Efisiensi Energi Iklim
                </span>
                <span className="text-[10px] text-slate-500">
                  Otomasi Eco Mode & Shutdown kelas kosong
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-blue-700 bg-white/80 px-2 py-1 rounded-lg border border-blue-200">
              ~32% Hemat
            </span>
          </div>

          {/* Breakdown Ringkasan Tiap Lantai (Lantai 7 s/d Lantai 1) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Daftar Lantai Gedung FST
              </span>
              <span className="text-[10px] text-slate-400">
                Klik lantai untuk fokus
              </span>
            </div>

            <div className="space-y-1.5">
              {floorBreakdown.map(({ floor, meta, normal, eco, kw }) => {
                const isPilotFloor = floor.level === 6;

                return (
                  <button
                    key={floor.level}
                    onClick={() => selectFloor(floor.level)}
                    className="w-full p-2.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/70 hover:border-blue-200 transition text-left flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-600 group-hover:text-white transition flex items-center justify-center text-xs font-black text-slate-700 flex-shrink-0 shadow-sm">
                        L{floor.level}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900 transition truncate">
                            {meta.title}
                          </span>
                          {isPilotFloor && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" title="Ruang Pilot R.601 Online" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 group-hover:text-slate-500 transition block truncate">
                          {normal} AC Aktif • {eco} Eco • ~{kw} kW
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-600 transition flex-shrink-0">
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ruang Pilot Uji Coba Highlight */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/40 to-white border border-blue-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Ruang Uji Coba Pilot
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                R.601 Online
              </span>
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-800">Ruang 601 (Lantai 6)</h4>
              <p className="text-xs text-slate-500">
                Suhu: {pilotLive?.temperature ? `${pilotLive.temperature}°C` : "23.5°C"} • Mode: {pilotLive?.acMode?.toUpperCase() ?? "NORMAL"} • {pilotLive?.presence ? "Ada Orang" : "Kosong"}
              </p>
            </div>

            <button
              onClick={() => {
                selectFloor(6);
                selectRoom("6-U1");
              }}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/25 active:scale-95 cursor-pointer"
            >
              <span>Buka Detail Ruang R.601</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Info Tipologi Arsitektur Gedung */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              Karakteristik Gedung FST:
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-500">
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>Tipologi Atrium Terbuka:</strong> Seluruh 7 lantai mengelilingi void ruang kosong tengah dengan sirkulasi alami.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>Core Vertikal:</strong> 2 Lobby Utama (Sarjana & Pascasarjana), Tangga Imperial ganda, dan 4 Lift Penumpang.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>Navigasi:</strong> Klik lantai pada rail kanan atau daftar lantai di atas untuk meninjau denah per lantai.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. TAMPILAN DETAIL LANTAI SPESIFIK (FLOOR DETAIL)
  // Saat mode === "floor" (pengguna memilih lantai spesifik seperti LT.6, LT.5, dst)
  // =========================================================================
  let floorOccupiedCount = 0;
  let floorEcoCount = 0;
  let floorIdleCount = 0;

  currentFloor.rooms.forEach((r) => {
    const live = liveRooms[r.slotId];
    if (live?.acMode === "normal") floorOccupiedCount++;
    else if (live?.acMode === "eco") floorEcoCount++;
    else floorIdleCount++;
  });

  const estimatedFloorKw = floorOccupiedCount * 0.85 + floorEcoCount * 0.45;
  const currentFloorMeta = FLOOR_METADATA[currentFloor.level] ?? {
    title: currentFloor.label,
    subtitle: `${currentFloor.rooms.length} Ruangan`,
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-200">
      {/* Header Panel Lantai Spesifik */}
      <div className="p-5 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <button
            onClick={resetToBuilding}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-full transition flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Tinjauan Gedung FST</span>
          </button>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            Lantai {currentFloor.level} dari 7
          </span>
        </div>
        <h3 className="text-xl font-black text-slate-800 tracking-tight">
          {currentFloor.label}
        </h3>
        <p className="text-xs text-slate-500">
          {currentFloorMeta.title} • {currentFloor.rooms.length} Ruangan
        </p>
      </div>

      {/* Konten Ringkasan Lantai (Scrollable) */}
      <div className="p-5 flex-1 overflow-y-auto space-y-5">
        {/* Ringkasan Status AC Lantai Ini */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Statistik Iklim & Energi Lantai
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-[10px] font-semibold text-emerald-600 block">
                AC Terpakai (22°C)
              </span>
              <span className="text-xl font-black text-emerald-700">
                {floorOccupiedCount} Unit
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
              <span className="text-[10px] font-semibold text-blue-600 block">
                Mode Eco (27°C)
              </span>
              <span className="text-xl font-black text-blue-700">
                {floorEcoCount} Unit
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-500 block">
                AC Nonaktif
              </span>
              <span className="text-xl font-black text-slate-700">
                {floorIdleCount} Unit
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100">
              <span className="text-[10px] font-semibold text-amber-600 block">
                Beban Daya Listrik
              </span>
              <span className="text-xl font-black text-amber-700">
                ~{estimatedFloorKw.toFixed(1)} kW
              </span>
            </div>
          </div>
        </div>

        {/* Daftar Ruangan di Lantai Ini */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Daftar Ruangan di {currentFloor.label}
          </span>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {currentFloor.rooms.map((r) => {
              const live = liveRooms[r.slotId];
              return (
                <button
                  key={r.slotId}
                  onClick={() => selectRoom(r.slotId)}
                  className="w-full p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/70 hover:border-blue-200 transition text-left flex items-center justify-between text-xs cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-slate-700 group-hover:text-blue-700 transition truncate">
                      {r.displayName}
                    </span>
                    <span className="text-[10px] text-slate-400">({r.slotId})</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {live?.temperature && (
                      <span className="text-[11px] font-semibold text-slate-600">
                        {live.temperature}°C
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                        live?.acMode === "normal"
                          ? "bg-emerald-100 text-emerald-700"
                          : live?.acMode === "eco"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {live?.acMode ?? "OFF"}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ruang Pilot Uji Coba Card (Jika di lantai 6) */}
        {currentFloor.level === 6 && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/40 to-white border border-blue-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Ruang Uji Coba Pilot
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-800">Ruang 601 (Lantai 6)</h4>
              <p className="text-xs text-slate-500">
                Sensor: mmWave HLK-LD2410 + DHT22 + IR Blaster
              </p>
            </div>

            <button
              onClick={() => {
                selectFloor(6);
                selectRoom("6-U1");
              }}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/25 active:scale-95 cursor-pointer"
            >
              <span>Buka Detail Ruang R.601</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Petunjuk Interaksi Spasial */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            Interaksi Spasial {currentFloor.label}:
          </span>
          <ul className="space-y-1.5 text-[11px] text-slate-500">
            <li className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>Tinjauan Gedung:</strong> Klik tombol "Tinjauan Gedung FST" di atas atau ikon rumah di kanan untuk kembali ke ringkasan gedung.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>Pilih Ruangan:</strong> Klik ruangan pada daftar di atas atau langsung pada denah visual untuk melihat telemetri detail.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
