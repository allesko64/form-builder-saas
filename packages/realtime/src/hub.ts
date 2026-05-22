import { randomUUID } from "node:crypto";

import { logger } from "@repo/logger";

import type { AnalyticsServerMessage, SocketLike } from "./types";

const WS_OPEN_STATE = 1;

type RoomClient = {
  viewerId: string;
  userId: string;
  formId: string;
  socket: SocketLike;
};

export class AnalyticsRealtimeHub {
  private readonly clients = new Map<string, RoomClient>();
  private readonly rooms = new Map<string, Set<string>>();

  public join(
    socket: SocketLike,
    params: { userId: string; formId: string },
  ): string {
    const viewerId = randomUUID();
    const client: RoomClient = {
      viewerId,
      userId: params.userId,
      formId: params.formId,
      socket,
    };

    this.clients.set(viewerId, client);

    let room = this.rooms.get(params.formId);
    if (!room) {
      room = new Set();
      this.rooms.set(params.formId, room);
    }
    room.add(viewerId);

    this.broadcastViewers(params.formId);
    return viewerId;
  }

  public leave(viewerId: string): void {
    const client = this.clients.get(viewerId);
    if (!client) {
      return;
    }

    this.clients.delete(viewerId);
    const room = this.rooms.get(client.formId);
    if (room) {
      room.delete(viewerId);
      if (room.size === 0) {
        this.rooms.delete(client.formId);
      } else {
        this.broadcastViewers(client.formId);
      }
    }
  }

  public leaveBySocket(socket: SocketLike): void {
    for (const [viewerId, client] of this.clients) {
      if (client.socket === socket) {
        this.leave(viewerId);
        return;
      }
    }
  }

  public getActiveViewers(formId: string): number {
    return this.rooms.get(formId)?.size ?? 0;
  }

  public broadcast(formId: string, message: AnalyticsServerMessage): void {
    const room = this.rooms.get(formId);
    if (!room) {
      return;
    }

    const payload = JSON.stringify(message);
    for (const viewerId of room) {
      const client = this.clients.get(viewerId);
      if (!client || client.socket.readyState !== WS_OPEN_STATE) {
        continue;
      }
      try {
        client.socket.send(payload);
      } catch (err) {
        logger.warn("Analytics WS send failed", { err, formId, viewerId });
      }
    }
  }

  public broadcastViewers(formId: string): void {
    this.broadcast(formId, {
      type: "viewers",
      formId,
      activeViewers: this.getActiveViewers(formId),
    });
  }
}

let hub: AnalyticsRealtimeHub | null = null;

export function getAnalyticsHub(): AnalyticsRealtimeHub {
  if (!hub) {
    hub = new AnalyticsRealtimeHub();
  }
  return hub;
}
