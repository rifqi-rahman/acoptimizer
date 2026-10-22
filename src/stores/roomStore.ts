import { create } from "zustand";
import { AcMode, CommandAction, CommandPayload, DeviceMode, TelemetryPayload } from "../domain/contract";

export interface LiveRoomData {
  slotId: string;
  hasDevice: boolean;
  online: boolean;
  presence: boolean | null;
  temperature: number | null;
  humidity: number | null;
  minutesEmpty: number;
  acMode: AcMode | null;
  targetTemp: number | null;
  irAction: string | null;
  dashboardStatus: string | null;
  mode: DeviceMode | null;
  rule?: number;
  rssi?: number;
  fw?: string;
  lastSeen: Date | null;
  presenceChangedAt: Date | null;
  acChangedAt: Date | null;
  overrideUntil: Date | null;
  isDemo?: boolean;
}

export type ConnectionStatus = "connecting" | "live" | "reconnecting" | "offline";

type CommandPublisher = (slotId: string, payload: CommandPayload) => void;
let activePublisher: CommandPublisher | null = null;

export function registerMqttCommandPublisher(pub: CommandPublisher | null) {
  activePublisher = pub;
}

interface RoomStoreState {
  rooms: Record<string, LiveRoomData>;
  connection: ConnectionStatus;
  dataSourceKind: "mqtt" | "mock" | "supabase";
  brokerUrl: string;
  lastCommandFeedback: { slotId: string; message: string; timestamp: number } | null;

  // Actions
  setConnection: (status: ConnectionStatus) => void;
  setDataSourceKind: (kind: "mqtt" | "mock" | "supabase") => void;
  setBrokerUrl: (url: string) => void;
  updateTelemetry: (slotId: string, telemetry: TelemetryPayload, isDemo?: boolean) => void;
  setDeviceOnline: (slotId: string, online: boolean) => void;
  initializeRooms: (slots: { slotId: string; hasDevice: boolean }[]) => void;
  sendCommand: (slotId: string, action: CommandAction, targetTemp?: number) => void;
}

export const useRoomStore = create<RoomStoreState>((set) => ({
  rooms: {},
  connection: "connecting",
  dataSourceKind: "mqtt",
  brokerUrl: "wss://broker.emqx.io:8084/mqtt",
  lastCommandFeedback: null,

  setConnection: (connection) => set({ connection }),
  setDataSourceKind: (dataSourceKind) => set({ dataSourceKind }),
  setBrokerUrl: (brokerUrl) => set({ brokerUrl }),

  initializeRooms: (slots) =>
    set((state) => {
      const nextRooms = { ...state.rooms };
      for (const slot of slots) {
        if (!nextRooms[slot.slotId]) {
          // Hanya ruangan yang ditandai hasDevice (saat ini R.601 / 6-U1) yang berstatus memiliki perangkat IoT
          nextRooms[slot.slotId] = {
            slotId: slot.slotId,
            hasDevice: slot.hasDevice,
            online: false, // Akan menjadi true saat paket telemetri riil masuk dari ESP32
            presence: null,
            temperature: null,
            humidity: null,
            minutesEmpty: 0,
            acMode: null,
            targetTemp: null,
            irAction: null,
            dashboardStatus: slot.hasDevice ? "Menunggu Koneksi Alat IoT..." : null,
            mode: slot.hasDevice ? "auto" : null,
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
        hasDevice: true, // Jika ada telemetri masuk untuk slot ini, berarti alat IoT aktif di ruangan ini
        online: true,
        presence: tel.presence,
        temperature: tel.temp,
        humidity: tel.hum ?? 60,
        minutesEmpty: tel.minutes_empty ?? 0,
        acMode: tel.ac_mode,
        targetTemp:
          tel.target_temp ??
          (tel.ac_mode === "normal" ? 22 : tel.ac_mode === "eco" ? 27 : null),
        irAction: tel.ir_action ?? null,
        dashboardStatus: tel.dashboard_status ?? null,
        mode: tel.mode,
        rule: tel.rule,
        rssi: tel.rssi,
        fw: tel.fw,
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

  sendCommand: (slotId, action, targetTemp) =>
    set((state) => {
      const existing = state.rooms[slotId];
      if (!existing || !existing.hasDevice) return state;

      const cmdPayload: CommandPayload = {
        cmd_id: `cmd-${Date.now()}`,
        action,
        target_temp: targetTemp,
        duration_min: 60,
      };

      // Kirim ke broker MQTT jika terhubung
      if (activePublisher) {
        activePublisher(slotId, cmdPayload);
      }

      // Optimistic state update di UI agar langsung responsif
      const now = new Date();
      let nextAcMode: AcMode | null = existing.acMode;
      let nextMode: DeviceMode = "override";
      let nextTargetTemp = existing.targetTemp ?? 22;
      let nextIrAction = existing.irAction ?? "Tidak ada aksi";
      let nextStatus = existing.dashboardStatus ?? "Override dari Web App";
      let feedbackMsg = "";

      if (action === "ac_normal") {
        nextAcMode = "normal";
        nextTargetTemp = 22;
        nextIrAction = "Set AC 22C";
        nextStatus = "Override Web - AC Normal (22°C)";
        feedbackMsg = "Sinyal IR dikirim: Set AC 22°C (Normal)";
      } else if (action === "ac_eco") {
        nextAcMode = "eco";
        nextTargetTemp = 27;
        nextIrAction = "Set AC 27C";
        nextStatus = "Override Web - AC Eco Mode (27°C)";
        feedbackMsg = "Sinyal IR dikirim: Set AC 27°C (Eco Mode)";
      } else if (action === "ac_off") {
        nextAcMode = "off";
        nextIrAction = "Power OFF";
        nextStatus = "Override Web - AC Dimatikan";
        feedbackMsg = "Sinyal IR dikirim: Power OFF (Matikan AC)";
      } else if (action === "set_temp" && targetTemp !== undefined) {
        nextAcMode = targetTemp >= 26 ? "eco" : "normal";
        nextTargetTemp = targetTemp;
        nextIrAction = `Set AC ${targetTemp}C`;
        nextStatus = `Override Web - Set AC ${targetTemp}°C`;
        feedbackMsg = `Sinyal IR dikirim: Ubah Suhu AC ke ${targetTemp}°C`;
      } else if (action === "release") {
        nextMode = "auto";
        nextStatus = "Otomatis (Sensor ESP32)";
        feedbackMsg = "Mode dikembalikan ke Otomatis (Sensor ESP32)";
      }

      return {
        lastCommandFeedback: {
          slotId,
          message: feedbackMsg,
          timestamp: Date.now(),
        },
        rooms: {
          ...state.rooms,
          [slotId]: {
            ...existing,
            acMode: nextAcMode,
            mode: nextMode,
            targetTemp: nextTargetTemp,
            irAction: nextIrAction,
            dashboardStatus: nextStatus,
            acChangedAt: now,
          },
        },
      };
    }),
}));
