import { create } from "zustand";
import {
  AckPayload,
  AcMode,
  CommandAction,
  CommandPayload,
  DeviceMode,
  TelemetryPayload,
} from "../domain/contract";

export interface TelemetryHistoryPoint {
  timestamp: string;
  temp: number;
  hum: number;
  presence: boolean;
  minutesEmpty: number;
  acMode: AcMode;
  targetTemp: number | null;
  rule: number;
  powerKw: number;
  isDemo: boolean;
}

export interface CommandRecord {
  id: string;
  slotId: string;
  action: CommandAction;
  targetTemp?: number;
  durationMin: number;
  status: "pending" | "sent" | "acked" | "failed";
  irAction: string;
  createdAt: string;
  ackedAt?: string;
}

export interface AlertRecord {
  id: string;
  slotId: string;
  roomName: string;
  type: "after_hours_occupied" | "anomaly" | "waste" | "offline";
  severity: "critical" | "warning" | "info";
  message: string;
  startedAt: string;
  resolvedAt?: string | null;
  acknowledged: boolean;
}

export interface SystemSettings {
  normalTemp: number;
  ecoTemp: number;
  idleDelayMin: number;
  autoOffDelayMin: number;
  hotTempWarningC: number;
  workHoursEnd: number;
  tariffPerKwh: number;
  brokerUrl: string;
  tcpBrokerUrl: string;
}

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

const DEFAULT_SETTINGS: SystemSettings = {
  normalTemp: 22,
  ecoTemp: 27,
  idleDelayMin: 15,
  autoOffDelayMin: 120,
  hotTempWarningC: 29.0,
  workHoursEnd: 18,
  tariffPerKwh: 1444.7,
  brokerUrl: "wss://broker.emqx.io:8084/mqtt",
  tcpBrokerUrl: "mqtt://broker.emqx.io:1883",
};

interface BackendStateResponse {
  ok: boolean;
  mqttConnected: boolean;
  virtualEsp32Enabled: boolean;
  settings: SystemSettings;
  rooms: Record<
    string,
    {
      slotId: string;
      roomName: string;
      deviceId: string;
      hasDevice: boolean;
      online: boolean;
      isDemo: boolean;
      presence: boolean | null;
      temperature: number | null;
      humidity: number | null;
      minutesEmpty: number;
      acMode: AcMode | null;
      targetTemp: number | null;
      irAction: string | null;
      dashboardStatus: string | null;
      mode: DeviceMode | null;
      rule: number | null;
      rssi: number | null;
      fw: string | null;
      lastSeen: string | null;
      presenceChangedAt: string | null;
      acChangedAt: string | null;
      overrideUntil: string | null;
    }
  >;
  history: Record<string, TelemetryHistoryPoint[]>;
  commands: CommandRecord[];
  alerts: AlertRecord[];
}

interface RoomStoreState {
  rooms: Record<string, LiveRoomData>;
  connection: ConnectionStatus;
  backendConnected: boolean;
  backendMqttConnected: boolean;
  virtualEsp32Enabled: boolean;
  dataSourceKind: "mqtt" | "mock" | "supabase";
  brokerUrl: string;
  settings: SystemSettings;
  history: Record<string, TelemetryHistoryPoint[]>;
  commands: CommandRecord[];
  alerts: AlertRecord[];
  lastCommandFeedback: { slotId: string; message: string; timestamp: number } | null;

  // Actions
  setConnection: (status: ConnectionStatus) => void;
  setBackendConnected: (connected: boolean) => void;
  setDataSourceKind: (kind: "mqtt" | "mock" | "supabase") => void;
  setBrokerUrl: (url: string) => void;
  updateTelemetry: (slotId: string, telemetry: TelemetryPayload, isDemo?: boolean) => void;
  handleCommandAck: (slotId: string, ack: AckPayload) => void;
  setDeviceOnline: (slotId: string, online: boolean) => void;
  initializeRooms: (slots: { slotId: string; hasDevice: boolean }[]) => void;
  syncFromBackend: (payload: BackendStateResponse) => void;
  sendCommand: (slotId: string, action: CommandAction, targetTemp?: number) => void;
  triggerScenario: (slotId: string, rule: number) => Promise<void>;
  toggleVirtualEsp32: (enabled?: boolean) => Promise<void>;
  saveSettings: (partial: Partial<SystemSettings>) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  clearResolvedAlerts: () => Promise<void>;
}

