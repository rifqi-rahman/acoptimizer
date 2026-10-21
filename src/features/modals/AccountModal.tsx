import React from "react";
import { CheckCircle2, GraduationCap, Key, LogOut, ShieldCheck, User, X } from "lucide-react";
import { useViewStore } from "../../stores/viewStore";

export const AccountModal: React.FC = () => {
  const { activeModal, openModal } = useViewStore();

  if (activeModal !== "account") return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                Akun Pengguna & Otorisasi
              </h3>
              <p className="text-xs text-slate-500">
                Profil Administrator Smart Building FST UIN Jakarta
              </p>
            </div>
          </div>

          <button
            onClick={() => openModal(null)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs text-slate-600">
          {/* User Profile Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/80 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md flex-shrink-0">
              RR
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-base font-black text-slate-900 truncate">
                  Rifqi Rahman
                </h4>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                  Admin FST
                </span>
              </div>
              <p className="text-slate-500 text-xs">
                Teknik Informatika • UIN Syarif Hidayatullah Jakarta
              </p>
              <p className="text-[11px] text-slate-400">
                Project Lead: Acoptimizer Smart Climate Twin
              </p>
            </div>
          </div>

          {/* Academic & Faculty Info */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider block">
              Unit Kerja & Lokasi Riset
            </span>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-700">
                  Gedung Fakultas Sains dan Teknologi (FST)
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>Ruang Uji Coba Terpasang: Ruang 601 (Lantai 6 Sayap Utara)</span>
              </div>
            </div>
          </div>

          {/* Hak Akses & Permissions */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider block">
              Hak Akses & Otorisasi Sistem
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="font-medium text-slate-700">Kontrol Override AC (IR)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="font-medium text-slate-700">Konfigurasi Aturan Otomasi</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="font-medium text-slate-700">Monitoring Telemetri IoT</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="font-medium text-slate-700">Akses Broker MQTT WebSocket</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            onClick={() => openModal(null)}
            className="flex items-center gap-1.5 text-red-600 hover:text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sesi</span>
          </button>

          <button
            onClick={() => openModal(null)}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
