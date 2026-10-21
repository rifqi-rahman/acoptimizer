import React, { useMemo } from "react";
import { generateEntireBuilding } from "./building/generator";
import { useMockSimulation } from "./data/MockSimulation";
import { CompassHUD } from "./features/hud/CompassHUD";
import { FloorRail } from "./features/hud/FloorRail";
import { LayerSwitcher } from "./features/hud/LayerSwitcher";
import { SidePanel } from "./features/hud/SidePanel";
import { TopBar } from "./features/hud/TopBar";
import { FloorPlan2D } from "./features/plan2d/FloorPlan2D";
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
    <div className="relative w-screen h-screen overflow-hidden bg-[#F1F3F6] select-none flex flex-col p-4 pt-3 gap-3">
      {/* TopBar Header Bar */}
      <header className="h-11 w-full flex items-center justify-between flex-shrink-0">
        <TopBar />
      </header>

      {/* Main Workspace: 3/4 Left Visual Container + 1/4 Right Side Panel */}
      <div className="flex-1 w-full flex gap-3 min-h-0 overflow-hidden">
        {/* Visual Container: 3/4 Width (75%) Align Kiri */}
        <section className="w-3/4 h-full relative rounded-3xl bg-white shadow-xl border border-slate-200/90 overflow-hidden flex flex-col">
          {/* Visual Canvas (2D / 3D) */}
          <div className="w-full h-full relative overflow-hidden">
            {is2D || mode === "floor" ? (
              <FloorPlan2D floor={currentFloor} />
            ) : (
              <TwinCanvas floors={floors} />
            )}
          </div>

          {/* Persistent Floating HUDs inside the Visual Panel */}
          <FloorRail />
          <CompassHUD />
          <LayerSwitcher />
        </section>

        {/* Right Aside Panel: 1/4 Width (25%) */}
        <aside className="w-1/4 h-full relative rounded-3xl bg-white shadow-xl border border-slate-200/90 overflow-hidden flex flex-col">
          <SidePanel room={selectedRoom} currentFloor={currentFloor} />
        </aside>
      </div>
    </div>
  );
}

export default App;
