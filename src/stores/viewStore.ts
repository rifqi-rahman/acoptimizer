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
  cameraAzimuth: number; // Sudut putar kamera dalam radian (untuk kompas 3D)
  isSidebarOpen: boolean;
  activeModal: "settings" | "account" | "automations" | null;

  // Actions
  setMode: (mode: ViewMode) => void;
  setCameraAzimuth: (azimuth: number) => void;
  selectFloor: (floor: number) => void;
  selectRoom: (slotId: string | null) => void;
  setLayer: (layer: VisualizationLayer) => void;
  toggle2D: () => void;
  setKiosk: (kiosk: boolean) => void;
  resetToBuilding: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modal: "settings" | "account" | "automations" | null) => void;
}

export const useViewStore = create<ViewStoreState>((set) => ({
  mode: "building",
  selectedFloor: 6, // Default fokus ke Lantai 6 (lokasi ruang uji coba 601)
  selectedSlotId: "6-U1",
  layer: "status",
  is2D: false,
  isKiosk: false,
  cameraAzimuth: 0,
  isSidebarOpen: false,
  activeModal: null,

  setMode: (mode) => set({ mode }),
  setCameraAzimuth: (cameraAzimuth) => set({ cameraAzimuth }),
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
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  openModal: (activeModal) => set({ activeModal }),
}));
