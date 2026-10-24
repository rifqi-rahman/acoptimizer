import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import mqtt, { type MqttClient } from "mqtt";

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

export interface TelemetryHistoryPoint {
  timestamp: string;
  temp: number;
  hum: number;
  presence: boolean;
  minutesEmpty: number;
  acMode: "normal" | "eco" | "off";
  targetTemp: number | null;
  rule: number;
  powerKw: number;
  isDemo: boolean;
}

export interface CommandRecord {
  id: string;
  slotId: string;
  action: "ac_normal" | "ac_eco" | "ac_off" | "set_temp" | "release";
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

export interface BackendRoomState {
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
  acMode: "normal" | "eco" | "off" | null;
  targetTemp: number | null;
  irAction: string | null;
  dashboardStatus: string | null;
  mode: "auto" | "override" | "monitor" | null;
  rule: number | null;
  rssi: number | null;
  fw: string | null;
  lastSeen: string | null;
  presenceChangedAt: string | null;
  acChangedAt: string | null;
  overrideUntil: string | null;
}

interface PersistentDb {
  settings: SystemSettings;
  rooms: Record<string, BackendRoomState>;
  history: Record<string, TelemetryHistoryPoint[]>;
  commands: CommandRecord[];
  alerts: AlertRecord[];
  virtualEsp32Enabled: boolean;
}

const TOPIC_PREFIX = "acoptimizer/fst-uin/v1";
const DB_DIR = path.resolve(process.cwd(), "backend/data");
const DB_FILE = path.join(DB_DIR, "acoptimizer-db.json");
const ENV_FILE = path.resolve(process.cwd(), ".env");

interface SupabaseConfig {
  url: string;
  key: string;
  projectId: string;
}

function loadSupabaseConfig(): SupabaseConfig | null {
  try {
    let envText = "";
    if (fs.existsSync(ENV_FILE)) {
      envText = fs.readFileSync(ENV_FILE, "utf-8");
    }
    const getVar = (name: string): string => {
      if (process.env[name]) return String(process.env[name]).trim();
      const m = envText.match(new RegExp(`^${name}=(.+)$`, "m"));
      return m ? m[1].trim() : "";
    };

    const url = getVar("SUPABASE_URL") || getVar("VITE_SUPABASE_URL");
    const key =
      getVar("SUPABASE_SERVICE_ROLE_KEY") ||
      getVar("SUPABASE_ANON_KEY") ||
      getVar("VITE_SUPABASE_ANON_KEY");
    const projectId = getVar("SUPABASE_PROJECT_ID") || "gibdtlmbazmdyzerthfx";

    if (url && key) {
      return { url: url.replace(/\/$/, ""), key, projectId };
    }
  } catch {
    // ignore
  }
  return null;
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

const INITIAL_PILOT_ROOM: BackendRoomState = {
  slotId: "6-U1",
  roomName: "R.601",
  deviceId: "esp32-r601",
  hasDevice: true,
  online: false,
  isDemo: false,
  presence: null,
  temperature: null,
  humidity: null,
  minutesEmpty: 0,
  acMode: null,
  targetTemp: 22,
  irAction: "Tidak ada aksi",
  dashboardStatus: "Menunggu Koneksi Alat IoT ESP32...",
  mode: "auto",
  rule: 1,
  rssi: null,
  fw: "2.0.0-cool",
  lastSeen: null,
  presenceChangedAt: null,
  acChangedAt: null,
  overrideUntil: null,
};

function calcPowerKw(acMode: "normal" | "eco" | "off" | null): number {
  if (!acMode || acMode === "off") return 0;
  if (acMode === "eco") return 0.72; // 60% dari 1.2kW
  return 1.2;
}

export class AcoptimizerBackendService {
  private db: PersistentDb;
  private supabase: SupabaseConfig | null = null;
  private supabaseConnected = false;
  private mqttClient: MqttClient | null = null;
  private mqttConnected = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private simInterval: ReturnType<typeof setInterval> | null = null;
  private lastPhysicalEsp32SeenAt = 0;

  constructor() {
    this.db = this.loadDatabase();
    this.supabase = loadSupabaseConfig();
    if (this.supabase) {
      void this.hydrateFromSupabase();
    }
    this.connectMqttBridge();
    this.startVirtualEsp32Loop();
  }

  private async supabaseRequest(
    endpoint: string,
    options: {
      method?: string;
      body?: unknown;
      prefer?: string;
    } = {}
  ): Promise<unknown> {
    if (!this.supabase) return null;
    try {
      const headers: Record<string, string> = {
        apikey: this.supabase.key,
        Authorization: `Bearer ${this.supabase.key}`,
        "Content-Type": "application/json",
      };
      if (options.prefer) {
        headers["Prefer"] = options.prefer;
      }
      const res = await fetch(`${this.supabase.url}/rest/v1/${endpoint}`, {
        method: options.method ?? "GET",
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });
      if (res.ok) {
        this.supabaseConnected = true;
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      }
    } catch {
      // Abaikan jika sedang offline
    }
    return null;
  }

  private async hydrateFromSupabase() {
    if (!this.supabase) return;
    try {
      const [roomStateRows, logRows, cmdRows, alertRows, settingRows] = await Promise.all([
        this.supabaseRequest("room_state?select=*"),
        this.supabaseRequest("sensor_logs?select=*&order=recorded_at.desc&limit=60"),
        this.supabaseRequest("commands?select=*&order=created_at.desc&limit=50"),
        this.supabaseRequest("alerts?select=*&order=started_at.desc&limit=50"),
        this.supabaseRequest("settings?select=*"),
      ]);

      if (Array.isArray(settingRows)) {
        const sysRow = settingRows.find(
          (r: Record<string, unknown>) => r.key === "system_settings"
        ) as Record<string, unknown> | undefined;
        if (sysRow?.value && typeof sysRow.value === "object") {
          this.db.settings = {
            ...this.db.settings,
            ...(sysRow.value as Partial<SystemSettings>),
          };
        }
      }

      if (Array.isArray(roomStateRows)) {
        for (const r of roomStateRows as Record<string, unknown>[]) {
          const slotId = String(r.slot_id ?? "6-U1");
          this.db.rooms[slotId] = {
            slotId,
            roomName: slotId === "6-U1" ? "R.601" : slotId,
            deviceId: `esp32-${slotId.toLowerCase()}`,
            hasDevice: true,
            online: Boolean(r.online),
            isDemo: Boolean(r.is_demo),
            presence: r.presence === null || r.presence === undefined ? null : Boolean(r.presence),
            temperature: r.temperature !== null && r.temperature !== undefined ? Number(r.temperature) : null,
            humidity: r.humidity !== null && r.humidity !== undefined ? Number(r.humidity) : null,
            minutesEmpty: Number(r.minutes_empty ?? 0),
            acMode: (r.ac_mode as "normal" | "eco" | "off" | null) ?? null,
            targetTemp: r.target_temp !== null && r.target_temp !== undefined ? Number(r.target_temp) : null,
            irAction: r.ir_action ? String(r.ir_action) : null,
            dashboardStatus: r.dashboard_status ? String(r.dashboard_status) : null,
            mode: (r.mode as "auto" | "override" | "monitor" | null) ?? "auto",
            rule: r.rule !== null && r.rule !== undefined ? Number(r.rule) : 1,
            rssi: r.rssi !== null && r.rssi !== undefined ? Number(r.rssi) : null,
            fw: r.firmware_version ? String(r.firmware_version) : "2.0.0-cool",
            lastSeen: r.last_seen ? String(r.last_seen) : null,
            presenceChangedAt: r.presence_changed_at ? String(r.presence_changed_at) : null,
            acChangedAt: r.ac_changed_at ? String(r.ac_changed_at) : null,
            overrideUntil: r.override_until ? String(r.override_until) : null,
          };
        }
      }

      if (Array.isArray(logRows) && logRows.length > 0) {
        const grouped: Record<string, TelemetryHistoryPoint[]> = {};
        for (const row of (logRows as Record<string, unknown>[]).slice().reverse()) {
          const slotId = String(row.slot_id ?? "6-U1");
          if (!grouped[slotId]) grouped[slotId] = [];
          grouped[slotId].push({
            timestamp: String(row.recorded_at ?? new Date().toISOString()),
            temp: Number(row.temperature ?? 25),
            hum: Number(row.humidity ?? 60),
            presence: Boolean(row.presence),
            minutesEmpty: Number(row.minutes_empty ?? 0),
            acMode:
              row.ac_mode === "eco" || row.ac_mode === "off" ? row.ac_mode : "normal",
            targetTemp: row.target_temp !== null ? Number(row.target_temp) : null,
            rule: Number(row.rule ?? 1),
            powerKw: Number(row.power_kw ?? 1.2),
            isDemo: Boolean(row.is_demo),
          });
        }
        this.db.history = { ...this.db.history, ...grouped };
      }

      if (Array.isArray(cmdRows) && cmdRows.length > 0) {
        this.db.commands = (cmdRows as Record<string, unknown>[]).map((c) => ({
          id: String(c.id),
          slotId: String(c.slot_id ?? "6-U1"),
          action: (c.action as CommandRecord["action"]) ?? "ac_normal",
          targetTemp: c.target_temp !== null && c.target_temp !== undefined ? Number(c.target_temp) : undefined,
          durationMin: Number(c.duration_min ?? 60),
          status: (c.status as CommandRecord["status"]) ?? "sent",
          irAction: String(c.ir_action ?? ""),
          createdAt: String(c.created_at ?? new Date().toISOString()),
          ackedAt: c.acked_at ? String(c.acked_at) : undefined,
        }));
      }

      if (Array.isArray(alertRows) && alertRows.length > 0) {
        this.db.alerts = (alertRows as Record<string, unknown>[]).map((a) => ({
          id: String(a.id),
          slotId: String(a.slot_id ?? "6-U1"),
          roomName: String(a.room_name ?? "R.601"),
          type: (a.type as AlertRecord["type"]) ?? "anomaly",
          severity: (a.severity as AlertRecord["severity"]) ?? "warning",
          message: String(a.message ?? ""),
          startedAt: String(a.started_at ?? new Date().toISOString()),
          resolvedAt: a.resolved_at ? String(a.resolved_at) : null,
          acknowledged: Boolean(a.acknowledged),
        }));
      }

      this.supabaseConnected = true;
    } catch {
      // ignore
    }
  }

  private loadDatabase(): PersistentDb {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw) as Partial<PersistentDb>;
        return {
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
          rooms: parsed.rooms && parsed.rooms["6-U1"]
            ? parsed.rooms
            : { "6-U1": { ...INITIAL_PILOT_ROOM } },
          history: parsed.history ?? { "6-U1": [] },
          commands: parsed.commands ?? [],
          alerts: parsed.alerts ?? [],
          virtualEsp32Enabled: parsed.virtualEsp32Enabled ?? false,
        };
      }
    } catch {
      // Fallback ke default jika file belum ada atau rusak
    }
    return {
      settings: { ...DEFAULT_SETTINGS },
      rooms: { "6-U1": { ...INITIAL_PILOT_ROOM } },
      history: { "6-U1": [] },
      commands: [],
      alerts: [],
      virtualEsp32Enabled: false,
    };
  }

  private scheduleSave() {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      try {
        if (!fs.existsSync(DB_DIR)) {
          fs.mkdirSync(DB_DIR, { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), "utf-8");
      } catch {
        // Abaikan error write disk pada mode read-only
      }
    }, 1200);
  }

  public connectMqttBridge(customUrl?: string) {
    if (this.mqttClient) {
      try {
        this.mqttClient.end(true);
      } catch {
        // ignore
      }
    }

    const targetUrl = customUrl || this.db.settings.brokerUrl || "wss://broker.emqx.io:8084/mqtt";
    const clientId = `acoptimizer-backend-bridge-${Math.random().toString(16).slice(2, 10)}`;

    const client = mqtt.connect(targetUrl, {
      clientId,
      keepalive: 30,
      reconnectPeriod: 4000,
      connectTimeout: 10000,
      clean: true,
    });

    this.mqttClient = client;

    client.on("connect", () => {
      this.mqttConnected = true;
      client.subscribe(`${TOPIC_PREFIX}/+/telemetry`, { qos: 0 });
      client.subscribe(`${TOPIC_PREFIX}/+/status`, { qos: 0 });
      client.subscribe(`${TOPIC_PREFIX}/+/ack`, { qos: 0 });
      client.subscribe(`${TOPIC_PREFIX}/+/cmd`, { qos: 0 });
    });

    client.on("reconnect", () => {
      this.mqttConnected = false;
    });

    client.on("offline", () => {
      this.mqttConnected = false;
    });

    client.on("error", () => {
      this.mqttConnected = false;
    });

    client.on("message", (topic, buffer) => {
      const parts = topic.split("/");
      if (parts.length !== 5 || parts[0] !== "acoptimizer" || parts[1] !== "fst-uin") {
        return;
      }
      const slotId = parts[3];
      const kind = parts[4];
      const raw = buffer.toString().trim();

      if (kind === "status") {
        if (raw === "online" || raw === "offline") {
          const room = this.db.rooms[slotId] ?? { ...INITIAL_PILOT_ROOM, slotId };
          room.online = raw === "online";
          if (room.online) room.lastSeen = new Date().toISOString();
          this.db.rooms[slotId] = room;
          this.scheduleSave();
        }
        return;
      }

      if (kind === "ack") {
        try {
          const ack = JSON.parse(raw);
          this.handleIncomingAck(slotId, ack);
        } catch {
          // ignore
        }
        return;
      }

      if (kind === "cmd") {
        // Jika Virtual ESP32 sedang aktif, proses perintah layaknya mikrokontroler ESP32 asli
        if (this.db.virtualEsp32Enabled && Date.now() - this.lastPhysicalEsp32SeenAt > 15000) {
          try {
            const cmd = JSON.parse(raw);
            this.simulateEsp32CommandExecution(slotId, cmd);
          } catch {
            // ignore
          }
        }
        return;
      }

      if (kind === "telemetry") {
        try {
          const tel = JSON.parse(raw);
          const isSim = Boolean(tel.is_sim);
          if (!isSim) {
            this.lastPhysicalEsp32SeenAt = Date.now();
          }
          this.ingestTelemetry(slotId, tel, isSim);
        } catch {
          // ignore invalid json
        }
      }
    });
  }

  public ingestTelemetry(slotId: string, tel: Record<string, unknown>, isDemo = false) {
    const nowIso = new Date().toISOString();
    const existing = this.db.rooms[slotId] ?? {
      ...INITIAL_PILOT_ROOM,
      slotId,
      roomName: String(tel.room_name ?? (slotId === "6-U1" ? "R.601" : slotId)),
    };

    const temp = typeof tel.temp === "number" ? tel.temp : Number(tel.temp ?? 25.0);
    const hum = typeof tel.hum === "number" ? tel.hum : Number(tel.hum ?? 60);
    const presence = Boolean(tel.presence);
    const minutesEmpty = Number(tel.minutes_empty ?? 0);
    const acMode: "normal" | "eco" | "off" =
      tel.ac_mode === "normal" || tel.ac_mode === "eco" || tel.ac_mode === "off"
        ? tel.ac_mode
        : "normal";
    const targetTemp =
      tel.target_temp !== undefined && tel.target_temp !== null
        ? Number(tel.target_temp)
        : acMode === "normal"
        ? this.db.settings.normalTemp
        : acMode === "eco"
        ? this.db.settings.ecoTemp
        : null;
    const mode: "auto" | "override" | "monitor" =
      tel.mode === "override" || tel.mode === "monitor" ? tel.mode : "auto";
    const rule = tel.rule ? Number(tel.rule) : 1;
    const irAction = tel.ir_action ? String(tel.ir_action) : "Tidak ada aksi";
    const dashboardStatus = tel.dashboard_status
      ? String(tel.dashboard_status)
      : "Aktif (ESP32)";

    const presenceChanged = existing.presence !== presence;
    const acChanged = existing.acMode !== acMode;

    const updated: BackendRoomState = {
      slotId,
      roomName: String(tel.room_name ?? existing.roomName ?? "R.601"),
      deviceId: String(tel.device_id ?? existing.deviceId ?? `esp32-${slotId}`),
      hasDevice: true,
      online: true,
      isDemo,
      presence,
      temperature: Number(temp.toFixed(1)),
      humidity: Math.round(hum),
      minutesEmpty,
      acMode,
      targetTemp,
      irAction,
      dashboardStatus,
      mode,
      rule,
      rssi: tel.rssi !== undefined ? Number(tel.rssi) : existing.rssi ?? -58,
      fw: tel.fw ? String(tel.fw) : existing.fw ?? "2.0.0-cool",
      lastSeen: nowIso,
      presenceChangedAt: presenceChanged ? nowIso : existing.presenceChangedAt ?? nowIso,
      acChangedAt: acChanged ? nowIso : existing.acChangedAt ?? nowIso,
      overrideUntil: tel.override_until ? String(tel.override_until) : existing.overrideUntil,
    };

    this.db.rooms[slotId] = updated;

    // Tambahkan ke ring buffer riwayat telemetri (maks 60 titik data terakhir per ruangan)
    const list = this.db.history[slotId] ?? [];
    list.push({
      timestamp: nowIso,
      temp: updated.temperature ?? 25,
      hum: updated.humidity ?? 60,
      presence,
      minutesEmpty,
      acMode,
      targetTemp,
      rule,
      powerKw: calcPowerKw(acMode),
      isDemo,
    });
    if (list.length > 60) {
      list.splice(0, list.length - 60);
    }
    this.db.history[slotId] = list;

    // Evaluasi Alert Otomatis
    this.evaluateRoomAlerts(updated);

    // Tandai command terakhir yang berstatus "sent" menjadi "acked" jika telemetri baru masuk
    for (const cmd of this.db.commands) {
      if (cmd.slotId === slotId && cmd.status === "sent") {
        cmd.status = "acked";
        cmd.ackedAt = nowIso;
        void this.supabaseRequest(`commands?id=eq.${encodeURIComponent(cmd.id)}`, {
          method: "PATCH",
          body: { status: "acked", acked_at: nowIso },
        });
      }
    }

    // Sinkronkan state & log telemetri langsung ke Supabase PostgreSQL (room_state & sensor_logs)
    void this.supabaseRequest("room_state?on_conflict=slot_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates",
      body: {
        slot_id: slotId,
        online: true,
        is_demo: isDemo,
        presence: updated.presence,
        temperature: updated.temperature,
        humidity: updated.humidity,
        minutes_empty: updated.minutesEmpty,
        ac_mode: updated.acMode,
        target_temp: updated.targetTemp,
        ir_action: updated.irAction,
        dashboard_status: updated.dashboardStatus,
        mode: updated.mode ?? "auto",
        rule: updated.rule ?? 1,
        rssi: updated.rssi,
        firmware_version: updated.fw,
        last_seen: nowIso,
        presence_changed_at: updated.presenceChangedAt,
        ac_changed_at: updated.acChangedAt,
        updated_at: nowIso,
      },
    });

    void this.supabaseRequest("sensor_logs", {
      method: "POST",
      body: {
        slot_id: slotId,
        recorded_at: nowIso,
        temperature: updated.temperature,
        humidity: updated.humidity,
        presence: updated.presence,
        minutes_empty: updated.minutesEmpty,
        ac_mode: updated.acMode,
        target_temp: updated.targetTemp,
        rule: updated.rule ?? 1,
        power_kw: calcPowerKw(acMode),
        is_demo: isDemo,
      },
    });

    this.scheduleSave();
  }

  private handleIncomingAck(slotId: string, ack: Record<string, unknown>) {
    const cmdId = String(ack.cmd_id ?? "");
    const nowIso = new Date().toISOString();
    let matched = false;

    for (const cmd of this.db.commands) {
      if ((cmdId && cmd.id === cmdId) || (!cmdId && cmd.slotId === slotId && cmd.status === "sent")) {
        cmd.status = ack.ok === false ? "failed" : "acked";
        cmd.ackedAt = nowIso;
        if (ack.ir_action) cmd.irAction = String(ack.ir_action);
        matched = true;
        void this.supabaseRequest(`commands?id=eq.${encodeURIComponent(cmd.id)}`, {
          method: "PATCH",
          body: {
            status: cmd.status,
            acked_at: nowIso,
            ir_action: cmd.irAction,
          },
        });
      }
    }

    if (matched) {
      this.scheduleSave();
    }
  }

  private evaluateRoomAlerts(room: BackendRoomState) {
    const nowIso = new Date().toISOString();
    const hourWib = new Date().getHours();
    const temp = room.temperature ?? 25;

    // 1. Cek Anomali AC Panas (> 29°C saat ada orang atau Kasus #8)
    const isAnomaly = (room.presence && temp > this.db.settings.hotTempWarningC) || room.rule === 8;
    this.syncAlertState(
      room.slotId,
      room.roomName,
      "anomaly",
      isAnomaly,
      "critical",
      `Peringatan Anomali: Ada penghuni di ${room.roomName} namun suhu mencapai ${temp.toFixed(1)}°C (Indikasi AC Rusak/Mati).`,
      nowIso
    );

    // 2. Cek Aktivitas Luar Jam Operasional (Kasus #6 / Jam >= 18:00 & Ada Orang)
    const isAfterHours =
      Boolean(room.presence) && (hourWib >= this.db.settings.workHoursEnd || room.rule === 6);
    this.syncAlertState(
      room.slotId,
      room.roomName,
      "after_hours_occupied",
      isAfterHours,
      "warning",
      `Aktivitas Lembur / Luar Jam Kerja: Terdeteksi orang di ${room.roomName} di luar jam operasional reguler.`,
      nowIso
    );

    // 3. Cek Pemborosan Energi (Kosong >= 15m tapi AC masih Normal)
    const isWaste =
      !room.presence &&
      room.minutesEmpty >= this.db.settings.idleDelayMin &&
      room.acMode === "normal";
    this.syncAlertState(
      room.slotId,
      room.roomName,
      "waste",
      isWaste,
      "warning",
      `Pemborosan Energi: ${room.roomName} kosong selama ${room.minutesEmpty} menit tetapi AC masih menyala Normal.`,
      nowIso
    );
  }

  private syncAlertState(
    slotId: string,
    roomName: string,
    type: AlertRecord["type"],
    isActive: boolean,
    severity: AlertRecord["severity"],
    message: string,
    nowIso: string
  ) {
    const openAlert = this.db.alerts.find(
      (a) => a.slotId === slotId && a.type === type && !a.resolvedAt
    );

    if (isActive && !openAlert) {
      const newAlert: AlertRecord = {
        id: `alert-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        slotId,
        roomName,
        type,
        severity,
        message,
        startedAt: nowIso,
        resolvedAt: null,
        acknowledged: false,
      };
      this.db.alerts.unshift(newAlert);
      if (this.db.alerts.length > 50) {
        this.db.alerts.length = 50;
      }
      void this.supabaseRequest("alerts?on_conflict=id", {
        method: "POST",
        prefer: "resolution=merge-duplicates",
        body: {
          id: newAlert.id,
          slot_id: newAlert.slotId,
          room_name: newAlert.roomName,
          type: newAlert.type,
          severity: newAlert.severity,
          message: newAlert.message,
          started_at: newAlert.startedAt,
          resolved_at: null,
          acknowledged: false,
        },
      });
    } else if (!isActive && openAlert) {
      openAlert.resolvedAt = nowIso;
      void this.supabaseRequest(`alerts?id=eq.${encodeURIComponent(openAlert.id)}`, {
        method: "PATCH",
        body: { resolved_at: nowIso },
      });
    } else if (isActive && openAlert) {
      openAlert.message = message;
    }
  }

  public sendCommand(
    slotId: string,
    action: CommandRecord["action"],
    targetTemp?: number,
    durationMin = 60
  ): CommandRecord {
    const nowIso = new Date().toISOString();
    const cmdId = `cmd-${Date.now()}`;

    let irAction = "Tidak ada aksi";
    if (action === "ac_normal") irAction = `Set AC ${this.db.settings.normalTemp}C`;
    else if (action === "ac_eco") irAction = `Set AC ${this.db.settings.ecoTemp}C`;
    else if (action === "ac_off") irAction = "Power OFF";
    else if (action === "set_temp" && targetTemp) irAction = `Set AC ${targetTemp}C`;
    else if (action === "release") irAction = "Release ke Otomatis";

    const record: CommandRecord = {
      id: cmdId,
      slotId,
      action,
      targetTemp,
      durationMin,
      status: this.mqttConnected ? "sent" : "pending",
      irAction,
      createdAt: nowIso,
    };

    this.db.commands.unshift(record);
    if (this.db.commands.length > 50) {
      this.db.commands.length = 50;
    }

    void this.supabaseRequest("commands?on_conflict=id", {
      method: "POST",
      prefer: "resolution=merge-duplicates",
      body: {
        id: record.id,
        slot_id: record.slotId,
        action: record.action,
        target_temp: record.targetTemp ?? null,
        duration_min: record.durationMin,
        status: record.status,
        ir_action: record.irAction,
        created_at: record.createdAt,
        sent_at: record.status === "sent" ? nowIso : null,
      },
    });

    const payload = {
      cmd_id: cmdId,
      action,
      target_temp: targetTemp,
      duration_min: durationMin,
    };

    if (this.mqttClient && this.mqttConnected) {
      const cmdTopic = `${TOPIC_PREFIX}/${slotId.replace(/\./g, "-")}/cmd`;
      this.mqttClient.publish(cmdTopic, JSON.stringify(payload), { qos: 1, retain: false });
    }

    // Hanya jalankan simulator respons jika mode Virtual ESP32 sengaja diaktifkan oleh user
    if (this.db.virtualEsp32Enabled && Date.now() - this.lastPhysicalEsp32SeenAt > 15000) {
      setTimeout(() => {
        this.simulateEsp32CommandExecution(slotId, payload);
      }, 250);
    }

    this.scheduleSave();
    return record;
  }

  private simulateEsp32CommandExecution(slotId: string, cmd: Record<string, unknown>) {
    const room = this.db.rooms[slotId] ?? { ...INITIAL_PILOT_ROOM, slotId };
    const action = String(cmd.action ?? "ac_normal");
    const cmdId = String(cmd.cmd_id ?? `cmd-${Date.now()}`);

    let acMode: "normal" | "eco" | "off" = room.acMode ?? "normal";
    let targetTemp = room.targetTemp ?? this.db.settings.normalTemp;
    let mode: "auto" | "override" = "override";
    let irAction = "Set AC 22C";
    let dashboardStatus = "Override Web - AC Normal (22°C)";

    if (action === "ac_normal") {
      acMode = "normal";
      targetTemp = this.db.settings.normalTemp;
      irAction = `Set AC ${targetTemp}C`;
      dashboardStatus = `Override Web - AC Normal (${targetTemp}°C)`;
    } else if (action === "ac_eco") {
      acMode = "eco";
      targetTemp = this.db.settings.ecoTemp;
      irAction = `Set AC ${targetTemp}C`;
      dashboardStatus = `Override Web - AC Eco Mode (${targetTemp}°C)`;
    } else if (action === "ac_off") {
      acMode = "off";
      irAction = "Power OFF";
      dashboardStatus = "Override Web - AC Dimatikan";
    } else if (action === "set_temp") {
      const val = Number(cmd.target_temp ?? 24);
      targetTemp = Math.min(30, Math.max(16, val));
      acMode = targetTemp >= 26 ? "eco" : "normal";
      irAction = `Set AC ${targetTemp}C`;
      dashboardStatus = `Override Web - Set AC ${targetTemp}°C`;
    } else if (action === "release") {
      mode = "auto";
      acMode = room.presence ? "normal" : "eco";
      targetTemp = acMode === "normal" ? this.db.settings.normalTemp : this.db.settings.ecoTemp;
      irAction = `Set AC ${targetTemp}C`;
      dashboardStatus = "Kembali ke Mode Otomatis (Sensor ESP32)";
    }

    // 1. Publish ACK ke broker MQTT & proses di DB
    const ackPayload = {
      cmd_id: cmdId,
      ok: true,
      ac_mode: acMode,
      target_temp: targetTemp,
      ir_action: irAction,
    };
    this.handleIncomingAck(slotId, ackPayload);
    if (this.mqttClient && this.mqttConnected) {
      this.mqttClient.publish(`${TOPIC_PREFIX}/${slotId}/ack`, JSON.stringify(ackPayload));
    }

    // 2. Publish Telemetry terupdate
    const telPayload = {
      device_id: room.deviceId || "esp32-r601",
      room_slot: slotId,
      room_name: room.roomName || "R.601",
      temp: room.temperature ?? 24.4,
      hum: room.humidity ?? 58,
      presence: room.presence ?? true,
      minutes_empty: room.minutesEmpty ?? 0,
      ac_mode: acMode,
      target_temp: targetTemp,
      ir_action: irAction,
      dashboard_status: dashboardStatus,
      mode,
      rule: room.rule ?? 1,
      rssi: -54,
      fw: "2.0.0-cool",
      is_sim: true,
    };

    this.ingestTelemetry(slotId, telPayload, true);
    if (this.mqttClient && this.mqttConnected) {
      this.mqttClient.publish(`${TOPIC_PREFIX}/${slotId}/telemetry`, JSON.stringify(telPayload));
    }
  }

  public triggerScenario(slotId: string, caseNumber: number) {
    const scenarios: Record<
      number,
      {
        temp: number;
        hum: number;
        presence: boolean;
        minutes_empty: number;
        ac_mode: "normal" | "eco" | "off";
        target_temp: number;
        ir_action: string;
        dashboard_status: string;
      }
    > = {
      1: {
        temp: 23.6,
        hum: 56,
        presence: true,
        minutes_empty: 0,
        ac_mode: "normal",
        target_temp: this.db.settings.normalTemp,
        ir_action: `Set AC ${this.db.settings.normalTemp}C`,
        dashboard_status: "Kasus #1: Terpakai - AC Normal (22°C)",
      },
      2: {
        temp: 24.1,
        hum: 58,
        presence: false,
        minutes_empty: 8,
        ac_mode: "normal",
        target_temp: this.db.settings.normalTemp,
        ir_action: "Tidak ada aksi",
        dashboard_status: "Kasus #2: Jeda Transisi (<15m) - AC Normal",
      },
      3: {
        temp: 26.8,
        hum: 62,
        presence: false,
        minutes_empty: 25,
        ac_mode: "eco",
        target_temp: this.db.settings.ecoTemp,
        ir_action: `Set AC ${this.db.settings.ecoTemp}C`,
        dashboard_status: "Kasus #3: Kosong Tervalidasi - AC Eco Mode (27°C)",
      },
      4: {
        temp: 28.5,
        hum: 66,
        presence: false,
        minutes_empty: 130,
        ac_mode: "off",
        target_temp: 27,
        ir_action: "Power OFF",
        dashboard_status: "Kasus #4: Kosong Lama (≥2 Jam) - AC Mati Total",
      },
      5: {
        temp: 28.8,
        hum: 67,
        presence: false,
        minutes_empty: 45,
        ac_mode: "off",
        target_temp: 27,
        ir_action: "Power OFF",
        dashboard_status: "Kasus #5: Kosong Malam Hari - AC Mati",
      },
      6: {
        temp: 23.9,
        hum: 57,
        presence: true,
        minutes_empty: 0,
        ac_mode: "normal",
        target_temp: this.db.settings.normalTemp,
        ir_action: `Set AC ${this.db.settings.normalTemp}C`,
        dashboard_status: "Kasus #6: Terpakai (Lembur Malam) - AC Normal",
      },
      7: {
        temp: 30.2,
        hum: 70,
        presence: false,
        minutes_empty: 60,
        ac_mode: "off",
        target_temp: 27,
        ir_action: "Tidak ada aksi",
        dashboard_status: "Kasus #7: Kosong & Panas - AC Mati Tervalidasi",
      },
      8: {
        temp: 31.4,
        hum: 72,
        presence: true,
        minutes_empty: 0,
        ac_mode: "normal",
        target_temp: this.db.settings.normalTemp,
        ir_action: "Tidak ada aksi IR",
        dashboard_status: "Kasus #8: Peringatan! Ada Penghuni & AC Panas/Rusak",
      },
    };

    const s = scenarios[caseNumber] ?? scenarios[1];
    const telPayload = {
      device_id: "esp32-r601",
      room_slot: slotId,
      room_name: "R.601",
      temp: s.temp,
      hum: s.hum,
      presence: s.presence,
      minutes_empty: s.minutes_empty,
      ac_mode: s.ac_mode,
      target_temp: s.target_temp,
      ir_action: s.ir_action,
      dashboard_status: s.dashboard_status,
      mode: "auto",
      rule: caseNumber,
      rssi: -52,
      fw: "2.0.0-cool",
      is_sim: true,
    };

    this.ingestTelemetry(slotId, telPayload, true);

    if (this.mqttClient && this.mqttConnected) {
      this.mqttClient.publish(`${TOPIC_PREFIX}/${slotId}/status`, "online", { retain: true });
      this.mqttClient.publish(`${TOPIC_PREFIX}/${slotId}/telemetry`, JSON.stringify(telPayload));
    }

    return this.db.rooms[slotId];
  }

  public setVirtualEsp32Enabled(enabled: boolean) {
    this.db.virtualEsp32Enabled = enabled;
    if (enabled) {
      // Langsung kirim 1 paket awal agar R.601 langsung menyala hidup
      const currentRule = this.db.rooms["6-U1"]?.rule ?? 1;
      this.triggerScenario("6-U1", currentRule);
    }
    this.scheduleSave();
    return this.db.virtualEsp32Enabled;
  }

  private startVirtualEsp32Loop() {
    if (this.simInterval) clearInterval(this.simInterval);
    this.simInterval = setInterval(() => {
      if (!this.db.virtualEsp32Enabled) return;
      // Jika ada ESP32 fisik asli yang mengirim data dalam 15 detik terakhir, prioritaskan hardware asli
      if (Date.now() - this.lastPhysicalEsp32SeenAt < 15000) return;

      const room = this.db.rooms["6-U1"] ?? { ...INITIAL_PILOT_ROOM };
      const baseTemp =
        room.acMode === "normal"
          ? 23.5
          : room.acMode === "eco"
          ? 26.8
          : 29.2;
      const jitter = (Math.random() - 0.5) * 0.4;
      const nextTemp = Number(((room.temperature ?? baseTemp) * 0.7 + (baseTemp + jitter) * 0.3).toFixed(1));
      const nextHum = Math.round(58 + (Math.random() - 0.5) * 4);

      const telPayload = {
        device_id: room.deviceId || "esp32-r601",
        room_slot: "6-U1",
        room_name: "R.601",
        temp: nextTemp,
        hum: nextHum,
        presence: room.presence ?? true,
        minutes_empty: room.minutesEmpty ?? 0,
        ac_mode: room.acMode ?? "normal",
        target_temp: room.targetTemp ?? this.db.settings.normalTemp,
        ir_action: room.irAction ?? "Set AC 22C",
        dashboard_status: room.dashboardStatus ?? "Terpakai - AC Normal",
        mode: room.mode ?? "auto",
        rule: room.rule ?? 1,
        rssi: -53,
        fw: "2.0.0-cool",
        is_sim: true,
      };

      this.ingestTelemetry("6-U1", telPayload, true);
      if (this.mqttClient && this.mqttConnected) {
        this.mqttClient.publish(`${TOPIC_PREFIX}/6-U1/telemetry`, JSON.stringify(telPayload));
      }
    }, 4000);
  }

  public updateSettings(partial: Partial<SystemSettings>): SystemSettings {
    const prevBroker = this.db.settings.brokerUrl;
    this.db.settings = {
      ...this.db.settings,
      ...partial,
    };
    if (partial.brokerUrl && partial.brokerUrl !== prevBroker) {
      this.connectMqttBridge(partial.brokerUrl);
    }
    void this.supabaseRequest("settings?on_conflict=key", {
      method: "POST",
      prefer: "resolution=merge-duplicates",
      body: {
        key: "system_settings",
        value: this.db.settings,
      },
    });
    this.scheduleSave();
    return this.db.settings;
  }

  public acknowledgeAlert(alertId: string) {
    const found = this.db.alerts.find((a) => a.id === alertId);
    if (found) {
      found.acknowledged = true;
      void this.supabaseRequest(`alerts?id=eq.${encodeURIComponent(alertId)}`, {
        method: "PATCH",
        body: { acknowledged: true },
      });
      this.scheduleSave();
    }
    return found ?? null;
  }

  public clearResolvedAlerts() {
    this.db.alerts = this.db.alerts.filter((a) => !a.resolvedAt && !a.acknowledged);
    this.scheduleSave();
    return this.db.alerts;
  }

  public getFullState() {
    return {
      ok: true,
      mqttConnected: this.mqttConnected,
      supabaseConnected: this.supabaseConnected || Boolean(this.supabase),
      supabaseProjectId: this.supabase?.projectId ?? null,
      virtualEsp32Enabled: this.db.virtualEsp32Enabled,
      settings: this.db.settings,
      rooms: this.db.rooms,
      history: this.db.history,
      commands: this.db.commands,
      alerts: this.db.alerts,
      serverTime: new Date().toISOString(),
    };
  }

  /**
   * HTTP Request Handler untuk dipasang di Vite Dev Server maupun Standalone Node HTTP Server
   */
  public async handleHttpRequest(
    req: IncomingMessage,
    res: ServerResponse,
    next?: () => void
  ): Promise<void> {
    const urlObj = new URL(req.url ?? "/", "http://localhost");
    const pathname = urlObj.pathname;

    if (!pathname.startsWith("/api")) {
      if (next) next();
      return;
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    const sendJson = (status: number, data: unknown) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(data));
    };

    const readBody = (): Promise<Record<string, unknown>> =>
      new Promise((resolve) => {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch {
            resolve({});
          }
        });
      });

    // 1. GET /api/health
    if (pathname === "/api/health" && req.method === "GET") {
      sendJson(200, {
        ok: true,
        service: "acoptimizer-backend",
        mqttConnected: this.mqttConnected,
        virtualEsp32Enabled: this.db.virtualEsp32Enabled,
        activeRooms: Object.keys(this.db.rooms),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 2. GET /api/state
    if (pathname === "/api/state" && req.method === "GET") {
      sendJson(200, this.getFullState());
      return;
    }

    // 3. GET /api/settings & PUT /api/settings
    if (pathname === "/api/settings") {
      if (req.method === "GET") {
        sendJson(200, { ok: true, settings: this.db.settings });
        return;
      }
      if (req.method === "PUT" || req.method === "POST") {
        const body = await readBody();
        const updated = this.updateSettings(body as Partial<SystemSettings>);
        sendJson(200, { ok: true, settings: updated });
        return;
      }
    }

    // 4. POST /api/simulator/toggle
    if (pathname === "/api/simulator/toggle" && req.method === "POST") {
      const body = await readBody();
      const enabled =
        typeof body.enabled === "boolean" ? body.enabled : !this.db.virtualEsp32Enabled;
      const status = this.setVirtualEsp32Enabled(enabled);
      sendJson(200, {
        ok: true,
        virtualEsp32Enabled: status,
        room: this.db.rooms["6-U1"],
      });
      return;
    }

    // 5. POST /api/rooms/:slotId/command
    const cmdMatch = pathname.match(/^\/api\/rooms\/([^/]+)\/command$/);
    if (cmdMatch && req.method === "POST") {
      const slotId = decodeURIComponent(cmdMatch[1]);
      const body = await readBody();
      const action = String(body.action ?? "ac_normal") as CommandRecord["action"];
      const targetTemp = body.targetTemp !== undefined ? Number(body.targetTemp) : undefined;
      const durationMin = body.durationMin !== undefined ? Number(body.durationMin) : 60;

      const record = this.sendCommand(slotId, action, targetTemp, durationMin);
      sendJson(200, {
        ok: true,
        command: record,
        room: this.db.rooms[slotId],
      });
      return;
    }

    // 6. POST /api/rooms/:slotId/scenario
    const scenMatch = pathname.match(/^\/api\/rooms\/([^/]+)\/scenario$/);
    if (scenMatch && req.method === "POST") {
      const slotId = decodeURIComponent(scenMatch[1]);
      const body = await readBody();
      const rule = Number(body.rule ?? 1);
      const room = this.triggerScenario(slotId, rule);
      sendJson(200, {
        ok: true,
        room,
        history: this.db.history[slotId] ?? [],
        alerts: this.db.alerts,
      });
      return;
    }

    // 7. GET /api/rooms/:slotId/history
    const histMatch = pathname.match(/^\/api\/rooms\/([^/]+)\/history$/);
    if (histMatch && req.method === "GET") {
      const slotId = decodeURIComponent(histMatch[1]);
      sendJson(200, {
        ok: true,
        slotId,
        history: this.db.history[slotId] ?? [],
      });
      return;
    }

    // 8. POST /api/alerts/:id/ack & POST /api/alerts/clear
    if (pathname === "/api/alerts/clear" && req.method === "POST") {
      const alerts = this.clearResolvedAlerts();
      sendJson(200, { ok: true, alerts });
      return;
    }

    const ackAlertMatch = pathname.match(/^\/api\/alerts\/([^/]+)\/ack$/);
    if (ackAlertMatch && req.method === "POST") {
      const alertId = decodeURIComponent(ackAlertMatch[1]);
      const alert = this.acknowledgeAlert(alertId);
      sendJson(200, { ok: true, alert, alerts: this.db.alerts });
      return;
    }

    sendJson(404, { ok: false, error: `Endpoint tidak ditemukan: ${pathname}` });
  }
}

// Singleton instance
let singletonBackend: AcoptimizerBackendService | null = null;
export function getAcoptimizerBackend(): AcoptimizerBackendService {
  if (!singletonBackend) {
    singletonBackend = new AcoptimizerBackendService();
  }
  return singletonBackend;
}

