import React from "react";
import { Building2, Home } from "lucide-react";
import { useViewStore } from "../../stores/viewStore";

export const FloorRail: React.FC = () => {
  const { selectedFloor, selectFloor, mode, resetToBuilding } = useViewStore();
  const floors = [7, 6, 5, 4, 3, 2, 1];

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 pointer-events-auto flex flex-col items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-2xl border border-slate-200/90">
      {/* Tombol Home: Gedung FST */}
      <button
        onClick={resetToBuilding}
        className={`group relative flex items-center h-9 px-2.5 rounded-full text-xs font-bold transition-all duration-300 ease-out overflow-hidden ${
          mode === "building"
            ? "bg-slate-900 text-white shadow-md"
            : "text-slate-700 hover:bg-slate-100"
        }`}
        title="Gedung FST"
      >
        <Home className="w-4 h-4 shrink-0" />
        <span className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 whitespace-nowrap transition-all duration-300 ease-out text-xs">
          Gedung FST
        </span>
      </button>

      <div className="w-5 h-[1px] bg-slate-200 my-1" />

      {/* Daftar Tombol Lantai (LT.7 s/d LT.1) */}
      {floors.map((floor) => {
        const isSelected = mode !== "building" && selectedFloor === floor;
        const isPilotFloor = floor === 6;

        return (
          <button
            key={floor}
            onClick={() => selectFloor(floor)}
            className={`group relative flex items-center h-9 px-2.5 rounded-full text-xs font-bold transition-all duration-300 ease-out overflow-hidden ${
              isSelected
                ? "bg-blue-600 text-white shadow-md scale-105"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {/* Teks Default / Singkat */}
            <span className="shrink-0 tracking-tight">LT.{floor}</span>

            {/* Teks Panjang saat di-hover */}
            <span className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 whitespace-nowrap transition-all duration-300 ease-out text-xs font-semibold">
              Lantai {floor}
            </span>

            {/* Indikator Titik Hijau untuk Ruang Uji Coba Pilot (Lantai 6) */}
            {isPilotFloor && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full group-hover:static group-hover:ml-1.5 group-hover:border-0" />
            )}
          </button>
        );
      })}
    </div>
  );
};