export const useRoomStore = create<RoomStoreState>((set, get) => ({
  rooms: {},
  connection: "connecting",
  backendConnected: false,
  backendMqttConnected: false,
  virtualEsp32Enabled: false,
  dataSourceKind: "mqtt",
  brokerUrl: DEFAULT_SETTINGS.brokerUrl,
  settings: DEFAULT_SETTINGS,
  history: { "6-U1": [] },
  commands: [],
  alerts: [],
  lastCommandFeedback: null,

  setConnection: (connection) => set({ connection }),
  setBackendConnected: (backendConnected) => set({ backendConnected }),
  setDataSourceKind: (dataSourceKind) => set({ dataSourceKind }),
  setBrokerUrl: (brokerUrl) =>
    set((state) => ({
      brokerUrl,
      settings: { ...state.settings, brokerUrl },
    })),

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

  syncFromBackend: (payload) =>
    set((state) => {
      const nextRooms = { ...state.rooms };
      for (const [slotId, r] of Object.entries(payload.rooms ?? {})) {
        const existing = nextRooms[slotId];
        nextRooms[slotId] = {
          slotId,
          hasDevice: r.hasDevice,
          online: r.online,
          presence: r.presence,
          temperature: r.temperature,
          humidity: r.humidity,
          minutesEmpty: r.minutesEmpty,
          acMode: r.acMode,
          targetTemp: r.targetTemp,
          irAction: r.irAction,
          dashboardStatus: r.dashboardStatus ?? existing?.dashboardStatus ?? null,
          mode: r.mode,
          rule: r.rule ?? undefined,
          rssi: r.rssi ?? undefined,
          fw: r.fw ?? undefined,
          lastSeen: r.lastSeen ? new Date(r.lastSeen) : existing?.lastSeen ?? null,
          presenceChangedAt: r.presenceChangedAt
            ? new Date(r.presenceChangedAt)
            : existing?.presenceChangedAt ?? null,
          acChangedAt: r.acChangedAt ? new Date(r.acChangedAt) : existing?.acChangedAt ?? null,
          overrideUntil: r.overrideUntil ? new Date(r.overrideUntil) : null,
          isDemo: r.isDemo,
        };
      }

      return {
        backendConnected: true,
        backendMqttConnected: payload.mqttConnected,
        virtualEsp32Enabled: payload.virtualEsp32Enabled,
        settings: payload.settings ?? state.settings,
        brokerUrl: payload.settings?.brokerUrl || state.brokerUrl,
        rooms: nextRooms,
        history: payload.history ?? state.history,
        commands: payload.commands ?? state.commands,
        alerts: payload.alerts ?? state.alerts,
      };
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
        humidity: tel.hum ?? 60,
        minutesEmpty: tel.minutes_empty ?? 0,
        acMode: tel.ac_mode,
        targetTemp:
          tel.target_temp ??
          (tel.ac_mode === "normal"
            ? state.settings.normalTemp
            : tel.ac_mode === "eco"
            ? state.settings.ecoTemp
            : null),
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

      const point: TelemetryHistoryPoint = {
        timestamp: now.toISOString(),
        temp: updated.temperature ?? 25,
        hum: updated.humidity ?? 60,
        presence: Boolean(updated.presence),
        minutesEmpty: updated.minutesEmpty,
        acMode: updated.acMode ?? "normal",
        targetTemp: updated.targetTemp,
        rule: updated.rule ?? 1,
        powerKw:
          updated.acMode === "normal" ? 1.2 : updated.acMode === "eco" ? 0.72 : 0,
        isDemo,
      };

      const prevHistory = state.history[slotId] ?? [];
      const lastPoint = prevHistory[prevHistory.length - 1];
      const shouldAppend =
        !lastPoint ||
        now.getTime() - new Date(lastPoint.timestamp).getTime() >= 1500 ||
        lastPoint.acMode !== point.acMode ||
        lastPoint.rule !== point.rule;

      const nextHistoryList = shouldAppend
        ? [...prevHistory.slice(-59), point]
        : prevHistory;

      return {
        rooms: {
          ...state.rooms,
          [slotId]: updated,
        },
        history: {
          ...state.history,
          [slotId]: nextHistoryList,
        },
      };
    }),

  handleCommandAck: (slotId, ack) =>
    set((state) => {
      const nowIso = new Date().toISOString();
      const nextCommands = state.commands.map((cmd) => {
        if (cmd.id === ack.cmd_id || (cmd.slotId === slotId && cmd.status === "sent")) {
          return {
            ...cmd,
            status: (ack.ok ? "acked" : "failed") as CommandRecord["status"],
            ackedAt: nowIso,
            irAction: ack.ir_action ?? cmd.irAction,
          };
        }
        return cmd;
      });

      return {
        commands: nextCommands,
        lastCommandFeedback: {
          slotId,
          message: `ACK diterima dari ESP32 (${ack.ir_action ?? ack.ac_mode.toUpperCase()})`,
          timestamp: Date.now(),
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

  sendCommand: (slotId, action, targetTemp) => {
    const state = get();
    const existing = state.rooms[slotId];
    if (!existing || !existing.hasDevice) return;

    const cmdId = `cmd-${Date.now()}`;
    const cmdPayload: CommandPayload = {
      cmd_id: cmdId,
      action,
      target_temp: targetTemp,
      duration_min: 60,
    };

    // 1. Kirim ke broker MQTT langsung dari browser jika terhubung
    if (activePublisher) {
      activePublisher(slotId, cmdPayload);
    }

    // 2. Kirim ke Backend API untuk disimpan di riwayat command & dipublikasikan ulang oleh jembatan MQTT Backend
    void fetch(`/api/rooms/${encodeURIComponent(slotId)}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        targetTemp,
        durationMin: 60,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.command) {
          set((curr) => ({
            commands: [
              data.command,
              ...curr.commands.filter((c) => c.id !== data.command.id && c.id !== cmdId),
            ].slice(0, 50),
          }));
        }
      })
      .catch(() => {
        // Fallback jika sedang mode static/offline
      });

    // 3. Optimistic state update di UI agar langsung responsif
    const now = new Date();
    let nextAcMode: AcMode | null = existing.acMode;
    let nextMode: DeviceMode = "override";
    let nextTargetTemp = existing.targetTemp ?? state.settings.normalTemp;
    let nextIrAction = existing.irAction ?? "Tidak ada aksi";
    let nextStatus = existing.dashboardStatus ?? "Override dari Web App";
    let feedbackMsg = "";

    if (action === "ac_normal") {
      nextAcMode = "normal";
      nextTargetTemp = state.settings.normalTemp;
      nextIrAction = `Set AC ${nextTargetTemp}C`;
      nextStatus = `Override Web - AC Normal (${nextTargetTemp}°C)`;
      feedbackMsg = `Sinyal IR dikirim: Set AC ${nextTargetTemp}°C (Normal)`;
    } else if (action === "ac_eco") {
      nextAcMode = "eco";
      nextTargetTemp = state.settings.ecoTemp;
      nextIrAction = `Set AC ${nextTargetTemp}C`;
      nextStatus = `Override Web - AC Eco Mode (${nextTargetTemp}°C)`;
      feedbackMsg = `Sinyal IR dikirim: Set AC ${nextTargetTemp}°C (Eco Mode)`;
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
      nextIrAction = "Release ke Otomatis";
      feedbackMsg = "Mode dikembalikan ke Otomatis (Sensor ESP32)";
    }

    const optimisticCmd: CommandRecord = {
      id: cmdId,
      slotId,
      action,
      targetTemp,
      durationMin: 60,
      status: "sent",
      irAction: nextIrAction,
      createdAt: now.toISOString(),
    };

    set((curr) => ({
      commands: [optimisticCmd, ...curr.commands].slice(0, 50),
      lastCommandFeedback: {
        slotId,
        message: feedbackMsg,
        timestamp: Date.now(),
      },
      rooms: {
        ...curr.rooms,
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
    }));
  },

  triggerScenario: async (slotId, rule) => {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(slotId)}/scenario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ok) {
        const stateRes = await fetch("/api/state");
        if (stateRes.ok) {
          const fullState = (await stateRes.json()) as BackendStateResponse;
          get().syncFromBackend(fullState);
        }
        set({
          lastCommandFeedback: {
            slotId,
            message: `Skenario Kasus #${rule} dieksekusi ke R.601`,
            timestamp: Date.now(),
          },
        });
      }
    } catch {
      // ignore
    }
  },

  toggleVirtualEsp32: async (enabled) => {
    try {
      const res = await fetch("/api/simulator/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ok) {
        set({ virtualEsp32Enabled: Boolean(data.virtualEsp32Enabled) });
        const stateRes = await fetch("/api/state");
        if (stateRes.ok) {
          const fullState = (await stateRes.json()) as BackendStateResponse;
          get().syncFromBackend(fullState);
        }
      }
    } catch {
      // ignore
    }
  },

  saveSettings: async (partial) => {
    set((state) => ({
      settings: { ...state.settings, ...partial },
      brokerUrl: partial.brokerUrl ?? state.brokerUrl,
    }));
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.settings) {
          set({
            settings: data.settings,
            brokerUrl: data.settings.brokerUrl,
          });
        }
      }
    } catch {
      // ignore
    }
  },

  acknowledgeAlert: async (alertId) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      ),
    }));
    try {
      const res = await fetch(`/api/alerts/${encodeURIComponent(alertId)}/ack`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.alerts) {
          set({ alerts: data.alerts });
        }
      }
    } catch {
      // ignore
    }
  },

  clearResolvedAlerts: async () => {
    set((state) => ({
      alerts: state.alerts.filter((a) => !a.resolvedAt && !a.acknowledged),
    }));
    try {
      const res = await fetch("/api/alerts/clear", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data?.alerts) {
          set({ alerts: data.alerts });
        }
      }
    } catch {
      // ignore
    }
  },
}));
