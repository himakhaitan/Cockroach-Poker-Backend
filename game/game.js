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
  socket
    .to(fetcheddata.players[fetcheddata.turn].id)
    .emit(SOCKET_EVENTS.SET_PLAYING, true);
};

const initTurn = async (socket, data) => {
  // Fetch Room Data
  const docRef = doc(db, "rooms", data.roomId);
  const docSnap = await getDoc(docRef);
  let fetcheddata = docSnap.data();

  // Check if Card Exists

  let playingPlayerIndex = fetcheddata.players.findIndex(
    (player) => player.id === socket.id
  );

  let playedPlayerIndex = fetcheddata.players.findIndex(
    (player) => player.name === data.playedPlayer
  );

  if (fetcheddata.players[playingPlayerIndex].cards == 0) {
    // GAME LOST
  }

  // Remove Card from Players Hands
  let playedCardIndex = fetcheddata.players[playingPlayerIndex].cards.findIndex(
    (card) => card === data.playedCard
  );

  fetcheddata.players[playingPlayerIndex].cards.splice(playedCardIndex, 1);

  // Set Played Card

  fetcheddata.played_card = data.playedCard;

  // Set Bluff Cards

  fetcheddata.bluff_card = data.bluffingCard;

  // Set Played Player

  fetcheddata.played_player = {
    name: data.playedPlayer,
    id: fetcheddata.players[playedPlayerIndex].id,
  };

  // Set Playing Player

  fetcheddata.playing_player = {
    name: fetcheddata.players[playingPlayerIndex].name,
    id: fetcheddata.players[playingPlayerIndex].id,
  };

  // Set Turn
  fetcheddata.turn = playedPlayerIndex;

  // Save Data
  await setDoc(docRef, fetcheddata);

  // Update Turns on Frontend

  // - Played Player
  socket.to(fetcheddata.played_player.id).emit(SOCKET_EVENTS.SET_PLAYED, true);

  // Emit LOG to all the Players
  socket
    .to(data.roomId)
    .emit(
      SOCKET_EVENTS.UPDATE_LOG,
      `${fetcheddata.playing_player.name} says it's a ${fetcheddata.bluff_card} to ${fetcheddata.played_player.name}`
    );
};

const replyTurn = async (socket, data) => {
  const docRef = doc(db, "rooms", data.roomId);
  const docSnap = await getDoc(docRef);
  let fetcheddata = docSnap.data();

  if (data.reply) {
    if (fetcheddata.played_card == fetcheddata.bluff_card) {
      // Bluffing Player Looses

      socket
        .to(data.roomId)
        .emit(SOCKET_EVENTS.UPDATE_LOG, "Bluff Was Successful");

      // Add card to lost of Bluffing Player
      let bluffingPlayerIndex = fetcheddata.players.findIndex(
        (player) => player.id === fetcheddata.playing_player.id
      );

      fetcheddata.players[bluffingPlayerIndex].lost.push(
        fetcheddata.played_card
      );
      fetcheddata.played_card = null;
      fetcheddata.bluff_card = null;
    } else {
      // Played Player Looses
      socket.to(data.roomId).emit(SOCKET_EVENTS.UPDATE_LOG, "Bluff Was Called");
      // Add card to lost of Played Player
      let playedPlayerIndex = fetcheddata.players.findIndex(
        (player) => player.id === fetcheddata.played_player.id
      );

      fetcheddata.players[playedPlayerIndex].lost.push(fetcheddata.played_card);

      fetcheddata.bluff_card = null;
      fetcheddata.played_card = null;
    }
  } else {
    if (fetcheddata.played_card == fetcheddata.bluff_card) {
      // Played Player Looses
      socket.emit(SOCKET_EVENTS.UPDATE_LOG, "Bluff Was Called");

      // Add card to lost of Played Player
      let playedPlayerIndex = fetcheddata.players.findIndex(
        (player) => player.id === fetcheddata.played_player.id
      );

      fetcheddata.players[playedPlayerIndex].lost.push(fetcheddata.played_card);

      fetcheddata.bluff_card = null;
      fetcheddata.played_card = null;
    } else {
      // Bluffing Player Looses
      socket
        .emit(SOCKET_EVENTS.UPDATE_LOG, "Bluff Was Successful");

      // Add card to lost of Bluffing Player
      let bluffingPlayerIndex = fetcheddata.players.findIndex(
        (player) => player.id === fetcheddata.playing_player.id
      );

      fetcheddata.players[bluffingPlayerIndex].lost.push(
        fetcheddata.played_card
      );
      fetcheddata.played_card = null;
      fetcheddata.bluff_card = null;
    }

    socket.to(data.roomId).emit(SOCKET_EVENTS.SET_PLAYING, false);
    socket.to(data.roomId).emit(SOCKET_EVENTS.SET_PLAYED, false);

    fetcheddata.turn = (fetcheddata.turn + 1) % 4;

   
    // Save Data
    await setDoc(docRef, fetcheddata, {
      merge: true,
      overwrite: true,
    });

    // Update Turns on Frontend

    socket
      .to(fetcheddata.players[fetcheddata.turn].id)
      .emit(SOCKET_EVENTS.SET_PLAYING, true);
  }
  console.log(fetcheddata);
};

module.exports = {
  startGame,
  displayCards,
  initTurn,
  replyTurn,
};
