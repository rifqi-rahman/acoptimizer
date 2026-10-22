import { create } from "zustand";

export type ViewMode = "building" | "floor" | "room";
export type VisualizationLayer = "status" | "temperature" | "presence" | "energy";

export interface ObjectVisibilityFilters {
  cars: boolean;
  trees: boolean;
  furniture: boolean;
  stairs: boolean;
  lifts: boolean;
  roomLabels: boolean;
  roofAndFacade: boolean;
}

interface ViewStoreState {
  mode: ViewMode;
  selectedFloor: number; // 1 - 7
  selectedSlotId: string | null;
  layer: VisualizationLayer;
  isGrayscale: boolean; // Toggle Warna / Grayscale untuk seluruh visual
  objectFilters: ObjectVisibilityFilters;
  isKiosk: boolean;
  cameraAzimuth: number; // Sudut putar kamera dalam radian (untuk kompas 3D)
  isSidebarExpanded: boolean;
  hoveredFloor: number | null;
  hoveredSlotId: string | null;
  resetCameraTrigger: number;
  activeModal: "settings" | "account" | "automations" | null;

  // Actions
  setMode: (mode: ViewMode) => void;
  setCameraAzimuth: (azimuth: number) => void;
  selectFloor: (floor: number) => void;
  selectRoom: (slotId: string | null) => void;
  setLayer: (layer: VisualizationLayer) => void;
  toggleGrayscale: () => void;
  setGrayscale: (grayscale: boolean) => void;
  toggleObjectFilter: (key: keyof ObjectVisibilityFilters) => void;
  resetObjectFilters: () => void;
  setHoveredFloor: (floor: number | null) => void;
  setHoveredSlotId: (slotId: string | null) => void;
  triggerResetCamera: () => void;
  setKiosk: (kiosk: boolean) => void;
  resetToBuilding: () => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  openModal: (modal: "settings" | "account" | "automations" | null) => void;
}

const DEFAULT_FILTERS: ObjectVisibilityFilters = {
  cars: true,
  trees: true,
  furniture: true,
  stairs: true,
  lifts: true,
  roomLabels: true,
  roofAndFacade: true,
};

export const useViewStore = create<ViewStoreState>((set) => ({
  mode: "building",
  selectedFloor: 6, // Default fokus ke Lantai 6 (lokasi ruang uji coba 601)
  selectedSlotId: null, // Awal dibuka menampilkan tinjauan keseluruhan Gedung FST
  layer: "status",
  isGrayscale: false,
  objectFilters: { ...DEFAULT_FILTERS },
  isKiosk: false,
  cameraAzimuth: 0,
  isSidebarExpanded: false,
  hoveredFloor: null,
  hoveredSlotId: null,
  resetCameraTrigger: 0,
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
  toggleGrayscale: () => set((state) => ({ isGrayscale: !state.isGrayscale })),
  setGrayscale: (isGrayscale) => set({ isGrayscale }),
  toggleObjectFilter: (key) =>
    set((state) => ({
      objectFilters: {
        ...state.objectFilters,
        [key]: !state.objectFilters[key],
      },
    })),
  resetObjectFilters: () => set({ objectFilters: { ...DEFAULT_FILTERS } }),
  setHoveredFloor: (hoveredFloor) => set({ hoveredFloor }),
  setHoveredSlotId: (hoveredSlotId) => set({ hoveredSlotId }),
  triggerResetCamera: () => set((state) => ({ resetCameraTrigger: state.resetCameraTrigger + 1 })),
  setKiosk: (isKiosk) => set({ isKiosk }),
  resetToBuilding: () =>
    set({
      mode: "building",
      selectedSlotId: null,
    }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded })),
  setSidebarExpanded: (isSidebarExpanded) => set({ isSidebarExpanded }),
  openModal: (activeModal) => set({ activeModal }),
}));
