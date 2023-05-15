const { doc, setDoc } = require("firebase/firestore");
const db = require("../firebase/FirebaseService");
const SOCKET_EVENTS = require("../utils/socketEvents");

const createRoom = async (socket, data) => {
  console.log("createRoom", data);

  const docRef = doc(db, "rooms", data.roomId);

  await setDoc(docRef, {
    roomName: data.roomName,
    players: [
      {
        name: data.userName,
        avatar: data.userAvatar,
        isHost: true,
      },
    ],
  });
  socket.join(data.roomId);

  console.log("Document written with ID: ", docRef.id);
  socket.emit(SOCKET_EVENTS.ROOM_CREATED, { roomId: docRef.id });
  console.log("Room Created");
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
