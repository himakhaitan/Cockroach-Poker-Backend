const { doc, setDoc, getDoc } = require("firebase/firestore");
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
        id: socket.id,
      },
    ],
  });
  socket.join(data.roomId);

  console.log("Document written with ID: ", docRef.id);
  socket.emit(SOCKET_EVENTS.ROOM_CREATED, { roomId: docRef.id });
  console.log("Room Created");
};

const joinRoom = async (socket, data) => {
  console.log("joinRoom", data);

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

  console.log("Room Joined");
};

const leaveRoom = (socket, data) => {
  // TODO: LEAVE ROOM
};

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
};
