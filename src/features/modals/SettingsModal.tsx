import React, { useState } from "react";
import { Check, Radio, Server, Settings, Sliders, X, Zap } from "lucide-react";
import { useRoomStore } from "../../stores/roomStore";
import { useViewStore } from "../../stores/viewStore";

export const SettingsModal: React.FC = () => {
  const { activeModal, openModal } = useViewStore();
  const { connection, brokerUrl, setBrokerUrl } = useRoomStore();

  const [normalTemp, setNormalTemp] = useState(22);
  const [ecoTemp, setEcoTemp] = useState(27);
  const [idleDelay, setIdleDelay] = useState(15);
  const [autoOffDelay, setAutoOffDelay] = useState(120);
  const [localBrokerUrl, setLocalBrokerUrl] = useState(brokerUrl);
  const [tariff, setTariff] = useState(1444);
  const [saved, setSaved] = useState(false);

  if (activeModal !== "settings") return null;

  const handleSave = () => {
    setBrokerUrl(localBrokerUrl.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      openModal(null);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                Pengaturan Sistem Acoptimizer
              </h3>
              <p className="text-xs text-slate-500">
                Konfigurasi Parameter Otomasi & Koneksi MQTT IoT
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
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600">
          {/* Section: Target Suhu Otomasi */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Target Temperatur Otomasi</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <label className="font-semibold text-slate-700 block">
                  Target Suhu Normal (Ada Orang)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="18"
                    max="26"
                    value={normalTemp}
                    onChange={(e) => setNormalTemp(Number(e.target.value))}
                    className="w-20 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold text-center"
                  />
                  <span className="font-bold text-slate-500">°C</span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Standar kenyamanan ruang kuliah & kantor FST.
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <label className="font-semibold text-slate-700 block">
                  Target Suhu Eco (Ruang Kosong)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="24"
                    max="30"
                    value={ecoTemp}
                    onChange={(e) => setEcoTemp(Number(e.target.value))}
                    className="w-20 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold text-center"
                  />
                  <span className="font-bold text-slate-500">°C</span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Menghemat hingga 35% daya kompresor AC.
                </span>
              </div>
            </div>
          </div>

          {/* Section: Threshold Timer */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>Durasi & Waktu Tunggu (Timer)</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <label className="font-semibold text-slate-700 block">
                  Jeda Transisi Kosong (Menit)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={idleDelay}
                  onChange={(e) => setIdleDelay(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold"
                />
                <span className="text-[11px] text-slate-400 block">
                  Grace period saat orang keluar sebentar.
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <label className="font-semibold text-slate-700 block">
                  Auto-Off Kosong Total (Menit)
                </label>
                <input
                  type="number"
                  min="30"
                  max="240"
                  value={autoOffDelay}
                  onChange={(e) => setAutoOffDelay(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold"
                />
                <span className="text-[11px] text-slate-400 block">
                  AC dimatikan total jika kosong $\ge$ 2 jam.
                </span>
              </div>
            </div>
          </div>

          {/* Section: Koneksi MQTT Broker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Server className="w-4 h-4 text-emerald-600" />
                <span>Koneksi Broker MQTT (IoT ESP32)</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {connection}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
              <label className="font-semibold text-slate-700 block">
                WebSocket Broker Endpoint
              </label>
              <input
                type="text"
                value={localBrokerUrl}
                onChange={(e) => setLocalBrokerUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono text-xs"
              />
              <span className="text-[11px] text-slate-400 block">
                Format topik: <code>acoptimizer/fst-uin/v1/6-U1/telemetry</code>
              </span>
            </div>
          </div>

          {/* Section: Biaya Listrik */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Tarif Listrik PLN (Tarif Bisnis / Kampus)</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-700 block">
                  Tarif per kWh (Rupiah)
                </span>
                <span className="text-[11px] text-slate-400">
                  Digunakan untuk kalkulasi estimasi rupiah penghematan energi.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">Rp</span>
                <input
                  type="number"
                  value={tariff}
                  onChange={(e) => setTariff(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold text-right"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            onClick={() => openModal(null)}
            className="px-4 py-2 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm active:scale-95"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <span>Simpan Konfigurasi</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
