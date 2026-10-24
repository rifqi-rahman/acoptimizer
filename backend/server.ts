import http from "node:http";
import { getAcoptimizerBackend } from "./acoptimizerBackend.ts";

const PORT = Number(process.env.PORT || 4000);
const backend = getAcoptimizerBackend();

const server = http.createServer((req, res) => {
  void backend.handleHttpRequest(req, res, () => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        ok: true,
        service: "Acoptimizer Standalone Backend API & MQTT Bridge",
        endpoints: [
          "GET /api/health",
          "GET /api/state",
          "GET /api/settings",
          "PUT /api/settings",
          "POST /api/simulator/toggle",
          "POST /api/rooms/:slotId/command",
          "POST /api/rooms/:slotId/scenario",
          "GET /api/rooms/:slotId/history",
          "POST /api/alerts/:id/ack",
          "POST /api/alerts/clear",
        ],
      })
    );
  });
});

server.listen(PORT, () => {
  console.log(`[Acoptimizer Backend] Server API & MQTT Bridge aktif di http://localhost:${PORT}`);
});

