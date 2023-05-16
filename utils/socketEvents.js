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

  PLAYED: "played",

  SET_TURN: "setTurn",
  SET_TO_TURN: "setToTurn",

  INIT_TURN: "initTurn",
  REPLY_TURN: "replyTurn",

  RESULT: "result",
  GAME_LOG: "gameLog",
};

module.exports = SOCKET_EVENTS;
