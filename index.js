'use strict';

require('dotenv').config();
const { Server } = require('socket.io');
const axios = require('axios');

const server = new Server();
const PORT = 3001;
server.listen(PORT);

let roomTracker = {
//   coolRoom: {
//     players: 0,
//     playersCompleted: 0,
//     superUser: '',
//     playerScores: [],
//   },
};
const roomDirectory = ['coolRoom', 'sadRoom', 'DoomROOM'];

roomDirectory.forEach(room => {
  roomTracker[room] = {
    players: 0,
    playersCompleted: 0,
    superUser: '',
    playerScores: [],
  };
});
console.log(roomTracker);


async function getQuestions() {
  const otdb = await axios('https://opentdb.com/api.php?amount=10');
  // console.log(otdb.data.results);

  let i = 0;

  const questions = await otdb.data.results.map(question => {
    i++;
    let newQuestion =  {
      type: 'list',
      name: `${i}`,
      message: question.question,
      answer: question.correct_answer,
      choices: [
        ...question.incorrect_answers, question.correct_answer,
      ],
    };
    newQuestion.choices.sort(() => 0.5 - Math.random());
    return newQuestion;
  });
 
  return questions;
}

// SOCKET.IO SINGLETON
server.on('connection', (socket) => {
  console.log(`New user connected with ${socket.id}.`);

  socket.on('GET_OPEN_ROOMS', () => {
    socket.emit('RECEIVE_ROOM_NAMES', roomDirectory);
  });

  socket.on('JOIN_ROOM', roomAndUser => {
    let room = roomAndUser.room;
    socket.join(room);
    socket.data.room = room;
    roomTracker[room].players++;
    
    if (roomTracker[room].players === 1) {
      roomTracker[room].superUser = socket.id;
    }
    server.to(room).emit('ROOM_JOINED', roomAndUser);
    server.to(roomTracker[room].superUser).emit('PROMPT_START');
    // console.log('ROOMS---->', socket.adapter.rooms);
  });

  socket.on('GAME_START', async () => {
    let questions = await getQuestions();
    // console.log('QUESTIONS---->', questions);
    server.emit('START_TRIVIA', questions);
  });

  socket.on('GAME_OVER', (payload) => {
    roomTracker[payload.currentRoom].playersCompleted++;
    roomTracker[payload.currentRoom].playerScores.push({ player: payload.userName, score: payload.score });
    
    if (roomTracker[payload.currentRoom].playersCompleted === roomTracker[payload.currentRoom].players) {
      server.to(payload.currentRoom).emit('LEADERBOARD', roomTracker[payload.currentRoom].playerScores);
      roomTracker[payload.currentRoom].playerScores = [];
      roomTracker[payload.currentRoom].playersCompleted = 0;
    }
  });

  // CONSOLE LOGS EACH SOCKET EVENT, DATE, & ATTACHED INFO
  socket.onAny((event, attachedEventInfo) => {
    const eventNotification = {
      event: `${event.toLowerCase()}`,
      time: Date(),
      attachedEventInfo,
    };
    console.log('EVENT', eventNotification);
  });


  // DISCONNECT MESSAGE
  socket.on('disconnect', () => {
    roomTracker[socket.data.room].players - 1;
    console.log(`User ${socket.id} has disconnected`);
  });
});






// SOCKET SERVER CHEATSHEET

// SEE ALL CURRENT ROOMS
// socket.adapter.rooms

// server.on("connection", (socket) => {

//   // basic emit
//   socket.emit(/* ... */);

//   // to all clients in the current namespace except the sender
//   socket.broadcast.emit(/* ... */);

//   // to all clients in room1 except the sender
//   socket.to("room1").emit(/* ... */);

//   // to all clients in room1 and/or room2 except the sender
//   socket.to("room1").to("room2").emit(/* ... */);

//   // to all clients in room1
//   server.in("room1").emit(/* ... */);

//   // to all clients in namespace "myNamespace"
//   server.of("myNamespace").emit(/* ... */);

//   // to all clients in room1 in namespace "myNamespace"
//   server.of("myNamespace").to("room1").emit(/* ... */);

//   // to individual socketid (private message)
//   server.to(socketId).emit(/* ... */);

//   // to all clients on this node (when using multiple nodes)
//   server.local.emit(/* ... */);

//   // to all connected clients
//   server.emit(/* ... */);
