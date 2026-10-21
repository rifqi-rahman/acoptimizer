import React, { useRef, useState } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { FloorModel, RoomGeometry } from "../../building/params";
import { deriveRoomStatus, RoomClimateStatus } from "../../domain/roomStatus";
import { useRoomStore } from "../../stores/roomStore";
import { useViewStore, VisualizationLayer } from "../../stores/viewStore";

interface FloorPlan2DProps {
  floor: FloorModel;
}

export function getStatusColor(
  status: RoomClimateStatus,
  layer: VisualizationLayer,
  temp: number | null
): string {
  if (layer === "temperature" && temp !== null) {
    if (temp <= 22) return "#3B82F6"; // Biru sejuk
    if (temp <= 25) return "#10B981"; // Hijau nyaman
    if (temp <= 28) return "#F59E0B"; // Kuning hangat
    return "#EF4444"; // Merah panas
  }

  switch (status) {
    case "OCCUPIED":
      return "#22C55E"; // Hijau
    case "TRANSITION":
      return "#EAB308"; // Kuning
    case "ECO":
      return "#3B82F6"; // Biru
    case "IDLE":
      return "#E2E8F0"; // Abu terang
    case "WASTE":
      return "#EF4444"; // Merah
    case "ANOMALY":
      return "#F97316"; // Oranye
    case "AFTER_HOURS_OCCUPIED":
      return "#A855F7"; // Ungu
    case "OFFLINE":
      return "#94A3B8"; // Abu gelap
    case "NO_DEVICE":
    default:
      return "#F1F5F9"; // Netral
  }
}

export const FloorPlan2D: React.FC<FloorPlan2DProps> = ({ floor }) => {
  const { rooms: liveRooms } = useRoomStore();
  const { selectedSlotId, selectRoom, layer } = useViewStore();

  const now = new Date();

  // Dimensi dasar koordinat denah (64m x 56m + margin keliling)
  const vbWidth = 74;
  const vbHeight = 66;

  // State Zoom & Pan di dalam kontainer 3/4
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistRef = useRef<number | null>(null);

  // Wheel Zoom (hanya aktif saat cursor berada di dalam kontainer visual ini)
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = -e.deltaY * 0.0018;
    setZoom((prev) => Math.min(3.5, Math.max(0.6, prev + delta)));
  };

  // Drag Pan Mouse
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = ((e.clientX - dragStartRef.current.x) * (vbWidth / 700)) / zoom;
    const dy = ((e.clientY - dragStartRef.current.y) * (vbHeight / 700)) / zoom;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y - dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Touch Pinch Zoom
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (lastTouchDistRef.current !== null) {
        const diff = (dist - lastTouchDistRef.current) * 0.006;
        setZoom((z) => Math.min(3.5, Math.max(0.6, z + diff)));
      }
      lastTouchDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`w-full h-full relative select-none overflow-hidden bg-[#F8FAFC] flex items-center justify-center ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {/* Header Info Pill di Dalam Panel 2D */}
      <div className="absolute top-4 left-16 z-20 flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-slate-200/80">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">
            Denah 2D • {floor.label}
          </h2>
          <p className="text-[10px] text-slate-500">
            {floor.rooms.length} Ruangan • Desain Atrium Terbuka
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] pl-2 border-l border-slate-200">
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Terpakai
          </span>
          <span className="flex items-center gap-1 font-medium text-slate-600 ml-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Eco
          </span>
          <span className="flex items-center gap-1 font-medium text-slate-600 ml-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Nonaktif
          </span>
        </div>
      </div>

      {/* SVG Canvas Spasial 2D dengan Pan & Zoom */}
      <svg
        viewBox={`-${vbWidth / 2} -${vbHeight / 2} ${vbWidth} ${vbHeight}`}
        className="w-full h-full max-h-[85vh] transition-transform duration-75 ease-out"
      >
        <g
          transform={`translate(${pan.x}, ${-pan.y}) scale(${zoom})`}
          style={{ transformOrigin: "0 0" }}
        >
          {/* Outline Gedung Terluar */}
          <polygon
            points={floor.outerPolygon.map(([x, y]) => `${x},${-y}`).join(" ")}
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="0.8"
          />

          {/* Void Atrium Tengah (Taman / Ruang Kosong Melingkar) */}
          <polygon
            points={floor.voidPolygon.map(([x, y]) => `${x},${-y}`).join(" ")}
            fill="#F1F5F9"
            stroke="#94A3B8"
            strokeDasharray="1,1"
            strokeWidth="0.6"
          />
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[2.2px] font-bold fill-slate-400 select-none uppercase tracking-widest"
          >
            {floor.level === 1 ? "Taman & Area Berkumpul" : "Void / Atrium Terbuka"}
          </text>

          {/* Ruangan-Ruangan */}
          {floor.rooms.map((room: RoomGeometry) => {
            const live = liveRooms[room.slotId];
            const status: RoomClimateStatus = live
              ? deriveRoomStatus(live, now)
              : room.hasDevice
              ? "OCCUPIED"
              : "NO_DEVICE";

            const color = getStatusColor(status, layer, live?.temperature ?? null);
            const isSelected = selectedSlotId === room.slotId;

            return (
              <g
                key={room.slotId}
                onClick={(e) => {
                  e.stopPropagation();
                  selectRoom(room.slotId);
                }}
                className="cursor-pointer transition-transform hover:opacity-90"
              >
                <polygon
                  points={room.polygon.map(([x, y]) => `${x},${-y}`).join(" ")}
                  fill={color}
                  stroke={isSelected ? "#2563EB" : "#94A3B8"}
                  strokeWidth={isSelected ? "1.2" : "0.5"}
                  className="transition-colors duration-300"
                />

                {/* Room Label */}
                <text
                  x={room.center[0]}
                  y={-room.center[1]}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`font-bold select-none ${
                    room.size[1] <= 3.5 ? "text-[1.2px]" : "text-[1.8px]"
                  } ${
                    status === "OCCUPIED" || status === "ECO" || status === "WASTE"
                      ? "fill-white"
                      : "fill-slate-700"
                  }`}
                >
                  {room.kind === "stairs"
                    ? "T. Darurat"
                    : room.displayName.replace("Ruang ", "R.")}
                </text>

                {/* Temperature or Device Marker */}
                {room.hasDevice && (
                  <circle
                    cx={room.center[0] + room.size[0] / 2 - 1.2}
                    cy={-room.center[1] - room.size[1] / 2 + 1.2}
                    r="0.8"
                    fill="#10B981"
                    className="animate-pulse"
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Zoom & Reset Controls di Pojok Kanan Bawah Panel 2D */}
      <div className="absolute right-4 bottom-4 z-20 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-200/90">
        <button
          onClick={() => setZoom((z) => Math.min(3.5, z + 0.25))}
          title="Perbesar (Zoom In)"
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-xl text-slate-700 transition active:scale-95"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.25))}
          title="Perkecil (Zoom Out)"
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-xl text-slate-700 transition active:scale-95"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          title="Reset Zoom & Posisi"
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-xl text-slate-700 transition active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
