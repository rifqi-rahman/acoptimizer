import React from "react";
import { Activity, Flame, Users, Zap } from "lucide-react";
import { useViewStore, VisualizationLayer } from "../../stores/viewStore";

export const LayerSwitcher: React.FC = () => {
  const { layer, setLayer } = useViewStore();

  const layers: { id: VisualizationLayer; label: string; icon: React.ReactNode }[] = [
    { id: "status", label: "Status AC", icon: <Activity className="w-3.5 h-3.5" /> },
    { id: "temperature", label: "Suhu (°C)", icon: <Flame className="w-3.5 h-3.5" /> },
    { id: "presence", label: "Presensi", icon: <Users className="w-3.5 h-3.5" /> },
    { id: "energy", label: "Daya (kW)", icon: <Zap className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-xl border border-slate-200/80">
      {layers.map((item) => {
        const isActive = layer === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setLayer(item.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition ${
              isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                : "text-slate-600 hover:text-blue-600 hover:bg-blue-50/70"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
