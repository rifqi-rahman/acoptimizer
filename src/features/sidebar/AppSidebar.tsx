import React from "react";
import {
  BarChart3,
  Bell,
  Box,
  Building2,
  ChevronDown,
  Clock,
  Cpu,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  Settings,
  ShieldCheck,
  User,
  Wind,
  Zap,
} from "lucide-react";
import { useRoomStore } from "../../stores/roomStore";
import { useViewStore } from "../../stores/viewStore";

export const AppSidebar: React.FC = () => {
  const {
    isSidebarExpanded,
    toggleSidebar,
    openModal,
    setLayer,
    layer,
    resetToBuilding,
  } = useViewStore();

  const { connection } = useRoomStore();

  return (
    <aside
      className={`h-full bg-white rounded-3xl shadow-xl border border-slate-200/90 flex flex-col justify-between transition-all duration-300 ease-in-out select-none flex-shrink-0 relative z-40 overflow-hidden ${
        isSidebarExpanded ? "w-64 p-4" : "w-16 p-2.5 items-center"
      }`}
    >
      {/* 1. Header Bagian Atas: macOS Traffic Lights & Logo */}
      <div className="flex flex-col gap-3 w-full">
        {/* macOS Traffic Lights Window Dots */}
        <div
          className={`flex items-center gap-1.5 pt-1 ${
            isSidebarExpanded ? "px-1 justify-between" : "justify-center"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-black/10 shadow-inner" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-black/10 shadow-inner" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-black/10 shadow-inner" />
          </div>

          {/* Toggle Expand/Collapse Button (hanya saat expanded) */}
          {isSidebarExpanded && (
            <button
              onClick={toggleSidebar}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
              title="Ciutkan Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Brand App Icon & Workspace Identity */}
        <div
          onClick={isSidebarExpanded ? undefined : toggleSidebar}
          className={`flex items-center gap-2.5 rounded-2xl p-1.5 transition ${
            !isSidebarExpanded ? "cursor-pointer hover:bg-slate-50" : ""
          }`}
        >
          {/* Logo Rounded Box */}
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md flex-shrink-0">
            <Wind className="w-5 h-5 text-blue-400" />
          </div>

          {/* Title Text saat Expanded */}
          {isSidebarExpanded && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 text-sm tracking-tight truncate block">
                  Acoptimizer
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              </div>
              <span className="text-[11px] text-slate-400 font-medium truncate block">
                fst.uinjkt.ac.id
              </span>
            </div>
          )}
        </div>

        {/* Toggle Expand Button saat Collapsed */}
        {!isSidebarExpanded && (
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition my-0.5"
            title="Buka Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* Garis Pembatas Tipis */}
        <div className="w-full h-[1px] bg-slate-100 my-0.5" />

        {/* 2. Menu Navigasi Utama */}
        <nav className="flex flex-col gap-1 w-full">
          {/* Menu: Digital Twin (Aktif) */}
          <NavItem
            icon={<Box className="w-4 h-4" />}
            label="Digital Twin"
            badge="Live"
            isActive={true}
            isExpanded={isSidebarExpanded}
            onClick={resetToBuilding}
          />

          {/* Menu: Analisis Energi */}
          <NavItem
            icon={<BarChart3 className="w-4 h-4" />}
            label="Analisis Energi"
            badge={layer === "energy" ? "Aktif" : undefined}
            isActive={layer === "energy"}
            isExpanded={isSidebarExpanded}
            onClick={() => setLayer(layer === "energy" ? "status" : "energy")}
          />

          {/* Menu: Aturan Otomasi */}
          <NavItem
            icon={<Cpu className="w-4 h-4" />}
            label="Aturan Otomasi"
            badge="8 Rules"
            badgeColor="blue"
            isExpanded={isSidebarExpanded}
            onClick={() => openModal("automations")}
          />

          {/* Menu: Perangkat IoT */}
          <NavItem
            icon={<Radio className="w-4 h-4" />}
            label="Perangkat IoT"
            badge={connection === "live" ? "1 Aktif" : "Offline"}
            badgeColor="green"
            isExpanded={isSidebarExpanded}
            onClick={() => openModal("settings")}
          />

          {/* Menu: Riwayat Log */}
          <NavItem
            icon={<Clock className="w-4 h-4" />}
            label="Riwayat Log"
            isExpanded={isSidebarExpanded}
            onClick={() => openModal("automations")}
          />
        </nav>
      </div>

      {/* 3. Footer Bagian Bawah: Notifikasi, Settings & Akun Profil */}
      <div className="flex flex-col gap-1 w-full pt-2 border-t border-slate-100">
        {/* Section Label saat Expanded */}
        {isSidebarExpanded && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1">
            Sistem & Pengaturan
          </span>
        )}

        {/* Notifikasi Alerts */}
        <NavItem
          icon={<Bell className="w-4 h-4" />}
          label="Notifikasi"
          badge="0 Alert"
          isExpanded={isSidebarExpanded}
          onClick={() => {}}
        />

        {/* Pengaturan Sistem */}
        <NavItem
          icon={<Settings className="w-4 h-4" />}
          label="Pengaturan"
          isExpanded={isSidebarExpanded}
          onClick={() => openModal("settings")}
        />

        {/* Akun Profil */}
        <div
          onClick={() => openModal("account")}
          className={`flex items-center gap-2.5 rounded-2xl p-1.5 hover:bg-slate-100 cursor-pointer transition group relative ${
            !isSidebarExpanded ? "justify-center" : ""
          }`}
          title={!isSidebarExpanded ? "Akun: Rifqi Rahman (Admin FST)" : undefined}
        >
          {/* User Avatar Circle */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
            RR
          </div>

          {/* User Info saat Expanded */}
          {isSidebarExpanded && (
            <div className="flex-1 min-w-0">
              <span className="font-bold text-slate-800 text-xs truncate block group-hover:text-blue-600 transition">
                Rifqi Rahman
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate block">
                Admin Sistem FST
              </span>
            </div>
          )}

          {/* Floating Tooltip saat Collapsed */}
          {!isSidebarExpanded && (
            <div className="pointer-events-none absolute left-full ml-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold rounded-xl shadow-xl whitespace-nowrap opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 z-50">
              Akun Profil
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900/90 rotate-45" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

// Sub-komponen NavItem yang responsif terhadap mode Collapsed / Expanded
function NavItem({
  icon,
  label,
  badge,
  badgeColor = "gray",
  isActive = false,
  isExpanded,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeColor?: "gray" | "blue" | "green";
  isActive?: boolean;
  isExpanded: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative group w-full flex items-center justify-center">
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
          !isExpanded ? "justify-center" : ""
        } ${
          isActive
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        }`}
      >
        <span className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-800"}>
          {icon}
        </span>

        {isExpanded && (
          <span className="flex-1 text-left truncate">{label}</span>
        )}

        {isExpanded && badge && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              badgeColor === "blue"
                ? "bg-blue-100 text-blue-700"
                : badgeColor === "green"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {badge}
          </span>
        )}
      </button>

      {/* Floating Tooltip saat Collapsed */}
      {!isExpanded && (
        <div className="pointer-events-none absolute left-full ml-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold rounded-xl shadow-xl whitespace-nowrap opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 z-50">
          {label}
          {badge && ` (${badge})`}
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900/90 rotate-45" />
        </div>
      )}
    </div>
  );
}
