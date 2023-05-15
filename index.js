const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();

const http = require("http");
const server = http.createServer(app);

const db = require("./firebase/FirebaseService");

const SOCKET_EVENTS = require("./utils/socketEvents");

const socket = require("socket.io");
const io = socket(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Socket Connected: ", socket.id);

});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () =>
  console.log(`Server is up and running on port ${PORT}`)
);
