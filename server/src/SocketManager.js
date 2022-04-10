import io from "socket.io-client";

let socket;
let connectionChangeCallback;
export const initiateSocket = (cb) => {
  connectionChangeCallback = cb;
  socket = io("http://" + window.location.hostname + ":3000");
  console.log(`Connecting socket...`);
  connectionChangeCallback(true);
  socket.on("connect_error", (err) => console.log(err));
  socket.on("connect_failed", (err) => console.log(err));
};
export const disconnectSocket = () => {
  console.log("Disconnecting socket...");
  if (socket) socket.disconnect();
  connectionChangeCallback(false);
};
export const onData = (cb) => {
  if (!socket) return true;
  socket.on("data", (msg) => {
    console.log("Websocket data received!");
    return cb(null, msg);
  });
};
export const sendMessage = (room, message) => {
  if (socket) socket.emit("color", { message, room });
};
