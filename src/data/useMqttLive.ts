import { useEffect } from "react";
import mqtt from "mqtt";
import { useShallow } from "zustand/react/shallow";
import {
  AckPayload,
  CommandPayload,
  formatTopic,
  parseTopic,
  TelemetryPayload,
  TOPIC_PREFIX,
} from "../domain/contract";
import { registerMqttCommandPublisher, useRoomStore } from "../stores/roomStore";

/**
 * Hook Koneksi Real-Time MQTT over WebSockets untuk menyambungkan Web App
 * langsung dengan mikrokontroler ESP32 (misal di Ruang Pilot R.601 / Slot "6-U1").
 */
export function useMqttLive(enabled = true) {
  const { brokerUrl, setConnection, updateTelemetry, handleCommandAck, setDeviceOnline } =
    useRoomStore(
      useShallow((s) => ({
        brokerUrl: s.brokerUrl,
        setConnection: s.setConnection,
        updateTelemetry: s.updateTelemetry,
        handleCommandAck: s.handleCommandAck,
        setDeviceOnline: s.setDeviceOnline,
      }))
    );

  useEffect(() => {
    if (!enabled || !brokerUrl) return;

    setConnection("connecting");

    const clientId = `acoptimizer-web-${Math.random().toString(16).slice(2, 10)}`;
    const client = mqtt.connect(brokerUrl, {
      clientId,
      keepalive: 30,
      reconnectPeriod: 4000,
      connectTimeout: 10000,
      clean: true,
    });

    client.on("connect", () => {
      setConnection("live");
      // Subscribe ke seluruh topik perangkat FST UIN
      client.subscribe(`${TOPIC_PREFIX}/+/telemetry`, { qos: 0 });
      client.subscribe(`${TOPIC_PREFIX}/+/status`, { qos: 0 });
      client.subscribe(`${TOPIC_PREFIX}/+/ack`, { qos: 0 });
      // Fallback kompatibilitas topik v1 pendek
      client.subscribe("acoptimizer/v1/+/telemetry", { qos: 0 });
      client.subscribe("acoptimizer/v1/+/status", { qos: 0 });
    });

    client.on("reconnect", () => {
      setConnection("reconnecting");
    });

    client.on("offline", () => {
      setConnection("offline");
    });

    client.on("error", () => {
      setConnection("reconnecting");
    });

    client.on("message", (topic, messageBuffer) => {
      const parsedTopic = parseTopic(topic);
      if (!parsedTopic) return;

      const { slot, kind } = parsedTopic;
      const rawStr = messageBuffer.toString().trim();

      if (kind === "status") {
        if (rawStr === "online" || rawStr === "offline") {
          setDeviceOnline(slot, rawStr === "online");
        }
        return;
      }

      if (kind === "ack") {
        try {
          const json = JSON.parse(rawStr);
          const validated = AckPayload.safeParse(json);
          if (validated.success) {
            handleCommandAck(slot, validated.data);
          } else if (json && typeof json === "object") {
            handleCommandAck(slot, {
              cmd_id: String(json.cmd_id ?? ""),
              ok: json.ok !== false,
              ac_mode:
                json.ac_mode === "eco" || json.ac_mode === "off"
                  ? json.ac_mode
                  : "normal",
              target_temp: json.target_temp ? Number(json.target_temp) : undefined,
              ir_action: json.ir_action ? String(json.ir_action) : undefined,
            });
          }
        } catch {
          // Abaikan payload non-JSON
        }
        return;
      }

      if (kind === "telemetry") {
        try {
          const json = JSON.parse(rawStr);
          const validated = TelemetryPayload.safeParse(json);
          if (validated.success) {
            updateTelemetry(slot, validated.data, false);
          } else {
            // Fallback fleksibel jika ESP32 mengirim field sederhana
            const fallbackPayload: TelemetryPayload = {
              device_id: String(json.device_id ?? `esp32-${slot}`),
              room_slot: String(json.room_slot ?? slot),
              room_name: String(json.room_name ?? "R.601"),
              temp: Number(json.temp ?? 25.0),
              hum: Number(json.hum ?? 60),
              presence: Boolean(json.presence),
              minutes_empty: Number(json.minutes_empty ?? 0),
              ac_mode:
                json.ac_mode === "normal" || json.ac_mode === "eco" || json.ac_mode === "off"
                  ? json.ac_mode
                  : "normal",
              target_temp: json.target_temp ? Number(json.target_temp) : undefined,
              ir_action: json.ir_action ? String(json.ir_action) : undefined,
              dashboard_status: json.dashboard_status ? String(json.dashboard_status) : undefined,
              mode:
                json.mode === "override" || json.mode === "monitor" ? json.mode : "auto",
              rule: json.rule ? Number(json.rule) : undefined,
              rssi: json.rssi ? Number(json.rssi) : undefined,
              fw: json.fw ? String(json.fw) : undefined,
            };
            updateTelemetry(slot, fallbackPayload, false);
          }
        } catch {
          // Abaikan payload non-JSON
        }
      }
    });

    // Daftarkan fungsi publisher untuk mengirim perintah kontrol dari Web App ke ESP32
    registerMqttCommandPublisher((slotId: string, payload: CommandPayload) => {
      if (client.connected) {
        const cmdTopic = formatTopic(slotId, "cmd");
        client.publish(cmdTopic, JSON.stringify(payload), { qos: 1, retain: false });
      }
    });

    return () => {
      registerMqttCommandPublisher(null);
      client.end(true);
    };
  }, [enabled, brokerUrl, setConnection, updateTelemetry, handleCommandAck, setDeviceOnline]);
}

