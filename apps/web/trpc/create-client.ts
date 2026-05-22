import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import { env } from "~/env.js";
import { getOrCreateTerminalId } from "~/lib/terminal-id";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
}

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
  return c({
    url: env.NEXT_PUBLIC_API_URL ?? "/trpc",
    fetch(url, options) {
      const terminalId = getOrCreateTerminalId();
      const headers = new Headers(options?.headers);
      if (terminalId) {
        headers.set("x-terminal-id", terminalId);
      }
      return fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
    },
  });
};
