import React, { useMemo } from "react";
import { generateEntireBuilding } from "./building/generator";
import { useMockSimulation } from "./data/MockSimulation";
import { CompassHUD } from "./features/hud/CompassHUD";
import { FloorRail } from "./features/hud/FloorRail";
import { LayerSwitcher } from "./features/hud/LayerSwitcher";
import { TopBar } from "./features/hud/TopBar";
import { FloorPlan2D } from "./features/plan2d/FloorPlan2D";
import { RoomSheet } from "./features/room/RoomSheet";
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
    <div className="relative w-screen h-screen overflow-hidden bg-[#F4F5F7] select-none">
      {/* TopBar HUD */}
      <TopBar />

      {/* Main View: 2D Floor Plan atau 3D Digital Twin */}
      <main className="w-full h-full relative">
        {is2D || mode === "floor" ? (
          <FloorPlan2D floor={currentFloor} />
        ) : (
          <TwinCanvas floors={floors} />
        )}
      </main>

      {/* Navigation Rails, Compass & Layer Controls */}
      <CompassHUD />
      <FloorRail />
      <LayerSwitcher />

      {/* Detail Room Sheet Drawer */}
      <RoomSheet room={selectedRoom} />
    </div>
  );
}

export default App;
