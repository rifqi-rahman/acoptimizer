import React from "react";
import { Activity, Clock, Flame, Power, ShieldAlert, Thermometer, UserCheck, Wind, X } from "lucide-react";
import { RoomGeometry } from "../../building/params";
import { deriveRoomStatus } from "../../domain/roomStatus";
import { useRoomStore } from "../../stores/roomStore";
import { useViewStore } from "../../stores/viewStore";

interface RoomSheetProps {
  room: RoomGeometry | null;
}

export const RoomSheet: React.FC<RoomSheetProps> = ({ room }) => {
  const { selectRoom } = useViewStore();
  const { rooms } = useRoomStore();

  if (!room) return null;

  const live = rooms[room.slotId];
  const now = new Date();
  const status = live ? deriveRoomStatus(live, now) : room.hasDevice ? "OCCUPIED" : "NO_DEVICE";

  return (
    <div className="fixed right-6 bottom-20 top-24 w-96 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/90 z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Slot {room.slotId}
            </span>
            {room.hasDevice && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                IoT Active
              </span>
            )}
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{room.displayName}</h3>
          <p className="text-xs text-slate-500 capitalize">
            Lantai {room.level} • {room.kind}
          </p>
        </div>

        <button
          onClick={() => selectRoom(null)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        {/* Status Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
              Status Operasional
            </span>
            <span className="text-base font-bold text-slate-800">{status}</span>
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {/* Suhu */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <span>Suhu Ruang</span>
            </div>
            <span className="text-2xl font-black text-slate-800">
              {live?.temperature ? `${live.temperature}°C` : "--"}
            </span>
          </div>

          {/* Kelembapan */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Wind className="w-4 h-4 text-blue-500" />
              <span>Kelembapan</span>
            </div>
            <span className="text-2xl font-black text-slate-800">
              {live?.humidity ? `${live.humidity}%` : "--"}
            </span>
          </div>

          {/* Presensi */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span>Kehadiran</span>
            </div>
            <span className="text-base font-bold text-slate-800">
              {live?.presence ? "Ada Orang" : "Kosong"}
            </span>
          </div>

          {/* Mode AC */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Flame className="w-4 h-4 text-purple-500" />
              <span>Mode AC</span>
            </div>
            <span className="text-base font-bold text-slate-800 uppercase">
              {live?.acMode ?? "OFF"}
            </span>
          </div>
        </div>

        {/* Rule Otomasi Terpicu */}
        {live?.rule && (
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 text-blue-900 text-xs">
            <span className="font-bold block mb-1">Aturan Otomasi Terpicu (Kasus #{live.rule}):</span>
            <span>
              {live.rule === 1 && "Kondisi Ideal: Kelas aktif digunakan (AC Normal 22°C)"}
              {live.rule === 2 && "Jeda Transisi: Mahasiswa/Dosen jeda singkat (<15m)"}
              {live.rule === 3 && "Kondisi Eco: Kelas kosong tervalidasi (Eco Mode 27°C)"}
              {live.rule === 4 && "Kosong Lama (≥2 Jam): AC dimatikan total"}
              {live.rule === 5 && "Luar Jam Operasional: Kelas kosong dimatikan total"}
              {live.rule === 6 && "Luar Jam Operasional: Terpakai lembur malam"}
              {live.rule === 7 && "Kosong & Panas: AC divalidasi sudah mati"}
              {live.rule === 8 && "Peringatan Anomali: Ada orang tapi ruangan sangat panas"}
            </span>
          </div>
        )}

        {/* Remote Override Controls */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
            Remote Override (IR Blaster)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition">
              Normal 22°
            </button>
            <button className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition">
              Eco 27°
            </button>
            <button className="py-2.5 px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold transition">
              Matikan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
