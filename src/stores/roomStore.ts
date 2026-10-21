import { create } from "zustand";
import { AcMode, DeviceMode, TelemetryPayload } from "../domain/contract";

export interface LiveRoomData {
  slotId: string;
  hasDevice: boolean;
  online: boolean;
  presence: boolean | null;
  temperature: number | null;
  humidity: number | null;
  acMode: AcMode | null;
  mode: DeviceMode | null;
  rule?: number;
  lastSeen: Date | null;
  presenceChangedAt: Date | null;
  acChangedAt: Date | null;
  overrideUntil: Date | null;
  isDemo?: boolean;
}

export type ConnectionStatus = "connecting" | "live" | "reconnecting" | "offline";

interface RoomStoreState {
  rooms: Record<string, LiveRoomData>;
  connection: ConnectionStatus;
  dataSourceKind: "mock" | "mqtt" | "supabase";
  
  // Actions
  setConnection: (status: ConnectionStatus) => void;
  setDataSourceKind: (kind: "mock" | "mqtt" | "supabase") => void;
  updateTelemetry: (slotId: string, telemetry: TelemetryPayload, isDemo?: boolean) => void;
  setDeviceOnline: (slotId: string, online: boolean) => void;
  initializeRooms: (slots: { slotId: string; hasDevice: boolean }[]) => void;
}

export const useRoomStore = create<RoomStoreState>((set) => ({
  rooms: {},
  connection: "connecting",
  dataSourceKind: "mock",

  setConnection: (connection) => set({ connection }),
  setDataSourceKind: (dataSourceKind) => set({ dataSourceKind }),

  initializeRooms: (slots) =>
    set((state) => {
      const nextRooms = { ...state.rooms };
      for (const slot of slots) {
        if (!nextRooms[slot.slotId]) {
          nextRooms[slot.slotId] = {
            slotId: slot.slotId,
            hasDevice: slot.hasDevice,
            online: slot.hasDevice,
            presence: null,
            temperature: null,
            humidity: null,
            acMode: null,
            mode: "auto",
            lastSeen: null,
            presenceChangedAt: null,
            acChangedAt: null,
            overrideUntil: null,
          };
        }
      }
      return { rooms: nextRooms };
    }),

  updateTelemetry: (slotId, tel, isDemo = false) =>
    set((state) => {
      const existing = state.rooms[slotId];
      const now = new Date();

      const presenceChanged = existing ? existing.presence !== tel.presence : true;
      const acChanged = existing ? existing.acMode !== tel.ac_mode : true;

      const updated: LiveRoomData = {
        slotId,
        hasDevice: true,
        online: true,
        presence: tel.presence,
        temperature: tel.temp,
        humidity: tel.hum,
        acMode: tel.ac_mode,
        mode: tel.mode,
        rule: tel.rule,
        lastSeen: now,
        presenceChangedAt: presenceChanged ? now : existing?.presenceChangedAt ?? now,
        acChangedAt: acChanged ? now : existing?.acChangedAt ?? now,
        overrideUntil: tel.override_until ? new Date(tel.override_until) : null,
        isDemo,
      };

      return {
        rooms: {
          ...state.rooms,
          [slotId]: updated,
        },
      };
    }),

  setDeviceOnline: (slotId, online) =>
    set((state) => {
      const existing = state.rooms[slotId];
      if (!existing) return state;
      return {
        rooms: {
          ...state.rooms,
          [slotId]: {
            ...existing,
            online,
            lastSeen: online ? new Date() : existing.lastSeen,
          },
        },
      };
    }),
}));
