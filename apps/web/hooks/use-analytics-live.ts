"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getAnalyticsWsUrl } from "~/lib/analytics-ws-url";

export type AnalyticsOverviewLive = {
  totalResponses: number;
  avgCompletionMs: number | null;
  timedResponseRate: number;
  completionRate: number;
  formStarts: number;
  submissionRate: number;
  dropoffRate: number;
};

export type AnalyticsByDayLive = {
  day: string;
  count: number;
};

export type AnalyticsLiveStatus =
  | "idle"
  | "connecting"
  | "live"
  | "reconnecting"
  | "offline";

type ServerMessage =
  | {
      type: "snapshot";
      formId: string;
      overview: AnalyticsOverviewLive;
      byDay: AnalyticsByDayLive[];
      activeViewers: number;
    }
  | {
      type: "analytics_delta";
      formId: string;
      overview: AnalyticsOverviewLive;
      byDayDelta: { day: string; countDelta: number } | null;
      activeViewers: number;
    }
  | { type: "viewers"; formId: string; activeViewers: number }
  | { type: "pong" }
  | { type: "error"; message: string };

const PING_INTERVAL_MS = 25_000;
const MAX_BACKOFF_MS = 30_000;

function applyByDayDelta(
  byDay: AnalyticsByDayLive[],
  delta: { day: string; countDelta: number },
): AnalyticsByDayLive[] {
  const idx = byDay.findIndex((row) => row.day === delta.day);
  if (idx >= 0) {
    const next = [...byDay];
    const row = next[idx];
    if (row) {
      next[idx] = { day: row.day, count: row.count + delta.countDelta };
    }
    return next;
  }
  return [...byDay, { day: delta.day, count: delta.countDelta }];
}

export function useAnalyticsLive(formId: string | undefined) {
  const [status, setStatus] = useState<AnalyticsLiveStatus>("idle");
  const [overview, setOverview] = useState<AnalyticsOverviewLive | null>(null);
  const [byDay, setByDay] = useState<AnalyticsByDayLive[] | null>(null);
  const [activeViewers, setActiveViewers] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const unmounted = useRef(false);

  const clearTimers = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (pingTimer.current) {
      clearInterval(pingTimer.current);
      pingTimer.current = null;
    }
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(String(event.data)) as ServerMessage;

      if (msg.type === "snapshot") {
        setOverview(msg.overview);
        setByDay(msg.byDay);
        setActiveViewers(msg.activeViewers);
        setStatus("live");
        return;
      }

      if (msg.type === "analytics_delta") {
        setOverview(msg.overview);
        if (msg.byDayDelta) {
          setByDay((prev) =>
            applyByDayDelta(prev ?? [], msg.byDayDelta!),
          );
        }
        setActiveViewers(msg.activeViewers);
        setStatus("live");
        return;
      }

      if (msg.type === "viewers") {
        setActiveViewers(msg.activeViewers);
        return;
      }

      if (msg.type === "error") {
        setStatus("offline");
      }
    } catch {
      /* ignore malformed frames */
    }
  }, []);

  const connect = useCallback(() => {
    if (!formId || unmounted.current) {
      return;
    }

    clearTimers();

    const ws = new WebSocket(getAnalyticsWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempt.current = 0;
      setStatus("connecting");
      ws.send(JSON.stringify({ type: "subscribe", formId }));

      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, PING_INTERVAL_MS);
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      clearTimers();
      wsRef.current = null;

      if (unmounted.current) {
        return;
      }

      setStatus((prev) => (prev === "live" ? "reconnecting" : "offline"));

      const attempt = reconnectAttempt.current++;
      const delay = Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS);
      reconnectTimer.current = setTimeout(() => {
        if (!unmounted.current) {
          connect();
        }
      }, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [clearTimers, formId, handleMessage]);

  useEffect(() => {
    unmounted.current = false;

    if (!formId) {
      return;
    }

    setStatus("connecting");
    connect();

    return () => {
      unmounted.current = true;
      clearTimers();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [clearTimers, connect, formId]);

  const isLive = status === "live";

  return {
    status,
    isLive,
    overview,
    byDay,
    activeViewers,
  };
}
