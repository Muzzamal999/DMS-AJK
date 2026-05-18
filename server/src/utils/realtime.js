import { WebSocketServer } from "ws";

let wss;

export const initRealtimeServer = (server) => {
  wss = new WebSocketServer({ server });

  wss.on("connection", (socket) => {
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });

    socket.send(JSON.stringify({ type: "connection:welcome", payload: { timestamp: new Date().toISOString() } }));
  });

  const heartbeat = () => {
    wss.clients.forEach((socket) => {
      if (socket.isAlive === false) {
        return socket.terminate();
      }
      socket.isAlive = false;
      socket.ping();
    });
  };

  const interval = setInterval(heartbeat, 30000);

  wss.on("close", () => clearInterval(interval));
};

export const broadcastRealtime = (type, payload) => {
  if (!wss) return;
  const message = JSON.stringify({ type, payload });
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
};

export default {
  initRealtimeServer,
  broadcastRealtime,
};
