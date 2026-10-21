import React from "react";
import { Home } from "lucide-react";
import { useViewStore } from "../../stores/viewStore";

export const FloorRail: React.FC = () => {
  const { selectedFloor, selectFloor, mode, resetToBuilding } = useViewStore();
  const floors = [7, 6, 5, 4, 3, 2, 1];

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 pointer-events-auto flex flex-col items-center gap-1.5 w-12 bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-2xl border border-slate-200/90">
      {/* Tombol Home: Gedung FST */}
      <div className="relative flex items-center justify-center">
        <button
          onClick={resetToBuilding}
          className={`relative flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold transition-all duration-200 ${
            mode === "building"
              ? "bg-slate-900 text-white shadow-md scale-105"
              : "text-slate-700 hover:bg-slate-100"
          } peer cursor-pointer`}
        >
          <Home className="w-4 h-4" />
        </button>

        {/* Floating Tooltip Label (Kiri) */}
        <div className="pointer-events-none absolute right-full mr-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold rounded-xl shadow-xl whitespace-nowrap opacity-0 translate-x-2 transition-all duration-200 peer-hover:opacity-100 peer-hover:translate-x-0 z-50">
          Gedung FST
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-900/90 rotate-45" />
        </div>
      </div>

      <div className="w-5 h-[1px] bg-slate-200 my-1" />

      {/* Daftar Tombol Lantai (LT.7 s/d LT.1) */}
      {floors.map((floor) => {
        const isSelected = mode !== "building" && selectedFloor === floor;
        const isPilotFloor = floor === 6;

        return (
          <div key={floor} className="relative flex items-center justify-center">
            <button
              onClick={() => selectFloor(floor)}
              className={`relative flex items-center justify-center w-9 h-9 rounded-full text-[11px] font-bold tracking-tight transition-all duration-200 ${
                isSelected
                  ? "bg-blue-600 text-white shadow-md scale-105"
                  : "text-slate-700 hover:bg-slate-100"
              } peer cursor-pointer`}
            >
              <span>LT.{floor}</span>

              {/* Titik Hijau Ruang Uji Coba (Lantai 6) */}
              {isPilotFloor && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full" />
              )}
            </button>

            {/* Floating Tooltip Label (Kiri) */}
            <div className="pointer-events-none absolute right-full mr-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold rounded-xl shadow-xl whitespace-nowrap opacity-0 translate-x-2 transition-all duration-200 peer-hover:opacity-100 peer-hover:translate-x-0 z-50">
              Lantai {floor}
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-900/90 rotate-45" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
