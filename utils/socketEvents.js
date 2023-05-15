const SOCKET_EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  CREATE_ROOM: "createRoom",
  JOIN_ROOM: "joinRoom",
  LEAVE_ROOM: "leaveRoom",
  ROOM_CREATED: "roomCreated",
  ROOM_JOINED: "roomJoined",
  PLAYER_JOINED: "playerJoined",
  REFRESH_LOBBY: "refreshLobby",
};

module.exports = SOCKET_EVENTS;
