import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useRoomStore } from "../stores/roomStore";

/**
 * Hook Sinkronisasi Backend API (/api/state) untuk menghubungkan Frontend
 * dengan database persisten, riwayat telemetri, status ACK command, dan sistem alert Backend.
 */
export function useBackendSync(enabled = true) {
  const { syncFromBackend, setBackendConnected } = useRoomStore(
    useShallow((s) => ({
      syncFromBackend: s.syncFromBackend,
      setBackendConnected: s.setBackendConnected,
    }))
  );

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const pullBackendState = async () => {
      try {
        const res = await fetch("/api/state");
        if (!res.ok) {
          if (!cancelled) setBackendConnected(false);
          return;
        }
        const data = await res.json();
        if (!cancelled && data?.ok) {
          syncFromBackend(data);
        }
      } catch {
        if (!cancelled) {
          setBackendConnected(false);
        }
      }
    };

    void pullBackendState();
    const timer = setInterval(pullBackendState, 3000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled, syncFromBackend, setBackendConnected]);
}

