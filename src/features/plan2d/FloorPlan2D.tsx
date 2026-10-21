import React from "react";
import { FloorModel, RoomGeometry } from "../../building/params";
import { deriveRoomStatus, RoomClimateStatus } from "../../domain/roomStatus";
import { useRoomStore } from "../../stores/roomStore";
import { useViewStore, VisualizationLayer } from "../../stores/viewStore";

interface FloorPlan2DProps {
  floor: FloorModel;
}

export function getStatusColor(status: RoomClimateStatus, layer: VisualizationLayer, temp: number | null): string {
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

  // Dimensi ViewBox SVG (mencakup 64 x 56 meter + margin)
  const vbWidth = 72;
  const vbHeight = 64;

  return (
    <div className="w-full h-full flex items-center justify-center p-8 select-none">
      <div className="relative max-w-4xl w-full aspect-[4/3] bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 flex flex-col">
        {/* Floor Header */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{floor.label}</h2>
            <p className="text-xs text-slate-500">
              {floor.rooms.length} Ruangan • Desain Atrium Terbuka (Void di Tengah)
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Terpakai
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600 ml-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Eco
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600 ml-2">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Pemborosan
            </span>
          </div>
        </div>

        {/* Interactive SVG Map */}
        <div className="relative flex-1 w-full h-full flex items-center justify-center">
          <svg
            viewBox={`-${vbWidth / 2} -${vbHeight / 2} ${vbWidth} ${vbHeight}`}
            className="w-full h-full max-h-[520px] transition-all"
          >
            {/* Outline Gedung Terluar */}
            <polygon
              points={floor.outerPolygon.map(([x, y]) => `${x},${-y}`).join(" ")}
              fill="#F8FAFC"
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
                  onClick={() => selectRoom(room.slotId)}
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
                    className={`text-[1.8px] font-bold select-none ${
                      status === "OCCUPIED" || status === "ECO" || status === "WASTE"
                        ? "fill-white"
                        : "fill-slate-700"
                    }`}
                  >
                    {room.displayName.replace("Ruang ", "R.")}
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
          </svg>
        </div>
      </div>
    </div>
  );
};
