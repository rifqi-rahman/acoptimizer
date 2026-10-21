import { create } from "zustand";

export type ViewMode = "building" | "floor" | "room";
export type VisualizationLayer = "status" | "temperature" | "presence" | "energy";

interface ViewStoreState {
  mode: ViewMode;
  selectedFloor: number; // 1 - 7
  selectedSlotId: string | null;
  layer: VisualizationLayer;
  is2D: boolean;
  isKiosk: boolean;

  // Actions
  setMode: (mode: ViewMode) => void;
  selectFloor: (floor: number) => void;
  selectRoom: (slotId: string | null) => void;
  setLayer: (layer: VisualizationLayer) => void;
  toggle2D: () => void;
  setKiosk: (kiosk: boolean) => void;
  resetToBuilding: () => void;
}

export const useViewStore = create<ViewStoreState>((set) => ({
  mode: "building",
  selectedFloor: 6, // Default fokus ke Lantai 6 (lokasi ruang uji coba 601)
  selectedSlotId: "6-U1",
  layer: "status",
  is2D: false,
  isKiosk: false,

  setMode: (mode) => set({ mode }),
  selectFloor: (floor) =>
    set({
      selectedFloor: floor,
      mode: "floor",
    }),
  selectRoom: (slotId) =>
    set({
      selectedSlotId: slotId,
      mode: slotId ? "room" : "floor",
    }),
  setLayer: (layer) => set({ layer }),
  toggle2D: () => set((state) => ({ is2D: !state.is2D })),
  setKiosk: (isKiosk) => set({ isKiosk }),
  resetToBuilding: () =>
    set({
      mode: "building",
      selectedSlotId: null,
    }),
}));
