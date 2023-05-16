const SOCKET_EVENTS = require("../utils/socketEvents");
const { doc, setDoc, getDoc } = require("firebase/firestore");
const db = require("../firebase/FirebaseService");

const cardTypes = [
  "BAT",
  "BEE",
  "COCKROACH",
  "TORD",
  "RAT",
  "SCORPION",
  "SPIDER",
  "BUG",
];

const cardImages = {
  BAT: "1.png",
  BEE: "2.png",
  COCKROACH: "3.png",
  TORD: "4.png",
  RAT: "5.png",
  SCORPION: "6.png",
  SPIDER: "7.png",
  BUG: "8.png",
};

const deck = [];

for (let i = 0; i < cardTypes.length; i++) {
  for (let j = 0; j < 8; j++) {
    deck.push(cardTypes[i]);
  }
}

const startGame = async (socket, data) => {
  // Shuffle Cards
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * i);
    let temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }

  // Deal Cards
  let players = {
    p1: [],
    p2: [],
    p3: [],
    p4: [],
  };

  for (let i = 0; i < deck.length; i++) {
    if (i < 16) {
      players.p1.push(deck[i]);
    } else if (i < 32) {
      players.p2.push(deck[i]);
    } else if (i < 48) {
      players.p3.push(deck[i]);
    } else {
      players.p4.push(deck[i]);
    }
  }

  // Set Game State

  const docRef = doc(db, "rooms", data);

  const docSnap = await getDoc(docRef);

  let fetcheddata = docSnap.data();

  fetcheddata.players[0].cards = players.p1;
  fetcheddata.players[0].lost = [];
  fetcheddata.players[1].cards = players.p2;
  fetcheddata.players[1].lost = [];
  fetcheddata.players[2].cards = players.p3;
  fetcheddata.players[2].lost = [];
  fetcheddata.players[3].cards = players.p4;
  fetcheddata.players[3].lost = [];

  await setDoc(docRef, fetcheddata);

  // EMIT TO ALL PLAYERS IN LOBBY
  socket.to(data).emit(SOCKET_EVENTS.START_GAME, data);

  fetcheddata.players.forEach((player) => {
    socket.to(player.userId).emit(SOCKET_EVENTS.LOAD_CARDS, player.cards);
  });
};

const displayCards = async (socket, data) => {
  // EMIT TO ALL PLAYERS IN LOBBY
  const docRef = doc(db, "rooms", data.roomId);
  const docSnap = await getDoc(docRef);

  let fetcheddata = docSnap.data();
  fetcheddata.players.forEach((player) => {
    let boardData = {
      roomName: fetcheddata.roomName,
      players: fetcheddata.players,
    };

    socket.to(player.id).emit(SOCKET_EVENTS.UPDATE_BOARD, boardData);
    socket.to(player.id).emit(SOCKET_EVENTS.LOAD_CARDS, player.cards);
  });
  setTurn(socket, fetcheddata.turn, fetcheddata.players, data);
};

const setTurn = (socket, turn, players, data) => {
  // Emit true to player whose turn it is
  socket.to(players[turn].id).emit(SOCKET_EVENTS.SET_TURN, true);

  // Emit false to all other players
  players.forEach((player) => {
    if (player.id !== players[turn].id) {
      socket.to(player.id).emit(SOCKET_EVENTS.SET_TURN, false);
    }
  });

  socket.to(data).emit(SOCKET_EVENTS.GAME_LOG, `${players[turn].name}'s turn`);
};

const initTurn = async (socket, data) => {
  let { roomId, playedCard, playedPlayer, bluff } = data;
  let playerId = socket.id;

  const docRef = doc(db, "rooms", roomId);
  const docSnap = await getDoc(docRef);

  let fetcheddata = docSnap.data();

  // Remove Card from Player
  let playerIndex = fetcheddata.players.findIndex(
    (player) => player.id === playerId
  );

  // Check for loose
  if (fetcheddata.players[playerIndex].cards.length === 0) {
    // EMIT GAME STATUS
    socket
      .to(roomId)
      .emit(
        SOCKET_EVENTS.RESULT,
        `${fetcheddata.players[playerIndex].name} has lost the game`
      );
    return;
  }

  let cardIndex = fetcheddata.players[playerIndex].cards.findIndex(
    (card) => card === playedCard
  );
  // Remove Card from Player
  fetcheddata.players[playerIndex].cards.splice(cardIndex, 1);

  // Set it to actual card
  fetcheddata.actual = playedCard;

  // set the bluff prompt
  fetcheddata.bluff = bluff;

  // Set played by
  fetcheddata.playedBy = playerId;

  // Fetch Played Player ID

  let playedPlayerIndex = fetcheddata.players.findIndex(
    (player) => player.name === playedPlayer
  );

  // Set Played to
  fetcheddata.playedTo = fetcheddata.players[playedPlayerIndex].id;

  // Set turn to played player
  fetcheddata.turn = playedPlayerIndex;

  // Save Data
  await setDoc(docRef, fetcheddata);

  // Send Game Log to all players
  socket
    .to(roomId)
    .emit(
      SOCKET_EVENTS.GAME_LOG,
      `${fetcheddata.players[playerIndex].name} says it's a ${bluff} to ${fetcheddata.players[playedPlayerIndex].name}`
    );

  // Update Board of Player who played
  socket
    .to(playerId)
    .emit(SOCKET_EVENTS.LOAD_CARDS, fetcheddata.players[playerIndex].cards);

  // Update Board of Player who played to
  socket.to(fetcheddata.playedTo).emit(
    SOCKET_EVENTS.PLAYED,
    fetcheddata.players.filter((player) => {
      return player.id === fetcheddata.playedTo || player.id === playerId;
    })
  );
};

const replyTurn = async (socket, data) => {
  const docRef = doc(db, "rooms", roomId);
  const docSnap = await getDoc(docRef);

  let fetcheddata = docSnap.data();

  let playerId = socket.id;

  let playedByIndex = fetcheddata.players.findIndex(
    (player) => player.id === fetcheddata.playedBy
  );

  let playedToIndex = fetcheddata.players.findIndex(
    (player) => player.id === fetcheddata.playedTo
  );

  if (data.reply) {
    if (fetcheddata.actual == fetcheddata.bluff) {
      fetcheddata.players[playedByIndex].lost.push(fetcheddata.actual);
    }
  } else {
    if (fetcheddata.actual !== fetcheddata.bluff) {
      fetcheddata.players[playedToIndex].lost.push(fetcheddata.actual);
    }
  }

  if (!data.reply) {
    if (fetcheddata.actual !== fetcheddata.bluff) {
      fetcheddata.players[playedToIndex].lost.push(fetcheddata.actual);
    } else {
      fetcheddata.players[playedByIndex].lost.push(fetcheddata.actual);
    }
  }


};

module.exports = {
  startGame,
  displayCards,
  initTurn,
  replyTurn,
};
