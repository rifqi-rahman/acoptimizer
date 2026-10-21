import React from "react";
import { Compass as CompassIcon } from "lucide-react";
import { useViewStore } from "../../stores/viewStore";

export const CompassHUD: React.FC = () => {
  const { cameraAzimuth, is2D } = useViewStore();

  // Konversi radian azimuth kamera ke derajat rotasi jarum Utara
  // Dalam 3D kami, Utara berada pada sumbu +Z (+Y di denah 2D)
  const angleDeg = is2D ? 0 : -(cameraAzimuth * 180) / Math.PI;

  return (
    <div className="absolute top-4 right-4 z-30 pointer-events-auto flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-lg border border-slate-200/80 select-none">
      {/* Dial Compass Lingkaran */}
      <div className="relative w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-inner">
        {/* Jarum Kompas yang Berputar Dinamis */}
        <div
          className="relative w-6 h-6 flex items-center justify-center transition-transform duration-75 ease-out"
          style={{ transform: `rotate(${angleDeg}deg)` }}
        >
          {/* Ujung Merah = UTARA */}
          <div className="absolute top-0.5 w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[8px] border-b-red-500" />
          {/* Ujung Abu = SELATAN */}
          <div className="absolute bottom-0.5 w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[8px] border-t-slate-400" />
          {/* Titik Poros Tengah */}
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700 z-10" />
        </div>
      </div>

      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
          Arah
        </span>
        <span className="text-xs font-black text-slate-800 leading-tight flex items-center gap-1">
          <span className="text-red-600 font-extrabold">U</span>tara
        </span>
      </div>
    </div>
  );
};
