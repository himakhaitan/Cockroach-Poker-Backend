const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();

const http = require("http");
const server = http.createServer(app);

const SOCKET_EVENTS = require("./utils/socketEvents");

const { createRoom, joinRoom, leaveRoom } = require("./game/room");

const socket = require("socket.io");
const { displayCards, startGame } = require("./game/game");
const io = socket(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
  // Creating A New Room
  socket.on(SOCKET_EVENTS.CREATE_ROOM, (data) => {
    createRoom(socket, data);
  });
  // Joining A Room
  socket.on(SOCKET_EVENTS.JOIN_ROOM, (data) => {
    joinRoom(socket, data);
  });

  // Start the Game
  socket.on(SOCKET_EVENTS.START_GAME, (data) => {
    startGame(socket, data);
  });

  // Load Cards
  socket.on(SOCKET_EVENTS.LOAD_CARDS_REQUEST, (data) => {
    displayCards(socket, data);
  })

  // Leaving A Room
  socket.on(SOCKET_EVENTS.LEAVE_ROOM, (data) => {
    leaveRoom(socket, data);
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () =>
  console.log(`Server is up and running on port ${PORT}`)
);
