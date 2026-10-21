import React from "react";
import { Layers, Sparkles, Wind } from "lucide-react";
import { useRoomStore } from "../../stores/roomStore";
import { useViewStore } from "../../stores/viewStore";

export const TopBar: React.FC = () => {
  const { is2D, toggle2D } = useViewStore();
  const { connection } = useRoomStore();

  return (
    <div className="flex items-center justify-between w-full pointer-events-auto">
      {/* Sisi Kiri: Brand & Status Telemetri */}
      <div className="flex items-center gap-3">
        {/* Brand Acoptimizer Logo Pill */}
        <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-slate-200/80">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Wind className="w-4 h-4" />
          </div>
          <span className="text-slate-900 font-extrabold tracking-tight text-sm">
            Acoptimizer
          </span>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-md border border-slate-200/80 text-xs font-semibold">
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
      </div>

      {/* Sisi Kanan: 2D / 3D Mode Switcher */}
      <button
        onClick={toggle2D}
        className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-slate-200/80 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 cursor-pointer"
      >
        <Layers className="w-4 h-4 text-blue-600" />
        <span>{is2D ? "Beralih ke Mode 3D" : "Beralih ke Mode 2D"}</span>
      </button>
    </div>
  );
};
