import React, { useState } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  Filter,
  Palette,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useRoomStore } from "../../stores/roomStore";
import { ObjectVisibilityFilters, useViewStore } from "../../stores/viewStore";

const FILTER_ITEMS: { key: keyof ObjectVisibilityFilters; label: string }[] = [
  { key: "cars", label: "Mobil Parkir" },
  { key: "trees", label: "Pohon & Tanaman" },
  { key: "furniture", label: "Meja & Kursi (Furnitur)" },
  { key: "stairs", label: "Tangga Gedung" },
  { key: "lifts", label: "Lift Penumpang" },
  { key: "roomLabels", label: "Label Nama Ruangan" },
  { key: "roofAndFacade", label: "Atap & Fasad Luar" },
];

export const PanelTopControls: React.FC = React.memo(function PanelTopControls() {
  const {
    mode,
    selectedFloor,
    resetToBuilding,
    isGrayscale,
    toggleGrayscale,
    objectFilters,
    toggleObjectFilter,
    resetObjectFilters,
    selectFloor,
    selectRoom,
  } = useViewStore(
    useShallow((s) => ({
      mode: s.mode,
      selectedFloor: s.selectedFloor,
      resetToBuilding: s.resetToBuilding,
      isGrayscale: s.isGrayscale,
      toggleGrayscale: s.toggleGrayscale,
      objectFilters: s.objectFilters,
      toggleObjectFilter: s.toggleObjectFilter,
      resetObjectFilters: s.resetObjectFilters,
      selectFloor: s.selectFloor,
      selectRoom: s.selectRoom,
    }))
  );
  const { connection, isPilotOnline } = useRoomStore(
    useShallow((s) => ({
      connection: s.connection,
      isPilotOnline: s.rooms["6-U1"]?.online ?? false,
    }))
  );
  const [filterOpen, setFilterOpen] = useState(false);

  const hiddenCount = Object.values(objectFilters).filter((v) => !v).length;

  return (
    <div className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-2 pointer-events-auto select-none">
      {/* 1. Tombol Kembali ke Gedung jika sedang fokus ke Lantai atau Ruangan */}
      {mode !== "building" && (
        <button
          onClick={resetToBuilding}
          className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-2 rounded-full shadow-lg border border-slate-200/80 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 transition-all cursor-pointer group"
          title="Kembali ke Tinjauan Keseluruhan Gedung FST"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Gedung FST</span>
          <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-semibold">
            Lt. {selectedFloor}
          </span>
        </button>
      )}

      {/* 2. Indikator Koneksi MQTT & Pintasan Ruang Pilot R.601 */}
      <button
        onClick={() => {
          selectFloor(6);
          selectRoom("6-U1");
        }}
        className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-lg border border-slate-200/80 text-xs font-semibold hover:border-blue-300 transition cursor-pointer"
        title="Klik untuk fokus langsung ke Ruang Pilot IoT R.601 (Lantai 6)"
      >
        <span className="relative flex h-2.5 w-2.5">
          {isPilotOnline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isPilotOnline
                ? "bg-emerald-500"
                : connection === "live"
                ? "bg-amber-400"
                : "bg-slate-400"
            }`}
          ></span>
        </span>
        <span className="text-slate-700">
          {isPilotOnline
            ? "R.601 Live"
            : connection === "live"
            ? "Broker Siap (Menunggu ESP32)"
            : "Menghubungkan MQTT..."}
        </span>
        <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" />
          R.601
        </span>
      </button>

      {/* 3. Tombol Toggle Warna / Grayscale untuk Seluruh Visual */}
      <button
        onClick={toggleGrayscale}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full shadow-lg border text-xs font-bold transition-all cursor-pointer ${
          isGrayscale
            ? "bg-slate-800 text-white border-slate-700"
            : "bg-white/95 backdrop-blur-md text-slate-700 border-slate-200/80 hover:bg-slate-50"
        }`}
        title="Ubah tampilan seluruh visual antara Berwarna atau Grayscale untuk membantu penglihatan"
      >
        <Palette className="w-3.5 h-3.5" />
        <span>{isGrayscale ? "Mode: Grayscale" : "Mode: Berwarna"}</span>
      </button>

      {/* 4. Tombol Filter Objek Visual 3D (Mobil, Pohon, Meja/Kursi, Tangga, Lift, dll.) */}
      <div className="relative">
        <button
          onClick={() => setFilterOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full shadow-lg border text-xs font-bold transition-all cursor-pointer ${
            filterOpen || hiddenCount > 0
              ? "bg-blue-600 text-white border-blue-500"
              : "bg-white/95 backdrop-blur-md text-slate-700 border-slate-200/80 hover:bg-slate-50"
          }`}
          title="Sembunyikan atau tampilkan objek 3D (Mobil, Pohon, Meja+Kursi, Tangga, Lift, dll.)"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Objek</span>
          {hiddenCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white text-blue-700 text-[10px] font-black">
              {FILTER_ITEMS.length - hiddenCount}/{FILTER_ITEMS.length}
            </span>
          )}
        </button>

        {filterOpen && (
          <div className="absolute top-11 left-0 w-60 bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 p-3 space-y-2 z-50 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                Visibilitas Objek 3D
              </span>
              {hiddenCount > 0 && (
                <button
                  onClick={resetObjectFilters}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-1">
              {FILTER_ITEMS.map((item) => {
                const active = objectFilters[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleObjectFilter(item.key)}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                      active
                        ? "bg-blue-50/70 text-slate-800 hover:bg-blue-100/60"
                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                        active
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-slate-300 text-transparent"
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
