import React from "react";
import {
  Activity,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Flame,
  Info,
  Minus,
  Plus,
  Power,
  Radio,
  RotateCcw,
  Sparkles,
  Thermometer,
  UserCheck,
  WifiOff,
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
  const { rooms: liveRooms, sendCommand, lastCommandFeedback, connection } = useRoomStore();

  const now = new Date();

  // Ruangan pilot R.601 live data
  const pilotLive = liveRooms["6-U1"];

  // =========================================================================
  // 1. TAMPILAN DETAIL RUANGAN (ROOM DETAIL)
  // =========================================================================
  if (room) {
    const live = liveRooms[room.slotId];
    const hasDevice = room.hasDevice || (live?.hasDevice ?? false);
    const status = !hasDevice
      ? "NO_DEVICE"
      : live?.online
      ? deriveRoomStatus(live, now)
      : "OFFLINE";

    const currentTargetTemp =
      live?.targetTemp ?? (live?.acMode === "eco" ? 27 : 22);

    const kindLabel =
      room.kind === "stairs"
        ? "Tangga Darurat"
        : room.kind === "toilet"
        ? "Toilet"
        : room.kind === "service"
        ? "Ruang Fasilitas / Teknis"
        : room.kind === "classroom"
        ? "Ruang Kelas"
        : room.kind === "lab"
        ? "Laboratorium"
        : room.kind === "theater"
        ? "Ruang Teater / Seminar"
        : room.kind === "office"
        ? "Ruang Dosen & Staf"
        : room.kind === "core"
        ? "Tangga Utama & Lift"
        : room.kind === "lobby"
        ? "Lobby Utama"
        : room.kind === "garden"
        ? "Taman Atrium"
        : room.kind;

    const showFeedback =
      lastCommandFeedback &&
      lastCommandFeedback.slotId === room.slotId &&
      Date.now() - lastCommandFeedback.timestamp < 8000;

    return (
      <div className="w-full h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-200">
        {/* Header Ruangan */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                ID: {room.slotId}
              </span>
              {hasDevice ? (
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    live?.online
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-amber-700 bg-amber-50"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      live?.online ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    }`}
                  />
                  {live?.online ? "ESP32 Terhubung" : "Terdaftar IoT (Standby)"}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Tanpa Alat IoT
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              {room.displayName.replace(" (Pilot AC)", "")}
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
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {!hasDevice ? (
            /* Tampilan Jujur untuk Ruangan yang Belum Dipasang Alat IoT */
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-3 my-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-200/70 text-slate-500 flex items-center justify-center mx-auto">
                <WifiOff className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  Belum Ada Perangkat IoT di Ruangan Ini
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Saat ini modul sensor <strong>ESP32 (DHT22 + mmWave + IR Transmitter)</strong> hanya dipasang pada ruang uji coba <strong>R.601 (ID Slot: 6-U1)</strong> di Lantai 6.
                </p>
              </div>
              <button
                onClick={() => {
                  selectFloor(6);
                  selectRoom("6-U1");
                }}
                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Buka Ruang Pilot IoT (R.601)</span>
              </button>
            </div>
          ) : (
            /* Tampilan Lengkap & Kontrol Real-Time untuk Ruangan Ber-IoT (R.601) */
            <>
              {/* Status Operasional & Payload UI dari Mikrokontroler */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    Status Sistem Mikrokontroler
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      live?.mode === "override"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    Mode: {live?.mode === "override" ? "Manual Web" : "Otomatis"}
                  </span>
                </div>
                <div className="text-sm font-black text-slate-800">
                  {live?.dashboardStatus ?? "Menunggu Paket Telemetri ESP32..."}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>Aksi IR Terakhir:</span>
                  <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {live?.irAction ?? "Tidak ada aksi"}
                  </span>
                </div>
              </div>

              {/* Telemetri Sensor Hardware Grid (DHT22 + mmWave) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                    <span>Suhu (DHT22)</span>
                  </div>
                  <span className="text-xl font-black text-slate-800">
                    {live?.temperature !== null && live?.temperature !== undefined
                      ? `${live.temperature.toFixed(1)}°C`
                      : "--°C"}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <Wind className="w-3.5 h-3.5 text-blue-500" />
                    <span>Kelembapan</span>
                  </div>
                  <span className="text-xl font-black text-slate-800">
                    {live?.humidity !== null && live?.humidity !== undefined
                      ? `${live.humidity.toFixed(0)}%`
                      : "--%"}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Sensor mmWave</span>
                  </div>
                  <span
                    className={`text-sm font-black ${
                      live?.presence ? "text-emerald-600" : "text-slate-700"
                    }`}
                  >
                    {live?.presence === null || live?.presence === undefined
                      ? "Menunggu..."
                      : live.presence
                      ? "ADA ORANG"
                      : "KOSONG"}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                    <span>Durasi Kosong</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">
                    {live?.minutesEmpty ?? 0} Menit
                  </span>
                </div>
              </div>

              {/* Panel Kontrol IoT Dua Arah (Web App -> ESP32 IR Transmitter) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3.5 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    Kontrol AC IoT (IR Transmitter)
                  </span>
                  <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-slate-300">
                    Pin IR: GPIO 4
                  </span>
                </div>

                {/* Pengatur Suhu Target Manual (+/-) */}
                <div className="flex items-center justify-between bg-white/10 rounded-xl p-2.5 border border-white/10">
                  <div>
                    <span className="text-[10px] text-slate-300 block">
                      Target Suhu AC
                    </span>
                    <span className="text-lg font-black text-white">
                      {live?.acMode === "off" ? "OFF" : `${currentTargetTemp}°C`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        sendCommand(
                          room.slotId,
                          "set_temp",
                          Math.max(16, currentTargetTemp - 1)
                        )
                      }
                      className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition active:scale-95 cursor-pointer"
                      title="Turunkan Suhu AC (-1°C)"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        sendCommand(
                          room.slotId,
                          "set_temp",
                          Math.min(30, currentTargetTemp + 1)
                        )
                      }
                      className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition active:scale-95 cursor-pointer"
                      title="Naikkan Suhu AC (+1°C)"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 3 Tombol Mode Cepat Sesuai Kode ESP32 */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => sendCommand(room.slotId, "ac_normal")}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex flex-col items-center gap-0.5 ${
                      live?.acMode === "normal"
                        ? "bg-emerald-500 text-white ring-2 ring-white"
                        : "bg-white/10 hover:bg-white/20 text-slate-200"
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Normal 22°</span>
                  </button>

                  <button
                    onClick={() => sendCommand(room.slotId, "ac_eco")}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex flex-col items-center gap-0.5 ${
                      live?.acMode === "eco"
                        ? "bg-blue-500 text-white ring-2 ring-white"
                        : "bg-white/10 hover:bg-white/20 text-slate-200"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Eco 27°</span>
                  </button>

                  <button
                    onClick={() => sendCommand(room.slotId, "ac_off")}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex flex-col items-center gap-0.5 ${
                      live?.acMode === "off"
                        ? "bg-red-500 text-white ring-2 ring-white"
                        : "bg-red-500/20 hover:bg-red-500/35 text-red-200"
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>Power OFF</span>
                  </button>
                </div>

                {/* Tombol Kembalikan ke Otomasi Sensor ESP32 */}
                <button
                  onClick={() => sendCommand(room.slotId, "release")}
                  className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-slate-200 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Kembalikan ke Mode Otomatis (Sensor ESP32)</span>
                </button>

                {/* Feedback Pengiriman Perintah */}
                {showFeedback && (
                  <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-[11px] text-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{lastCommandFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Info Konfigurasi Hardware ESP32 untuk Ruang Ini */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  <span>Identitas Perangkat di Kode Arduino:</span>
                </div>
                <p className="font-mono text-[10px] text-slate-700">
                  ROOM_SLOT_ID: &quot;{room.slotId}&quot; ({room.displayName.replace(" (Pilot AC)", "")})
                </p>
                <p className="font-mono text-[10px] text-slate-500 truncate">
                  Topik: acoptimizer/fst-uin/v1/{room.slotId}/telemetry
                </p>
              </div>
            </>
          )}

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
  // =========================================================================
  if (mode === "building") {
    const allRooms = floors.flatMap((f) => f.rooms);
    const iotRooms = allRooms.filter((r) => r.hasDevice || liveRooms[r.slotId]?.hasDevice);
    const onlineIotCount = iotRooms.filter((r) => liveRooms[r.slotId]?.online).length;

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
              MQTT {connection === "live" ? "Terhubung" : connection}
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">
            Gedung FST UIN Jakarta
          </h3>
          <p className="text-xs text-slate-500">
            7 Lantai • {iotRooms.length} Perangkat IoT Terpasang (R.601)
          </p>
        </div>

        {/* Konten Dashboard Gedung (Scrollable) */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Ruang Pilot Uji Coba Highlight (Data Riil R.601) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/40 to-white border border-blue-200/80 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Perangkat IoT Aktif (R.601)
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  pilotLive?.online
                    ? "text-emerald-700 bg-emerald-100/80"
                    : "text-amber-700 bg-amber-100/80"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    pilotLive?.online ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                {pilotLive?.online ? "ESP32 Online" : "Menunggu ESP32"}
              </span>
            </div>

            <div>
              <h4 className="text-base font-black text-slate-800">
                Ruang 601 (Lantai 6 • Slot 6-U1)
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {pilotLive?.online
                  ? `Suhu: ${pilotLive.temperature?.toFixed(1)}°C • ${
                      pilotLive.presence ? "ADA ORANG" : "KOSONG"
                    } • AC: ${pilotLive.acMode?.toUpperCase() ?? "AUTO"}`
                  : "Siap menerima data riil dari ESP32 (DHT22 + mmWave + IR)"}
              </p>
            </div>

            <button
              onClick={() => {
                selectFloor(6);
                selectRoom("6-U1");
              }}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/25 active:scale-95 cursor-pointer"
            >
              <span>Buka Kontrol & Monitor R.601</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ringkasan Status IoT Gedung */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-500 block">
                Perangkat IoT Terpasang
              </span>
              <span className="text-xl font-black text-blue-600">
                {iotRooms.length} Ruang
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {onlineIotCount} Online • R.601 (Lt. 6)
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-500 block">
                Ruangan Tanpa Alat
              </span>
              <span className="text-xl font-black text-slate-700">
                {allRooms.length - iotRooms.length} Ruang
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Default non-IoT (Tanpa Mockup)
              </span>
            </div>
          </div>

          {/* Daftar Lantai Gedung FST */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Daftar Lantai Gedung FST
              </span>
              <span className="text-[10px] text-slate-400">Klik untuk fokus</span>
            </div>

            <div className="space-y-1.5">
              {floors
                .slice()
                .reverse()
                .map((floor) => {
                  const isPilotFloor = floor.level === 6;
                  const meta = FLOOR_METADATA[floor.level] ?? {
                    title: floor.label,
                    subtitle: `${floor.rooms.length} Ruangan`,
                  };

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
                              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                                IoT R.601
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 group-hover:text-slate-500 transition block truncate">
                            {isPilotFloor
                              ? "1 Perangkat IoT Terdaftar (R.601)"
                              : `${floor.rooms.length} Ruangan (Belum Ada Alat IoT)`}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition flex-shrink-0" />
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. TAMPILAN DETAIL LANTAI SPESIFIK (FLOOR DETAIL)
  // =========================================================================
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
      <div className="p-5 flex-1 overflow-y-auto space-y-4">
        {/* Ruang Pilot Uji Coba Card (Jika di lantai 6) */}
        {currentFloor.level === 6 && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/40 to-white border border-blue-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Ruang Uji Coba IoT
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                ID: 6-U1 (R.601)
              </span>
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-800">Ruang 601</h4>
              <p className="text-xs text-slate-500">
                Sensor: mmWave HLK-LD2410 + DHT22 + IR Transmitter
              </p>
            </div>

            <button
              onClick={() => selectRoom("6-U1")}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <span>Kontrol & Pantau R.601</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Daftar Ruangan di Lantai Ini */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Daftar Ruangan di {currentFloor.label}
          </span>
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {currentFloor.rooms.map((r) => {
              const live = liveRooms[r.slotId];
              const hasDev = r.hasDevice || (live?.hasDevice ?? false);
              return (
                <button
                  key={r.slotId}
                  onClick={() => selectRoom(r.slotId)}
                  className={`w-full p-2.5 rounded-xl border transition text-left flex items-center justify-between text-xs cursor-pointer group ${
                    hasDev
                      ? "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60"
                      : "border-slate-100 bg-slate-50/70 hover:bg-blue-50/70 hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-slate-700 group-hover:text-blue-700 transition truncate">
                      {r.displayName.replace(" (Pilot AC)", "")}
                    </span>
                    <span className="text-[10px] text-slate-400">({r.slotId})</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasDev ? (
                      <>
                        {live?.temperature && (
                          <span className="text-[11px] font-bold text-emerald-700">
                            {live.temperature.toFixed(1)}°C
                          </span>
                        )}
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-600 text-white">
                          IoT Aktif
                        </span>
                      </>
                    ) : (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-500">
                        Tanpa Alat
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <span>
            Seluruh ruangan default tidak menggunakan data palsu (mockup). Hanya ruangan yang ditandai memiliki alat IoT (<strong>R.601</strong>) yang menampilkan telemetri dan kontrol AC aktif.
          </span>
        </div>
      </div>
    </div>
  );
};
