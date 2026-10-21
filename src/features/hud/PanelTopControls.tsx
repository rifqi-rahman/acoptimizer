import React from "react";
import { Sparkles } from "lucide-react";
import { useRoomStore } from "../../stores/roomStore";
import { useViewStore } from "../../stores/viewStore";

export const PanelTopControls: React.FC = () => {
  const { is2D, toggle2D } = useViewStore();
  const { connection } = useRoomStore();

  return (
    <div className="absolute top-4 left-4 z-30 flex items-center gap-2 pointer-events-auto select-none">
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

      {/* 2. Switcher Mode 2D / 3D (Simplified Segmented Pill) */}
      <div className="flex items-center bg-white/95 backdrop-blur-md p-1 rounded-full shadow-lg border border-slate-200/80 text-xs font-bold">
        <button
          onClick={() => is2D && toggle2D()}
          className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
            !is2D
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          3D
        </button>
        <button
          onClick={() => !is2D && toggle2D()}
          className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
            is2D
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          2D
        </button>
      </div>
    </div>
  );
};
