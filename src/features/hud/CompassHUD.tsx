import React, { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useViewStore } from "../../stores/viewStore";

/**
 * Kompas Mata Angin HUD Interaktif Gedung FST
 * Ukuran diperbesar dan tanpa panel teks, fokus murni pada dial kompas:
 * - U (Utara): Sisi gedung berpintu masuk dengan atap kanopi kuning (+Z) -> Ditandai Merah
 * - T (Timur): Sisi samping kiri gedung (-X)
 * - S (Selatan): Sisi gedung menghadap ke atas / berseberangan (-Z)
 * - B (Barat): Sisi samping kanan gedung (+X)
 */
export const CompassHUD: React.FC = React.memo(function CompassHUD() {
  const { cameraAzimuth, triggerResetCamera } = useViewStore(
    useShallow((s) => ({
      cameraAzimuth: s.cameraAzimuth,
      triggerResetCamera: s.triggerResetCamera,
    }))
  );

  // Rotasi dial kompas 3D (dalam derajat)
  const rotDeg = (cameraAzimuth * 180) / Math.PI;

  // Hitung posisi koordinat huruf mata angin di sekeliling lingkaran kompas
  // Diameter viewBox = 72x72, Center = (36, 36), Radius = 24.5px
  const positions = useMemo(() => {
    const cx = 36;
    const cy = 36;
    const r = 24.5;

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

  // Tick marks keliling lingkaran (setiap 30 derajat)
  const tickMarks = useMemo(() => {
    const cx = 36;
    const cy = 36;
    return [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((t) => {
      const rad = (t * Math.PI) / 180;
      const isCardinal = t % 90 === 0;
      return {
        key: t,
        x1: cx + 33.5 * Math.sin(rad),
        y1: cy - 33.5 * Math.cos(rad),
        x2: cx + (isCardinal ? 29.5 : 31.5) * Math.sin(rad),
        y2: cy - (isCardinal ? 29.5 : 31.5) * Math.cos(rad),
        stroke: isCardinal ? "#64748B" : "#334155",
        strokeWidth: isCardinal ? 1.5 : 1,
      };
    });
  }, []);

  return (
    <div
      onClick={() => triggerResetCamera()}
      title="Kompas Gedung FST (U=Utara, T=Timur, S=Selatan, B=Barat)&#10;Klik untuk reset orientasi kamera ke Sisi Utara (Depan)"
      className="absolute top-4 right-4 z-30 pointer-events-auto w-20 h-20 rounded-full bg-white/95 backdrop-blur-md shadow-xl border border-slate-200/90 select-none p-1 flex items-center justify-center transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-2xl hover:border-slate-300"
    >
      {/* Dial Kompas Interaktif Diperbesar dengan 4 Tanda Baca Mata Angin (U, T, S, B) */}
      <div className="relative w-full h-full rounded-full bg-slate-900 shadow-inner flex items-center justify-center overflow-hidden border border-slate-700/70">
        <svg viewBox="0 0 72 72" className="w-full h-full pointer-events-none">
          {/* Latar Belakang Dial & Ring Aksen */}
          <circle cx="36" cy="36" r="34" fill="#0F172A" stroke="#334155" strokeWidth="1" />
          <circle cx="36" cy="36" r="26.5" fill="none" stroke="#1E293B" strokeWidth="0.8" strokeDasharray="2 2.5" />

          {/* Jarum Kompas 3D & Aksen Rotasi Mengikuti Kamera */}
          <g transform={`rotate(${rotDeg}, 36, 36)`} className="transition-transform duration-100 ease-out">
            {/* Garis-garis Tick Derajat */}
            {tickMarks.map((tm) => (
              <line
                key={tm.key}
                x1={tm.x1}
                y1={tm.y1}
                x2={tm.x2}
                y2={tm.y2}
                stroke={tm.stroke}
                strokeWidth={tm.strokeWidth}
              />
            ))}

            {/* Jarum Merah Arah UTARA (Sisi Atap Kanopi Kuning / Posisi 180 deg) */}
            <polygon points="36,36 32.5,36 36,57 39.5,36" fill="#EF4444" />
            <polygon points="36,36 36,57 39.5,36" fill="#DC2626" />

            {/* Jarum Abu-Abu Arah SELATAN (Sisi Belakang / Posisi 0 deg) */}
            <polygon points="36,36 32.5,36 36,15 39.5,36" fill="#94A3B8" />
            <polygon points="36,36 36,15 39.5,36" fill="#64748B" />

            {/* Sayap Crosshair Halus ke Timur & Barat */}
            <polygon points="36,36 36,34 18,36 36,38" fill="#475569" />
            <polygon points="36,36 36,34 54,36 36,38" fill="#475569" />

            {/* Titik Poros Tengah */}
            <circle cx="36" cy="36" r="3.2" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.2" />
          </g>

          {/* 4 Tanda Baca Mata Angin (U, T, S, B) yang Selalu Tegak & Mengorbit Mengikuti Sudut Pandang */}
          {/* 1. U -> UTARA (Merah Spesial) */}
          <g className="transition-all duration-100 ease-out">
            <circle cx={positions.U.x} cy={positions.U.y} r="5.5" fill="#EF4444" stroke="#B91C1C" strokeWidth="0.8" />
            <text
              x={positions.U.x}
              y={positions.U.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[8px] font-black fill-white select-none"
            >
              U
            </text>
          </g>

          {/* 2. T -> TIMUR (Sisi Sayap Kiri) */}
          <g className="transition-all duration-100 ease-out">
            <circle cx={positions.T.x} cy={positions.T.y} r="5" fill="#1E293B" stroke="#475569" strokeWidth="0.9" />
            <text
              x={positions.T.x}
              y={positions.T.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[7.5px] font-extrabold fill-slate-200 select-none"
            >
              T
            </text>
          </g>

          {/* 3. S -> SELATAN (Sisi Berseberangan / Atas) */}
          <g className="transition-all duration-100 ease-out">
            <circle cx={positions.S.x} cy={positions.S.y} r="5" fill="#1E293B" stroke="#475569" strokeWidth="0.9" />
            <text
              x={positions.S.x}
              y={positions.S.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[7.5px] font-extrabold fill-slate-200 select-none"
            >
              S
            </text>
          </g>

          {/* 4. B -> BARAT (Sisi Sayap Kanan) */}
          <g className="transition-all duration-100 ease-out">
            <circle cx={positions.B.x} cy={positions.B.y} r="5" fill="#1E293B" stroke="#475569" strokeWidth="0.9" />
            <text
              x={positions.B.x}
              y={positions.B.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[7.5px] font-extrabold fill-slate-200 select-none"
            >
              B
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
});
