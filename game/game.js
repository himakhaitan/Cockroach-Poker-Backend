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
  console.log("Display Cards");
  // EMIT TO ALL PLAYERS IN LOBBY
  const docRef = doc(db, "rooms", data.roomId);
  const docSnap = await getDoc(docRef);

  let fetcheddata = docSnap.data();
  console.log(fetcheddata);
  fetcheddata.players.forEach((player) => {
    let boardData = {
      roomName: fetcheddata.roomName,
      players: fetcheddata.players,
    };

    socket.to(player.id).emit(SOCKET_EVENTS.UPDATE_BOARD, boardData);
    socket.to(player.id).emit(SOCKET_EVENTS.LOAD_CARDS, player.cards);
  });
  setTurn(socket, fetcheddata.turn, fetcheddata.players); 
};

const setTurn = (socket, turn, players) => {
  // Emit true to player whose turn it is
  socket.to(players[turn].id).emit(SOCKET_EVENTS.SET_TURN, true);


  
  // Emit false to all other players
  players.forEach((player) => {
    if (player.id !== players[turn].id) {
      socket.to(player.id).emit(SOCKET_EVENTS.SET_TURN, false);
    }
  });
};

module.exports = {
  startGame,
  displayCards,
};