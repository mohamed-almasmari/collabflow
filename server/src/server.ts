import { createServer } from "node:http";

import { app } from "./app.js";
import { env } from "./config/env.js";
import { initializeSocketServer } from "./socket/socket.js";

const httpServer = createServer(app);

initializeSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`CollabFlow API running on http://localhost:${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Socket.IO ready on port ${env.PORT}`);
});
