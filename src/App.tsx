import React, { useMemo } from "react";
import { generateEntireBuilding } from "./building/generator";
import { useMockSimulation } from "./data/MockSimulation";
import { CompassHUD } from "./features/hud/CompassHUD";
import { FloorRail } from "./features/hud/FloorRail";
import { PanelTopControls } from "./features/hud/PanelTopControls";
import { SidePanel } from "./features/hud/SidePanel";
import { AccountModal } from "./features/modals/AccountModal";
import { AutomationsModal } from "./features/modals/AutomationsModal";
import { SettingsModal } from "./features/modals/SettingsModal";
import { FloorPlan2D } from "./features/plan2d/FloorPlan2D";
import { AppSidebar } from "./features/sidebar/AppSidebar";
import { TwinCanvas } from "./features/twin3d/TwinCanvas";
import { useRoomStore } from "./stores/roomStore";
import { useViewStore } from "./stores/viewStore";

export function App() {
  const { mode, selectedFloor, selectedSlotId, is2D } = useViewStore();
  const { initializeRooms } = useRoomStore();

  // Buat model spasial 7 lantai Gedung FST (Atrium)
  const floors = useMemo(() => generateEntireBuilding(), []);

  // Inisialisasi daftar ruangan ke store
  React.useEffect(() => {
    const allSlots = floors.flatMap((f) =>
      f.rooms.map((r) => ({
        slotId: r.slotId,
        hasDevice: r.hasDevice,
      }))
    );
    initializeRooms(allSlots);
  }, [floors, initializeRooms]);

  // Aktifkan simulator telemetri client
  useMockSimulation(true);

  // Ambil data lantai & ruangan terpilih
  const currentFloor = useMemo(
    () => floors.find((f) => f.level === selectedFloor) ?? floors[5],
    [floors, selectedFloor]
  );

  const selectedRoom = useMemo(() => {
    if (!selectedSlotId) return null;
    for (const f of floors) {
      const found = f.rooms.find((r) => r.slotId === selectedSlotId);
      if (found) return found;
    }
    return null;
  }, [floors, selectedSlotId]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F1F3F6] select-none flex p-3 gap-3">
      {/* 1. Sidebar Navigasi Utama (Hanya memanjang saat di-hover) */}
      <AppSidebar />

      {/* 2. Workspace Utama: Panel Visual 3/4 (Kiri) + Panel Detail 1/4 (Kanan) */}
      <main className="flex-1 w-full h-full flex gap-3 min-w-0 overflow-hidden relative z-10">
        {/* Visual Container: 3/4 Width (75%) Align Kiri */}
        <section className="w-3/4 h-full relative rounded-3xl bg-white shadow-xl border border-slate-200/90 overflow-hidden flex flex-col isolate">
          {/* Visual Canvas (2D / 3D) - Terisolasi di layer z-0 agar elemen 3D Html tidak pernah menembus HUD/Sidebar */}
          <div className="w-full h-full relative z-0 isolate overflow-hidden">
            {is2D ? (
              <FloorPlan2D floor={currentFloor} />
            ) : (
              <TwinCanvas floors={floors} />
            )}
          </div>

          {/* Kontrol HUD Lengkap di Dalam Panel Visual (Layer Teratas z-30) */}
          <PanelTopControls />
          <CompassHUD />
          <FloorRail />
        </section>

        {/* Right Aside Panel: 1/4 Width (25%) */}
        <aside className="w-1/4 h-full relative z-30 rounded-3xl bg-white shadow-xl border border-slate-200/90 overflow-hidden flex flex-col">
          <SidePanel room={selectedRoom} currentFloor={currentFloor} floors={floors} />
        </aside>
      </main>

      {/* 3. Dialog Modals */}
      <SettingsModal />
      <AccountModal />
      <AutomationsModal />
    </div>
  );
}

export default App;
