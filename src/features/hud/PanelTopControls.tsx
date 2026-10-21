import React from "react";
import { ArrowLeft, Layers, Sparkles } from "lucide-react";
import { useRoomStore } from "../../stores/roomStore";
import { useViewStore } from "../../stores/viewStore";

export const PanelTopControls: React.FC = () => {
  const { is2D, toggle2D, mode, selectedFloor, resetToBuilding, isCutaway, toggleCutaway } = useViewStore();
  const { connection } = useRoomStore();

  return (
    <div className="absolute top-4 left-4 z-30 flex items-center gap-2 pointer-events-auto select-none">
      {/* Tombol Kembali ke Gedung jika sedang fokus ke Lantai atau Ruangan */}
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

      {/* 1. Indikator Live Telemetri & Ruang Pilot */}
      <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-lg border border-slate-200/80 text-xs font-semibold">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-slate-700">
          {connection === "live" ? "Live Telemetri" : connection}
        </span>
        <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" />
          Pilot: R.601
        </span>
      </div>

      {/* 2. Switcher Mode 2D / 3D */}
      <div className="flex items-center bg-white/95 backdrop-blur-md p-1 rounded-full shadow-lg border border-slate-200/80 text-xs font-bold">
        <button
          onClick={() => is2D && toggle2D()}
          className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
            !is2D
              ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
              : "text-slate-600 hover:text-blue-600 hover:bg-blue-50/60"
          }`}
        >
          3D
        </button>
        <button
          onClick={() => !is2D && toggle2D()}
          className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
            is2D
              ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
              : "text-slate-600 hover:text-blue-600 hover:bg-blue-50/60"
          }`}
        >
          2D
        </button>
      </div>

      {/* 3. Tombol Buka Atap / Cutaway Interior (Khusus Mode Gedung 3D) */}
      {!is2D && mode === "building" && (
        <button
          onClick={toggleCutaway}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all shadow-lg border cursor-pointer ${
            isCutaway
              ? "bg-amber-500 text-white border-amber-600 shadow-amber-500/20"
              : "bg-white/95 backdrop-blur-md text-slate-700 hover:text-amber-600 hover:bg-amber-50/60 border-slate-200/80"
          }`}
          title={isCutaway ? "Tutup Atap Bangunan" : "Buka Atap & Intip Denah Interior Seluruh Lantai"}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isCutaway ? "Atap Terbuka" : "Buka Atap"}</span>
        </button>
      )}
    </div>
  );
};
