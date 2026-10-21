import { useEffect } from "react";
import { evaluateAutomation } from "../domain/automation";
import { TelemetryPayload } from "../domain/contract";
import { useRoomStore } from "../stores/roomStore";

/**
 * Mock Device Simulator yang mensimulasikan data telemetri real-time di client
 * Berguna saat hardware sedang diuji atau broker belum diaktifkan.
 */
export function useMockSimulation(enabled = true) {
  const { rooms, updateTelemetry, setConnection } = useRoomStore();

  useEffect(() => {
    if (!enabled) return;

    setConnection("live");

    // Simulasi telemetri periodik tiap 4 detik
    const interval = setInterval(() => {
      const roomKeys = Object.keys(rooms);
      if (roomKeys.length === 0) return;

      // Pilih 1 - 3 ruangan secara acak untuk diperbarui telemetrinya
      const count = Math.min(3, roomKeys.length);
      for (let i = 0; i < count; i++) {
        const randomSlot = roomKeys[Math.floor(Math.random() * roomKeys.length)];
        const current = rooms[randomSlot];

        // Simulasi keberadaan orang (60% kemungkinan ada orang di jam siang)
        const currentHour = new Date().getHours();
        const presence = Math.random() > 0.4;
        const emptyForMin = presence ? 0 : Math.floor(Math.random() * 30);
        const temp = Number((23.0 + Math.random() * 4.5).toFixed(1));
        const hum = Math.floor(55 + Math.random() * 15);

        // Hitung aksi AC berdasarkan 8 kasus otomasi PRD
        const autoResult = evaluateAutomation({
          presence,
          emptyForMin,
          temperature: temp,
          nowHour: currentHour,
        });

        const mockTelemetry: TelemetryPayload = {
          device_id: `esp32-${randomSlot}`,
          temp,
          hum,
          presence,
          ac_mode: autoResult.acMode,
          mode: current?.mode ?? "auto",
          rule: autoResult.rule,
          rssi: -55 - Math.floor(Math.random() * 20),
          fw: "1.0.0-demo",
        };

        updateTelemetry(randomSlot, mockTelemetry, true);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [enabled, rooms, updateTelemetry, setConnection]);
}
