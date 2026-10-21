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
  temp: z.number(),
  hum: z.number(),
  presence: z.boolean(),
  ac_mode: AcMode,
  mode: DeviceMode,
  override_until: z.string().datetime().nullable().optional(),
  rule: z.number().int().min(1).max(8).optional(), // 8 Kasus logika PRD
  rssi: z.number().optional(),
  fw: z.string().optional(),
});
export type TelemetryPayload = z.infer<typeof TelemetryPayload>;

export const DeviceStatusPayload = z.enum(["online", "offline"]);
export type DeviceStatusPayload = z.infer<typeof DeviceStatusPayload>;

export const CommandAction = z.enum(["ac_normal", "ac_eco", "ac_off", "release"]);
export type CommandAction = z.infer<typeof CommandAction>;

export const CommandPayload = z.object({
  cmd_id: z.string().uuid(),
  action: CommandAction,
  duration_min: z.number().int().min(5).max(720).default(60),
});
export type CommandPayload = z.infer<typeof CommandPayload>;

export const AckPayload = z.object({
  cmd_id: z.string().uuid(),
  ok: z.boolean(),
  ac_mode: AcMode,
  error: z.string().nullable().optional(),
});
export type AckPayload = z.infer<typeof AckPayload>;

// Topic helpers
export type TopicKind = "telemetry" | "status" | "cmd" | "ack";

export function formatTopic(slot: string, kind: TopicKind): string {
  // Ganti titik menjadi dash jika ada (misal "6.01" -> "6-01")
  const sanitized = slot.replace(/\./g, "-");
  return `acoptimizer/v1/${sanitized}/${kind}`;
}

export function parseTopic(topicStr: string): { slot: string; kind: TopicKind } | null {
  const parts = topicStr.split("/");
  if (parts.length === 4 && parts[0] === "acoptimizer" && parts[1] === "v1") {
    return {
      slot: parts[2],
      kind: parts[3] as TopicKind,
    };
  }
  return null;
}
