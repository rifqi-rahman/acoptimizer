import React, { useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { useViewStore } from "../../stores/viewStore";

/**
 * Kompas Mata Angin HUD Interaktif Gedung FST
 * Sesuai konvensi orientasi spasial FST:
 * - U (Utara): Sisi gedung berpintu masuk dengan atap kanopi kuning (+Z) -> Ditandai Merah Spesial
 * - T (Timur): Sisi samping kiri gedung menghadap keluar (-X)
 * - S (Selatan): Sisi gedung menghadap ke atas / berseberangan dengan atap kuning (-Z)
 * - B (Barat): Sisi samping kanan gedung menghadap keluar (+X)
 */
export const CompassHUD: React.FC = () => {
  const { cameraAzimuth, is2D, triggerResetCamera } = useViewStore();

  // Rotasi dial kompas (dalam derajat)
  // Di 3D: rotDeg = (cameraAzimuth * 180) / Math.PI
  // Di 2D: denah 2D memiliki Sisi Utara di atas (rotDeg = 180)
  const rotDeg = is2D ? 180 : (cameraAzimuth * 180) / Math.PI;

  // Hitung posisi koordinat huruf mata angin di sekeliling lingkaran kompas
  // Diameter dial = 56px, Center = (28, 28), Radius = 19.5px
  const positions = useMemo(() => {
    const cx = 28;
    const cy = 28;
    const r = 19.5;

    const getPos = (degOffset: number) => {
      const totalDeg = (degOffset + rotDeg) % 360;
      const rad = (totalDeg * Math.PI) / 180;
      return {
        x: cx + r * Math.sin(rad),
        y: cy - r * Math.cos(rad),
      };
    };

    return {
      S: getPos(0),   // Selatan: 0 deg (Atas saat rot = 0)
      B: getPos(90),  // Barat: 90 deg (Kanan saat rot = 0)
      U: getPos(180), // Utara: 180 deg (Bawah saat rot = 0, sisi kanopi kuning)
      T: getPos(270), // Timur: 270 deg (Kiri saat rot = 0, sayap kiri)
    };
  }, [rotDeg]);

  // Label nama arah kamera yang sedang menghadap ke depan
  const facingInfo = useMemo(() => {
    if (is2D) {
      return {
        name: "Denah 2D",
        sub: "Sisi Utara di Atas",
        color: "text-blue-600",
      };
    }

    const deg = (((cameraAzimuth * 180) / Math.PI) % 360 + 360) % 360;
    if (deg >= 337.5 || deg < 22.5) {
      return { name: "Sisi Utara", sub: "Lobi Masuk (Kanopi Kuning)", color: "text-red-600" };
    }
    if (deg >= 22.5 && deg < 67.5) {
      return { name: "Barat Laut", sub: "Sudut Depan Kanan", color: "text-slate-800" };
    }
    if (deg >= 67.5 && deg < 112.5) {
      return { name: "Sisi Barat", sub: "Sayap Kanan", color: "text-slate-800" };
    }
    if (deg >= 112.5 && deg < 157.5) {
      return { name: "Barat Daya", sub: "Sudut Belakang Kanan", color: "text-slate-800" };
    }
    if (deg >= 157.5 && deg < 202.5) {
      return { name: "Sisi Selatan", sub: "Sisi Belakang", color: "text-slate-800" };
    }
    if (deg >= 202.5 && deg < 247.5) {
      return { name: "Tenggara", sub: "Sudut Belakang Kiri", color: "text-slate-800" };
    }
    if (deg >= 247.5 && deg < 292.5) {
      return { name: "Sisi Timur", sub: "Sayap Kiri", color: "text-slate-800" };
    }
    return { name: "Timur Laut", sub: "Sudut Depan Kiri", color: "text-slate-800" };
  }, [cameraAzimuth, is2D]);

  return (
    <div
      onClick={() => !is2D && triggerResetCamera()}
      title={is2D ? "Denah 2D (Sisi Utara ke Atas)" : "Klik untuk reset orientasi kamera ke Sisi Utara (Depan)"}
      className={`absolute top-4 right-4 z-30 pointer-events-auto flex items-center gap-3 bg-white/95 backdrop-blur-md pl-2 pr-3.5 py-1.5 rounded-full shadow-lg border border-slate-200/90 select-none group transition-all duration-150 ${
        !is2D ? "cursor-pointer hover:bg-slate-50 hover:shadow-xl hover:border-slate-300" : ""
      }`}
    >
      {/* Dial Kompas Interaktif dengan 4 Tanda Baca Mata Angin (U, T, S, B) */}
      <div className="relative w-14 h-14 rounded-full bg-slate-900 shadow-inner flex items-center justify-center overflow-hidden border border-slate-700/60">
        <svg viewBox="0 0 56 56" className="w-full h-full pointer-events-none">
          {/* Ring Dial Luar dengan Aksen Garis & Tick Marks */}
          <circle cx="28" cy="28" r="26" fill="#0F172A" stroke="#334155" strokeWidth="1" />
          <circle cx="28" cy="28" r="21" fill="none" stroke="#1E293B" strokeWidth="0.8" strokeDasharray="1.5 2" />

          {/* Jarum Kompas 3D yang Berputar Dinamis Menunjuk Arah */}
          <g transform={`rotate(${rotDeg}, 28, 28)`} className="transition-transform duration-100 ease-out">
            {/* Jarum Merah Arah UTARA (Sisi Atap Kanopi Kuning / Posisi 180 deg) */}
            <polygon points="28,28 25.5,28 28,44 30.5,28" fill="#EF4444" />
            <polygon points="28,28 28,44 30.5,28" fill="#DC2626" />

            {/* Jarum Abu-Abu Arah SELATAN (Sisi Belakang / Posisi 0 deg) */}
            <polygon points="28,28 25.5,28 28,12 30.5,28" fill="#94A3B8" />
            <polygon points="28,28 28,12 30.5,28" fill="#64748B" />

            {/* Sayap Crosshair Halus ke Timur & Barat */}
            <polygon points="28,28 28,26.5 15,28 28,29.5" fill="#475569" />
            <polygon points="28,28 28,26.5 41,28 28,29.5" fill="#475569" />

            {/* Titik Poros Tengah */}
            <circle cx="28" cy="28" r="2.5" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1" />
          </g>

          {/* 4 Tanda Baca Mata Angin (U, T, B, S) yang Selalu Tegak & Mengorbit Mengikuti Sudut Pandang */}
          {/* 1. U -> UTARA (Merah Spesial) */}
          <g className="transition-all duration-100 ease-out">
            <circle cx={positions.U.x} cy={positions.U.y} r="4.5" fill="#EF4444" />
            <text
              x={positions.U.x}
              y={positions.U.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[6.5px] font-black fill-white select-none"
            >
              U
            </text>
          </g>

          {/* 2. T -> TIMUR (Sisi Sayap Kiri) */}
          <g className="transition-all duration-100 ease-out">
            <circle cx={positions.T.x} cy={positions.T.y} r="4" fill="#1E293B" stroke="#475569" strokeWidth="0.8" />
            <text
              x={positions.T.x}
              y={positions.T.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[6px] font-extrabold fill-slate-200 select-none"
            >
              T
            </text>
          </g>

          {/* 3. S -> SELATAN (Sisi Berseberangan / Atas) */}
          <g className="transition-all duration-100 ease-out">
            <circle cx={positions.S.x} cy={positions.S.y} r="4" fill="#1E293B" stroke="#475569" strokeWidth="0.8" />
            <text
              x={positions.S.x}
              y={positions.S.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[6px] font-extrabold fill-slate-200 select-none"
            >
              S
            </text>
          </g>

          {/* 4. B -> BARAT (Sisi Sayap Kanan) */}
          <g className="transition-all duration-100 ease-out">
            <circle cx={positions.B.x} cy={positions.B.y} r="4" fill="#1E293B" stroke="#475569" strokeWidth="0.8" />
            <text
              x={positions.B.x}
              y={positions.B.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[6px] font-extrabold fill-slate-200 select-none"
            >
              B
            </text>
          </g>
        </svg>
      </div>

      {/* Teks Informasi Orientasi & Arah Pandang Kamera */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
            Mata Angin
          </span>
          {!is2D && (
            <RotateCcw className="w-2.5 h-2.5 text-slate-400 group-hover:rotate-180 transition-transform duration-300" />
          )}
        </div>
        <span className={`text-xs font-black leading-tight flex items-center gap-1 ${facingInfo.color || "text-slate-800"}`}>
          {facingInfo.name}
        </span>
        <span className="text-[9.5px] text-slate-500 font-medium leading-none">
          {facingInfo.sub}
        </span>
      </div>
    </div>
  );
};
