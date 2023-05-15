const { doc, setDoc } = require("firebase/firestore");
const db = require("../firebase/FirebaseService");
const SOCKET_EVENTS = require("../utils/socketEvents");

const createRoom = (socket, data) => {
  // TODO: CREATE ROOM
};

const joinRoom = (socket, data) => {
  // TODO: JOIN ROOM
};

const leaveRoom = (socket, data) => {
  // TODO: LEAVE ROOM
};

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
};
