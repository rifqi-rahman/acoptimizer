import React, { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  Box,
  ChevronDown,
  Clock,
  Cpu,
  Radio,
  Settings,
  Wind,
} from "lucide-react";
import { useRoomStore } from "../../stores/roomStore";
import { useViewStore } from "../../stores/viewStore";

export const AppSidebar: React.FC = () => {
  const { openModal, setLayer, layer, resetToBuilding } = useViewStore();
  const { connection } = useRoomStore();

  const [isHovered, setIsHovered] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Tutup sidebar saat user klik di daerah lain di luar sidebar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setIsHovered(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    // Footprint tetap w-16 di layout flex, dengan z-50 agar selalu berada di layer paling atas
    <div className="relative w-16 h-full flex-shrink-0 z-50">
      <aside
        ref={sidebarRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`absolute left-0 top-0 bottom-0 h-full bg-white rounded-3xl border border-slate-200/90 flex flex-col justify-between p-3 transition-[width,box-shadow] duration-300 ease-out select-none overflow-hidden ${
          isHovered
            ? "w-64 shadow-2xl z-50 ring-1 ring-slate-900/5"
            : "w-16 shadow-xl z-50"
        }`}
      >
        {/* 1. Header Bagian Atas: App Logo & Brand Title */}
        <div className="flex flex-col gap-3 w-full">
          {/* Header Row: Fixed h-10, Icon tetap diam di tempat */}
          <div className="flex items-center h-10 w-full overflow-hidden">
            {/* Logo Box: Background Terang Cerah (Bukan Gelap) */}
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 flex-shrink-0">
              <Wind className="w-5 h-5 text-white" />
            </div>

            {/* Title Text "Acoptimizer": Memanjang ke kanan tanpa menggeser icon atau mengubah tinggi */}
            <div
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out flex items-center ${
                isHovered ? "w-44 opacity-100 pl-3" : "w-0 opacity-0 pointer-events-none"
              }`}
            >
              <span className="font-black text-slate-900 text-sm tracking-tight truncate block">
                Acoptimizer
              </span>
            </div>
          </div>

          {/* Garis Pembatas Tipis Permanen */}
          <div className="w-full h-[1px] bg-slate-100 my-0.5" />

          {/* 2. Menu Navigasi Utama: Fixed vertical height per item */}
          <nav className="flex flex-col gap-1 w-full">
            {/* Menu: Monitoring (sebelumnya Digital Twin) */}
            <NavItem
              icon={<Box className="w-4 h-4" />}
              label="Monitoring"
              badge="Live"
              isActive={true}
              isExpanded={isHovered}
              onClick={() => {
                resetToBuilding();
                setIsHovered(false);
              }}
            />

            {/* Menu: Analisis Energi */}
            <NavItem
              icon={<BarChart3 className="w-4 h-4" />}
              label="Analisis Energi"
              badge={layer === "energy" ? "Aktif" : undefined}
              isActive={layer === "energy"}
              isExpanded={isHovered}
              onClick={() => {
                setLayer(layer === "energy" ? "status" : "energy");
                setIsHovered(false);
              }}
            />

            {/* Menu: Aturan Otomasi */}
            <NavItem
              icon={<Cpu className="w-4 h-4" />}
              label="Aturan Otomasi"
              badge="8 Rules"
              badgeColor="blue"
              isExpanded={isHovered}
              onClick={() => {
                openModal("automations");
                setIsHovered(false);
              }}
            />

            {/* Menu: Perangkat IoT */}
            <NavItem
              icon={<Radio className="w-4 h-4" />}
              label="Perangkat IoT"
              badge={connection === "live" ? "1 Aktif" : "Offline"}
              badgeColor="green"
              isExpanded={isHovered}
              onClick={() => {
                openModal("settings");
                setIsHovered(false);
              }}
            />

            {/* Menu: Riwayat Log */}
            <NavItem
              icon={<Clock className="w-4 h-4" />}
              label="Riwayat Log"
              isExpanded={isHovered}
              onClick={() => {
                openModal("automations");
                setIsHovered(false);
              }}
            />
          </nav>
        </div>

        {/* 3. Footer Bagian Bawah: Notifikasi, Settings & Akun Profil */}
        <div className="flex flex-col gap-1 w-full pt-2 border-t border-slate-100">
          {/* Notifikasi Alerts */}
          <NavItem
            icon={<Bell className="w-4 h-4" />}
            label="Notifikasi"
            badge="0 Alert"
            isExpanded={isHovered}
            onClick={() => {}}
          />

          {/* Pengaturan Sistem */}
          <NavItem
            icon={<Settings className="w-4 h-4" />}
            label="Pengaturan"
            isExpanded={isHovered}
            onClick={() => {
              openModal("settings");
              setIsHovered(false);
            }}
          />

          {/* Akun Profil: Fixed h-10, Icon Avatar diam di tempat, icon "v" dipindahkan ke sini */}
          <div className="relative group w-full">
            <div
              onClick={() => {
                openModal("account");
                setIsHovered(false);
              }}
              className="flex items-center h-10 w-full rounded-xl hover:bg-slate-100 cursor-pointer transition-colors duration-150 overflow-hidden"
            >
              {/* User Avatar Circle: Posisi tetap diam */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                RR
              </div>

              {/* User Info & Icon "v" (ChevronDown) muncul memanjang ke kanan */}
              <div
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out flex items-center justify-between ${
                  isHovered ? "w-44 opacity-100 pl-2.5" : "w-0 opacity-0 pointer-events-none"
                }`}
              >
                <div className="flex flex-col min-w-0 pr-1">
                  <span className="font-bold text-slate-800 text-xs truncate block leading-tight">
                    Rifqi Rahman
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate block leading-tight">
                    Admin Sistem FST
                  </span>
                </div>

                {/* Icon "v" (ChevronDown) dipindahkan ke akun */}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mr-1" />
              </div>
            </div>

            {/* Floating Tooltip saat Collapsed */}
            {!isHovered && (
              <div className="pointer-events-none absolute left-full ml-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold rounded-xl shadow-xl whitespace-nowrap opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 z-50">
                Akun Profil
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900/90 rotate-45" />
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

// Sub-komponen NavItem dengan Posisi Icon Tetap Beku di Tempat
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
    <div className="relative group w-full">
      <button
        onClick={onClick}
        className={`w-full h-10 flex items-center rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer overflow-hidden ${
          isActive
            ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
            : "text-slate-600 hover:text-blue-600 hover:bg-blue-50/70"
        }`}
      >
        {/* Wadah Icon: Fixed w-10 h-10, Posisi tetap dan tidak pernah bergeser */}
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
          <span
            className={
              isActive
                ? "text-white"
                : "text-slate-400 group-hover:text-blue-600 transition-colors"
            }
          >
            {icon}
          </span>
        </div>

        {/* Text Label & Badge: Memanjang mulus ke kanan secara horizontal */}
        <div
          className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out flex items-center justify-between ${
            isExpanded ? "w-44 opacity-100 pl-2.5" : "w-0 opacity-0 pointer-events-none"
          }`}
        >
          <span className="text-left truncate">{label}</span>

          {badge && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mr-1 ${
                isActive
                  ? "bg-white/25 text-white"
                  : badgeColor === "blue"
                  ? "bg-blue-100 text-blue-700"
                  : badgeColor === "green"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {badge}
            </span>
          )}
        </div>
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
