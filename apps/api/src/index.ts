import http from "node:http";
import { initAnalyticsRedisBridge } from "@repo/realtime";
import { logger } from "@repo/logger";
import { app as expressApplication } from "./server";

import { env } from "./env";
import { redis } from "./lib/redis";
import { attachAnalyticsWebSocket } from "./realtime/ws-server";

async function init() {
  try {
    const server = http.createServer(expressApplication);
    attachAnalyticsWebSocket(server);

    if (redis) {
      initAnalyticsRedisBridge(redis);
    }

    const PORT: number = env.PORT ? +env.PORT : 8000;
    server.listen(PORT, () => {
      logger.info(`http server is running on PORT ${PORT}`);
    });
  } catch (err) {
    logger.error(`Error creating http server`, { err });
    process.exit(1);
  }
}

init();
