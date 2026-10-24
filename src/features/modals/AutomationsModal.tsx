import React from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Cpu,
  History,
  Moon,
  Play,
  Radio,
  Sparkles,
  Sun,
  Thermometer,
  Trash2,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useRoomStore } from "../../stores/roomStore";
import { useViewStore } from "../../stores/viewStore";

export const AutomationsModal: React.FC = React.memo(function AutomationsModal() {
  const { activeModal, openModal, automationsTab, setAutomationsTab, selectFloor, selectRoom } =
    useViewStore(
      useShallow((s) => ({
        activeModal: s.activeModal,
        openModal: s.openModal,
        automationsTab: s.automationsTab,
        setAutomationsTab: s.setAutomationsTab,
        selectFloor: s.selectFloor,
        selectRoom: s.selectRoom,
      }))
    );

  const {
    commands,
    history,
    alerts,
    rooms,
    triggerScenario,
    acknowledgeAlert,
    clearResolvedAlerts,
  } = useRoomStore(
    useShallow((s) => ({
      commands: s.commands,
      history: s.history,
      alerts: s.alerts,
      rooms: s.rooms,
      triggerScenario: s.triggerScenario,
      acknowledgeAlert: s.acknowledgeAlert,
      clearResolvedAlerts: s.clearResolvedAlerts,
    }))
  );

  if (activeModal !== "automations") return null;

  const pilotRoom = rooms["6-U1"];
  const pilotHistory = (history["6-U1"] ?? []).slice().reverse();
  const activeAlertsCount = alerts.filter((a) => !a.resolvedAt && !a.acknowledged).length;

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
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  Pusat Otomasi, Riwayat Log &amp; Peringatan IoT
                </h3>
                <p className="text-xs text-slate-500">
                  Integrasi Backend Database, MQTT Bridge &amp; 8 Kasus Logika ESP32 R.601
                </p>
              </div>
            </div>

            <button
              onClick={() => openModal(null)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setAutomationsTab("rules")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                automationsTab === "rules"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>8 Aturan Otomasi</span>
            </button>

            <button
              onClick={() => setAutomationsTab("logs")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                automationsTab === "logs"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Perintah &amp; Log ({commands.length + pilotHistory.length})</span>
            </button>

            <button
              onClick={() => setAutomationsTab("alerts")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                automationsTab === "alerts"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Peringatan Sistem</span>
              {activeAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-black">
                  {activeAlertsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-3 text-xs flex-1">
          {automationsTab === "rules" && (
            <>
              {rules.map((rule) => {
                const isActiveRule = pilotRoom?.rule === rule.id && pilotRoom?.online;
                return (
                  <div
                    key={rule.id}
                    className={`p-3.5 rounded-2xl border transition flex items-start gap-3.5 ${
                      isActiveRule
                        ? "bg-blue-50/70 border-blue-300 ring-1 ring-blue-500/20"
                        : "bg-slate-50/80 border-slate-200/70 hover:bg-slate-50"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                      {rule.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="font-bold text-slate-800 text-xs truncate">
                            {rule.title}
                          </h4>
                          {isActiveRule && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-600 text-white">
                              Aktif di R.601
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${rule.badgeColor}`}
                        >
                          {rule.badge}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        <p>
                          <span className="font-semibold text-slate-600">Kondisi:</span>{" "}
                          {rule.condition}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-600">Aksi Otomasi:</span>{" "}
                          <span className="text-blue-700 font-semibold">{rule.action}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        void triggerScenario("6-U1", rule.id);
                        selectFloor(6);
                        selectRoom("6-U1");
                      }}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-200 hover:border-blue-600 text-[11px] font-bold transition flex items-center gap-1.5 flex-shrink-0 shadow-xs cursor-pointer"
                      title="Uji Skenario Kasus Ini pada Ruang R.601"
                    >
                      <Play className="w-3 h-3" />
                      <span>Uji di R.601</span>
                    </button>
                  </div>
                );
              })}
            </>
          )}

          {automationsTab === "logs" && (
            <div className="space-y-5">
              {/* Bagian 1: Riwayat Perintah Remote Override (Web -> MQTT -> ESP32 ACK) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-blue-600" />
                    <span>Riwayat Perintah Kontrol IR (Web App → ESP32)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {commands.length} Perintah Tercatat
                  </span>
                </div>

                {commands.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-slate-400 text-center">
                    Belum ada perintah remote override yang dikirim ke R.601.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {commands.slice(0, 15).map((cmd) => (
                      <div
                        key={cmd.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">
                              [{cmd.slotId}] {cmd.irAction}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {cmd.id}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            Dikirim: {new Date(cmd.createdAt).toLocaleTimeString("id-ID")}
                            {cmd.ackedAt
                              ? ` • ACK ESP32: ${new Date(cmd.ackedAt).toLocaleTimeString("id-ID")}`
                              : ""}
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            cmd.status === "acked"
                              ? "bg-emerald-100 text-emerald-700"
                              : cmd.status === "sent"
                              ? "bg-blue-100 text-blue-700"
                              : cmd.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {cmd.status === "acked"
                            ? "ACK Diterima"
                            : cmd.status === "sent"
                            ? "Terkirim"
                            : cmd.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bagian 2: Log Telemetri Sensor R.601 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Log Telemetri Sensor R.601 (DHT22 + mmWave)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Menampilkan {Math.min(20, pilotHistory.length)} dari {pilotHistory.length} Sampel
                  </span>
                </div>

                {pilotHistory.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-slate-400 text-center">
                    Belum ada paket telemetri masuk di sesi ini.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {pilotHistory.slice(0, 20).map((pt, idx) => (
                      <div
                        key={`${pt.timestamp}-${idx}`}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-slate-400">
                            {new Date(pt.timestamp).toLocaleTimeString("id-ID")}
                          </span>
                          <span className="font-bold text-slate-800">
                            {pt.temp.toFixed(1)}°C / {pt.hum}%
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              pt.presence
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {pt.presence ? "ADA ORANG" : `KOSONG (${pt.minutesEmpty}m)`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-slate-500">
                            Kasus #{pt.rule} • AC {pt.acMode.toUpperCase()} ({pt.powerKw} kW)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {automationsTab === "alerts" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Daftar Peringatan Otomatis (Anomali Suhu, Lembur &amp; Pemborosan)
                </span>
                {alerts.length > 0 && (
                  <button
                    onClick={() => void clearResolvedAlerts()}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Bersihkan Selesai</span>
                  </button>
                )}
              </div>

              {alerts.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/70 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-700 text-sm">
                    Tidak Ada Peringatan Sistem Aktif
                  </p>
                  <p className="text-xs text-slate-400">
                    Semua kondisi temperatur dan operasional AC di Ruang R.601 berjalan normal.
                  </p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                      alert.resolvedAt || alert.acknowledged
                        ? "bg-slate-50 border-slate-200 opacity-70"
                        : alert.severity === "critical"
                        ? "bg-red-50/80 border-red-200"
                        : "bg-amber-50/80 border-amber-200"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            alert.severity === "critical"
                              ? "bg-red-600 text-white"
                              : "bg-amber-500 text-white"
                          }`}
                        >
                          {alert.type}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {new Date(alert.startedAt).toLocaleTimeString("id-ID")}
                        </span>
                        {alert.resolvedAt && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Teratasi
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800">{alert.message}</p>
                    </div>

                    {!alert.acknowledged && !alert.resolvedAt && (
                      <button
                        onClick={() => void acknowledgeAlert(alert.id)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold flex-shrink-0 transition cursor-pointer"
                      >
                        Tandai Dibaca
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-500">
            Seluruh log telemetri, command ACK, dan peringatan tersinkronisasi dengan Backend API.
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
});
