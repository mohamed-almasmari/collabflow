import "dotenv/config";

import { createServer } from "node:http";

import { app } from "./app.js";
import { initializeSocketServer } from "./socket/socket.js";

const PORT = Number(process.env.PORT) || 3000;

const httpServer = createServer(app);

initializeSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`CollabFlow API running on http://localhost:${PORT}`);

  console.log(`Socket.IO ready on port ${PORT}`);
});
