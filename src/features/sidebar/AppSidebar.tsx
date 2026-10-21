import React, { useEffect, useRef } from "react";
import {
  BarChart3,
  Bell,
  Box,
  Clock,
  Cpu,
  Radio,
  Settings,
  User,
} from "lucide-react";
import { useRoomStore } from "../../stores/roomStore";
import { useViewStore } from "../../stores/viewStore";

export const AppSidebar: React.FC = () => {
  const {
    isSidebarOpen,
    setSidebarOpen,
    openModal,
    setLayer,
    layer,
    resetToBuilding,
  } = useViewStore();

  const { connection } = useRoomStore();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Tutup sidebar jika user mengklik area lain di luar sidebar
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleDocumentClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [isSidebarOpen, setSidebarOpen]);

  // Handler saat mouse meninggalkan sidebar
  const handleMouseLeave = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setSidebarOpen(false);
    }, 250);
  };

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setSidebarOpen(true);
  };

  return (
    <>
      {/* 1. Invisible Edge Trigger di Sisi Paling Kiri Layar (Hover Zone) */}
      <div
        onMouseEnter={handleMouseEnter}
        className="fixed left-0 top-0 bottom-0 w-3 z-40 pointer-events-auto"
      />

      {/* 2. Floating Sidebar Menu (Hanya Muncul Saat di-Hover / Klik di Luar Akan Menutup) */}
      <aside
        ref={sidebarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed left-4 top-4 bottom-4 w-64 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col justify-between p-4 z-50 select-none transition-all duration-300 ease-out ${
          isSidebarOpen
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "-translate-x-[115%] opacity-0 pointer-events-none"
        }`}
      >
        {/* Konten Atas: Header & Menu Navigasi */}
        <div className="flex flex-col gap-3 w-full">
          {/* Header Bersih (Tanpa Dots macOS & Tanpa Logo Pill) */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Menu Sistem
            </span>
            <span className="text-[10px] text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full font-bold">
              Acoptimizer
            </span>
          </div>

          {/* Daftar Navigasi Utama */}
          <nav className="flex flex-col gap-1 w-full">
            <NavItem
              icon={<Box className="w-4 h-4" />}
              label="Digital Twin 3D/2D"
              badge="Live"
              isActive={true}
              onClick={() => {
                resetToBuilding();
                setSidebarOpen(false);
              }}
            />

            <NavItem
              icon={<BarChart3 className="w-4 h-4" />}
              label="Analisis Energi"
              badge={layer === "energy" ? "Aktif" : undefined}
              isActive={layer === "energy"}
              onClick={() => {
                setLayer(layer === "energy" ? "status" : "energy");
                setSidebarOpen(false);
              }}
            />

            <NavItem
              icon={<Cpu className="w-4 h-4" />}
              label="Aturan Otomasi"
              badge="8 Rules"
              badgeColor="blue"
              onClick={() => {
                openModal("automations");
                setSidebarOpen(false);
              }}
            />

            <NavItem
              icon={<Radio className="w-4 h-4" />}
              label="Perangkat IoT"
              badge={connection === "live" ? "Online" : "Offline"}
              badgeColor="green"
              onClick={() => {
                openModal("settings");
                setSidebarOpen(false);
              }}
            />

            <NavItem
              icon={<Clock className="w-4 h-4" />}
              label="Riwayat Log"
              onClick={() => {
                openModal("automations");
                setSidebarOpen(false);
              }}
            />
          </nav>
        </div>

        {/* Konten Bawah: Notifikasi, Pengaturan & Akun */}
        <div className="flex flex-col gap-1 w-full pt-3 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1">
            Sistem & Profil
          </span>

          <NavItem
            icon={<Bell className="w-4 h-4" />}
            label="Notifikasi"
            badge="0 Alert"
            onClick={() => {
              setSidebarOpen(false);
            }}
          />

          <NavItem
            icon={<Settings className="w-4 h-4" />}
            label="Pengaturan"
            onClick={() => {
              openModal("settings");
              setSidebarOpen(false);
            }}
          />

          {/* Akun Profil Pengguna */}
          <div
            onClick={() => {
              openModal("account");
              setSidebarOpen(false);
            }}
            className="flex items-center gap-2.5 rounded-2xl p-2 hover:bg-slate-100 cursor-pointer transition group mt-1"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
              RR
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-slate-800 text-xs truncate block group-hover:text-blue-600 transition">
                Rifqi Rahman
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate block">
                Admin Sistem FST
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

function NavItem({
  icon,
  label,
  badge,
  badgeColor = "gray",
  isActive = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeColor?: "gray" | "blue" | "green";
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
        isActive
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
      }`}
    >
      <span className={isActive ? "text-white" : "text-slate-500"}>
        {icon}
      </span>
      <span className="flex-1 text-left truncate">{label}</span>
      {badge && (
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
  );
}
