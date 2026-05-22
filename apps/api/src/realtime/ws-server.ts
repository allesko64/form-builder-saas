import type http from "node:http";
import { URL } from "node:url";

import { auth } from "@repo/auth";
import { logger } from "@repo/logger";
import {
  buildAnalyticsSnapshot,
  getAnalyticsHub,
  getFormOwnerId,
  type AnalyticsClientMessage,
  type AnalyticsServerMessage,
} from "@repo/realtime";
import { WebSocketServer, type WebSocket } from "ws";

const socketUserIds = new WeakMap<WebSocket, string>();

function toHeaders(headers: http.IncomingHttpHeaders): Headers {
  const result = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        result.append(key, item);
      }
      continue;
    }
    result.set(key, value);
  }
  return result;
}

function send(socket: WebSocket, message: AnalyticsServerMessage): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

export function attachAnalyticsWebSocket(server: http.Server): void {
  const wss = new WebSocketServer({ noServer: true });
  const hub = getAnalyticsHub();

  server.on("upgrade", async (request, socket, head) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (url.pathname !== "/ws/analytics") {
      return;
    }

    try {
      const session = await auth.api.getSession({
        headers: toHeaders(request.headers),
      });

      if (!session?.user) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        socketUserIds.set(ws, session.user.id);
        wss.emit("connection", ws, request);
      });
    } catch (err) {
      logger.error("Analytics WS upgrade failed", { err });
      socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
      socket.destroy();
    }
  });

  wss.on("connection", (ws) => {
    const userId = socketUserIds.get(ws);
    if (!userId) {
      ws.close(4401, "Unauthorized");
      return;
    }

    let viewerId: string | null = null;
    let subscribedFormId: string | null = null;

    ws.on("message", async (raw) => {
      try {
        const parsed = JSON.parse(String(raw)) as AnalyticsClientMessage;

        if (parsed.type === "ping") {
          send(ws, { type: "pong", serverTime: new Date().toISOString() });
          return;
        }

        if (parsed.type !== "subscribe") {
          send(ws, { type: "error", message: "Expected subscribe message" });
          return;
        }

        const formId = parsed.formId;
        const ownerId = await getFormOwnerId(formId);
        if (!ownerId || ownerId !== userId) {
          send(ws, { type: "error", message: "Form not found or access denied" });
          ws.close(4403, "Forbidden");
          return;
        }

        if (viewerId) {
          hub.leave(viewerId);
        }

        viewerId = hub.join(ws, { userId, formId });
        subscribedFormId = formId;

        const snapshot = await buildAnalyticsSnapshot(formId, userId);
        if (snapshot) {
          send(ws, {
            type: "snapshot",
            formId,
            overview: snapshot.overview,
            byDay: snapshot.byDay,
            activeViewers: hub.getActiveViewers(formId),
            serverTime: new Date().toISOString(),
          });
        }
      } catch (err) {
        logger.warn("Analytics WS message error", { err });
        send(ws, { type: "error", message: "Invalid message" });
      }
    });

    ws.on("close", () => {
      if (viewerId) {
        hub.leave(viewerId);
        viewerId = null;
        subscribedFormId = null;
      }
    });

    ws.on("error", (err) => {
      logger.warn("Analytics WS socket error", { err, formId: subscribedFormId });
    });
  });

  logger.info("Analytics WebSocket listening on /ws/analytics");
}
