import { z } from "zod";

/**
 * Kontrak Data MQTT Acoptimizer (V1)
 * Topik format: acoptimizer/v1/{slot}/{kind}
 * Contoh slot: "6-U1", "3-S2", "4-T3"
 */

export const AcMode = z.enum(["normal", "eco", "off"]);
export type AcMode = z.infer<typeof AcMode>;

export const DeviceMode = z.enum(["auto", "override", "monitor"]);
export type DeviceMode = z.infer<typeof DeviceMode>;

export const TelemetryPayload = z.object({
  device_id: z.string(),
  room_slot: z.string().optional(),
  room_name: z.string().optional(),
  temp: z.number(),
  hum: z.number().optional().default(60),
  presence: z.boolean(),
  minutes_empty: z.number().int().nonnegative().optional().default(0),
  ac_mode: AcMode,
  target_temp: z.number().int().min(16).max(30).nullable().optional(),
  ir_action: z.string().optional(),
  dashboard_status: z.string().optional(),
  mode: DeviceMode,
  override_until: z.string().datetime().nullable().optional(),
  rule: z.number().int().min(1).max(8).optional(), // Kasus logika Tabel Kerangka
  rssi: z.number().optional(),
  fw: z.string().optional(),
});
export type TelemetryPayload = z.infer<typeof TelemetryPayload>;

export const DeviceStatusPayload = z.enum(["online", "offline"]);
export type DeviceStatusPayload = z.infer<typeof DeviceStatusPayload>;

export const CommandAction = z.enum([
  "ac_normal",
  "ac_eco",
  "ac_off",
  "set_temp",
  "release",
]);
export type CommandAction = z.infer<typeof CommandAction>;

export const CommandPayload = z.object({
  cmd_id: z.string(),
  action: CommandAction,
  target_temp: z.number().int().min(16).max(30).optional(),
  duration_min: z.number().int().min(5).max(720).default(60),
});
export type CommandPayload = z.infer<typeof CommandPayload>;

export const AckPayload = z.object({
  cmd_id: z.string(),
  ok: z.boolean(),
  ac_mode: AcMode,
  target_temp: z.number().optional(),
  ir_action: z.string().optional(),
  error: z.string().nullable().optional(),
});
export type AckPayload = z.infer<typeof AckPayload>;

// Topic helpers (Namespace unik FST UIN Jakarta agar tidak bentrok di public broker)
export type TopicKind = "telemetry" | "status" | "cmd" | "ack";
export const TOPIC_PREFIX = "acoptimizer/fst-uin/v1";

export function formatTopic(slot: string, kind: TopicKind): string {
  const sanitized = slot.replace(/\./g, "-");
  return `${TOPIC_PREFIX}/${sanitized}/${kind}`;
}

export function parseTopic(topicStr: string): { slot: string; kind: TopicKind } | null {
  const parts = topicStr.split("/");
  // Mendukung format "acoptimizer/fst-uin/v1/{slot}/{kind}" maupun "acoptimizer/v1/{slot}/{kind}"
  if (parts.length === 5 && parts[0] === "acoptimizer" && parts[1] === "fst-uin" && parts[2] === "v1") {
    return {
      slot: parts[3],
      kind: parts[4] as TopicKind,
    };
  }
  if (parts.length === 4 && parts[0] === "acoptimizer" && parts[1] === "v1") {
    return {
      slot: parts[2],
      kind: parts[3] as TopicKind,
    };
  }
  return null;
}
