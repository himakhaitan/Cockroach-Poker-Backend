const { doc, setDoc, getDoc } = require("firebase/firestore");
const db = require("../firebase/FirebaseService");
const SOCKET_EVENTS = require("../utils/socketEvents");

const createRoom = async (socket, data) => {

  const docRef = doc(db, "rooms", data.roomId);

  await setDoc(docRef, {
    roomName: data.roomName,
    players: [
      {
        name: data.userName,
        avatar: data.userAvatar,
        isHost: true,
        id: socket.id,
      },
    ],
    turn: Math.floor(Math.random() * 4),
    bluff: null,
    actual: null,
    playedBy: null,
    playedTo: null,
  });
  socket.join(data.roomId);

  socket.emit(SOCKET_EVENTS.ROOM_CREATED, { roomId: docRef.id });
};

const joinRoom = async (socket, data) => {

  const docRef = doc(db, "rooms", data.roomId);
  const docSnap = await getDoc(docRef);

  let fetcheddata = docSnap.data();

  fetcheddata.players.push({
    name: data.userName,
    avatar: data.userAvatar,
    isHost: false,
    id: socket.id,
  });

  await setDoc(docRef, fetcheddata);

  socket.join(data.roomId);

  socket.emit(SOCKET_EVENTS.PLAYER_JOINED, {
    roomId: data.roomId,
  });
  socket.to(data.roomId).emit(SOCKET_EVENTS.REFRESH_LOBBY, fetcheddata.players);

};

const leaveRoom = (socket, data) => {
  // TODO: LEAVE ROOM
};

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
};
