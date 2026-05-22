export type AnalyticsOverviewPayload = {
  totalResponses: number;
  avgCompletionMs: number | null;
  timedResponseRate: number;
  completionRate: number;
  formStarts: number;
  submissionRate: number;
  dropoffRate: number;
};

export type AnalyticsByDayItem = {
  day: string;
  count: number;
};

/** Server → client messages. */
export type AnalyticsServerMessage =
  | {
      type: "snapshot";
      formId: string;
      overview: AnalyticsOverviewPayload;
      byDay: AnalyticsByDayItem[];
      activeViewers: number;
      serverTime: string;
    }
  | {
      type: "analytics_delta";
      formId: string;
      overview: AnalyticsOverviewPayload;
      byDayDelta: { day: string; countDelta: number } | null;
      activeViewers: number;
      serverTime: string;
    }
  | {
      type: "viewers";
      formId: string;
      activeViewers: number;
    }
  | {
      type: "pong";
      serverTime: string;
    }
  | {
      type: "error";
      message: string;
    };

/** Client → server messages. */
export type AnalyticsClientMessage =
  | { type: "subscribe"; formId: string }
  | { type: "ping" };

export type SocketLike = {
  send(data: string): void;
  readyState: number;
  close(code?: number, reason?: string): void;
};

export const WS_OPEN = 1;
