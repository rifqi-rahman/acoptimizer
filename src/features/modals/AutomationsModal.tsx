import React from "react";
import { AlertTriangle, CheckCircle2, Clock, Cpu, Moon, Sparkles, Sun, Thermometer, Wind, X, Zap } from "lucide-react";
import { useViewStore } from "../../stores/viewStore";

export const AutomationsModal: React.FC = () => {
  const { activeModal, openModal } = useViewStore();

  if (activeModal !== "automations") return null;

  const rules = [
    {
      id: 1,
      title: "Kasus #1: Jam Kerja + Ruang Terpakai",
      condition: "Jam < 18:00 & Ada Presensi Manusia (mmWave aktif)",
      action: "Nyalakan AC pada Mode Normal 22°C",
      saving: "Optimal",
      badge: "Kondisi Ideal",
      badgeColor: "bg-emerald-100 text-emerald-700",
      icon: <Sun className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 2,
      title: "Kasus #2: Jam Kerja + Jeda Singkat (< 15 Menit)",
      condition: "Jam < 18:00 & Ruang Baru Saja Kosong (< 15 menit)",
      action: "Pertahankan Status Sebelumnya (Grace Period)",
      saving: "Stabil",
      badge: "Jeda Transisi",
      badgeColor: "bg-amber-100 text-amber-700",
      icon: <Clock className="w-4 h-4 text-amber-600" />,
    },
    {
      id: 3,
      title: "Kasus #3: Jam Kerja + Kosong Tervalidasi (15 - 120 Menit)",
      condition: "Jam < 18:00 & Kosong Terdeteksi > 15 menit",
      action: "Alihkan Otomatis ke Mode Eco 27°C",
      saving: "Hemat ~35%",
      badge: "Kondisi Eco",
      badgeColor: "bg-blue-100 text-blue-700",
      icon: <Wind className="w-4 h-4 text-blue-600" />,
    },
    {
      id: 4,
      title: "Kasus #4: Jam Kerja + Kosong Lama (≥ 2 Jam)",
      condition: "Jam < 18:00 & Tidak Ada Aktivitas ≥ 120 menit",
      action: "Matikan AC Total (Power Off via IR)",
      saving: "Hemat 100%",
      badge: "Auto-Off",
      badgeColor: "bg-purple-100 text-purple-700",
      icon: <Zap className="w-4 h-4 text-purple-600" />,
    },
    {
      id: 5,
      title: "Kasus #5: Luar Jam Kerja + Ruangan Kosong",
      condition: "Jam ≥ 18:00 (Malam) & Tidak Ada Presensi",
      action: "Matikan AC Total (Cegah Lupa Mematikan AC)",
      saving: "Hemat 100%",
      badge: "Standar Malam",
      badgeColor: "bg-slate-100 text-slate-700",
      icon: <Moon className="w-4 h-4 text-slate-600" />,
    },
    {
      id: 6,
      title: "Kasus #6: Luar Jam Kerja + Ada Orang (Lembur)",
      condition: "Jam ≥ 18:00 & Terdeteksi Presensi Manusia",
      action: "Beri Izin AC Beroperasi (Normal 22°C)",
      saving: "Fleksibel",
      badge: "Izin Lembur",
      badgeColor: "bg-indigo-100 text-indigo-700",
      icon: <Sparkles className="w-4 h-4 text-indigo-600" />,
    },
    {
      id: 7,
      title: "Kasus #7: Ruangan Kosong + Suhu Panas (> 29°C)",
      condition: "Suhu > 29°C & Ruangan Kosong",
      action: "Validasi AC Telah Mati Sesuai Prosedur",
      saving: "Hemat 100%",
      badge: "Sesuai Standar",
      badgeColor: "bg-slate-100 text-slate-700",
      icon: <Thermometer className="w-4 h-4 text-slate-600" />,
    },
    {
      id: 8,
      title: "Kasus #8: Ruangan Terpakai + Suhu Panas (> 29°C)",
      condition: "Ada Orang & Suhu Ruangan > 29°C (AC Gagal Dingin)",
      action: "Kirim Peringatan Anomali / Rekomendasi Maintenance AC",
      saving: "Alert",
      badge: "Peringatan Anomali",
      badgeColor: "bg-red-100 text-red-700",
      icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                Logika 8 Aturan Otomasi Cerdas
              </h3>
              <p className="text-xs text-slate-500">
                Decision Matrix Berdasarkan Proposal & Kerangka Berpikir Acoptimizer
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

        {/* Modal Body: Daftar 8 Rules */}
        <div className="p-6 overflow-y-auto space-y-3 text-xs">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-50 transition flex items-start gap-3.5"
            >
              <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                {rule.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-bold text-slate-800 text-xs truncate">
                    {rule.title}
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rule.badgeColor}`}>
                    {rule.badge}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p>
                    <span className="font-semibold text-slate-600">Kondisi:</span> {rule.condition}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-600">Aksi Otomasi:</span>{" "}
                    <span className="text-blue-700 font-semibold">{rule.action}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-500">
            Algoritma dieksekusi secara real-time pada setiap paket telemetri MQTT masuk.
          </span>
          <button
            onClick={() => openModal(null)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/25 active:scale-95 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
