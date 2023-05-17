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
  START_GAME: "startGame",
  LOAD_CARDS: "loadCards",
  LOAD_CARDS_REQUEST: "loadCardsRequest",
  UPDATE_BOARD: "updateBoard",

  SET_PLAYED: "setPlayed",
  SET_PLAYING: "setPlaying",

  INIT_TURN: "initTurn",
  REPLY_TURN: "replyTurn",  
};

module.exports = SOCKET_EVENTS;
