import React from "react";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Flame,
  Info,
  Layers,
  Power,
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

interface SidePanelProps {
  room: RoomGeometry | null;
  currentFloor: FloorModel;
}

export const SidePanel: React.FC<SidePanelProps> = ({ room, currentFloor }) => {
  const { selectRoom, selectFloor } = useViewStore();
  const { rooms: liveRooms } = useRoomStore();

  const now = new Date();

  // Jika ruangan sedang dipilih, tampilkan Room Detail
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
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
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
              <button className="py-2.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-sm">
                Normal 22°
              </button>
              <button className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition active:scale-95">
                Eco 27°
              </button>
              <button className="py-2.5 px-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold transition active:scale-95">
                Matikan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tampilan Default: Ringkasan Gedung FST & Lantai Terpilih
  let occupiedCount = 0;
  let ecoCount = 0;
  let idleCount = 0;

  currentFloor.rooms.forEach((r) => {
    const live = liveRooms[r.slotId];
    if (live?.acMode === "normal") occupiedCount++;
    else if (live?.acMode === "eco") ecoCount++;
    else idleCount++;
  });

  const estimatedFloorKw = occupiedCount * 0.85 + ecoCount * 0.45;

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-200">
      {/* Header Panel Kanan */}
      <div className="p-5 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3" />
            Digital Twin FST
          </span>
        </div>
        <h3 className="text-xl font-black text-slate-800 tracking-tight">
          {currentFloor.label}
        </h3>
        <p className="text-xs text-slate-500">
          {currentFloor.rooms.length} Ruangan • Desain Atrium Terbuka
        </p>
      </div>

      {/* Konten Ringkasan (Scrollable) */}
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
                {occupiedCount} Unit
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
              <span className="text-[10px] font-semibold text-blue-600 block">
                Mode Eco (27°C)
              </span>
              <span className="text-xl font-black text-blue-700">
                {ecoCount} Unit
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-500 block">
                AC Nonaktif
              </span>
              <span className="text-xl font-black text-slate-700">
                {idleCount} Unit
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

        {/* Ruang Pilot Uji Coba Card */}
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
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <span>Buka Detail Ruang R.601</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Petunjuk Interaksi Spasial */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            Interaksi Visual (Panel Kiri 3/4):
          </span>
          <ul className="space-y-1.5 text-[11px] text-slate-500">
            <li className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>Zoom & Pinch:</strong> Scroll mouse atau cubit di dalam panel visual kiri untuk memperbesar/memperkecil.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>Geser & Rotasi:</strong> Klik & drag untuk rotasi 3D atau geser denah 2D.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>Klik Ruangan:</strong> Klik ruangan pada visual untuk melihat telemetri dan kontrol AC di panel ini.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
