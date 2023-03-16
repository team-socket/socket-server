'use strict';

require('dotenv').config();
const { Server } = require('socket.io');
const axios = require('axios');
const base64 = require('base-64');
const { DESCRIPTORS, NOUNS } = require('./data');
const server = new Server();
const PORT = 3001;
const { sequelizeDB } = require('./model');
const { userCollection } = require('./model');

sequelizeDB.sync().then(() => {
  console.log('Database is connected');
  server.listen(PORT);
}).catch(e => console.error(e));

let roomTracker = {
  // TEMPLATE
  //   coolRoom: {
  //     players: 0,
  //     playersCompleted: 0,
  //     superUser: '',
  //     playerScores: [],
  //   },
};

const generateRoomName = () => {
  let name = '';
  name = `${DESCRIPTORS[Math.floor(Math.random() * DESCRIPTORS.length)]} ${NOUNS[Math.floor(Math.random() * NOUNS.length)]}`;
  return name;
};

const roomDirectory = [];

for (let i = 0; i < 5; i++) {
  roomDirectory.push(generateRoomName());
}

const categoryNumber = {
  'General Knowledge': 9,
  'Film': 11,
  'Music': 12,
  'Video Games': 15,
  'History': 23,
  'Science and Nature': 17,
};

roomDirectory.forEach(room => {
  roomTracker[room] = {
    players: 0,
    playersCompleted: 0,
    superUser: '',
    playerScores: [],
  };
});

async function getQuestions(number = 10, category = '') {
  const otdb = await axios(`https://opentdb.com/api.php?amount=${number}&${category}encode=base64`);

  let idx = 0;

  const questions = await otdb.data.results.map(question => {
    idx++;
    let newQuestion = {
      type: 'list',
      name: `${idx}`,
      message: base64.decode(question.question),
      answer: base64.decode(question.correct_answer),
      choices: [
        ...question.incorrect_answers, question.correct_answer,
      ],
    };
    newQuestion.choices.sort(() => 0.5 - Math.random());
    for (let i = 0; i < newQuestion.choices.length; i++) {
      newQuestion.choices[i] = base64.decode(newQuestion.choices[i]);
    }
    return newQuestion;
  });

  return questions;
}

// SOCKET.IO SINGLETON
server.on('connection', (socket) => {
  console.log(`New user connected with ${socket.id}.`);

  socket.on('CREATE_USER', async (payload) => {
    let test = {
      username: payload.username,
      passphrase: payload.passphrase,
    };
    const userCheck = await userCollection.read(payload.username);
    if (!userCheck) {
      const newUser = await userCollection.create(test);
      console.log('User created', newUser);
      socket.emit('LOGIN_GRANTED');
    } else {
      socket.emit('USER_EXISTS');
    }
  });

  socket.on('GET_PASSPHRASE', async (username) => {
    const userInfo = await userCollection.read(username);
    socket.emit('RETURN_PASSPHRASE', userInfo.passphrase);
  });

  socket.on('LOGIN_USER', async (payload) => {
    const userInfo = await userCollection.read(payload.username);
    if (!userInfo) {
      socket.emit('INVALID_LOGIN');
    } else {
      if (userInfo.passphrase === payload.passphrase) {
        socket.emit('LOGIN_GRANTED');
      } else {
        socket.emit('INVALID_LOGIN');
      }
    }
  });

  socket.on('GET_STATS', async (username) => {
    const userStats = await userCollection.read(username);
    socket.emit('USER_STATS', userStats);
  });

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
      server.to(roomTracker[room].superUser).emit('PROMPT_START');
    }
    server.to(room).emit('ROOM_JOINED', { ...roomAndUser, players: roomTracker[room].players });
    if (roomTracker[room].players > 1) {
      server.to(roomTracker[room].superUser).emit('RE_PROMPT_START');
    }
  });

  socket.on('CUSTOMIZE_GAME', async (settings) => {
    roomDirectory.splice(roomDirectory.indexOf(settings.room), 1);

    let category = `category=${categoryNumber[settings.questionCategory]}&`;
    let number = settings.questionAmount;
    let questions = await getQuestions(number, category);
    
    server.to(settings.room).emit('START_TRIVIA', { questions, questionAmount: number });
  });

  socket.on('GAME_START', async (room) => {
    roomDirectory.splice(roomDirectory.indexOf(room), 1);

    let questions = await getQuestions();

    server.to(room).emit('START_TRIVIA', { questions, questionAmount: 10 });
  });

  socket.on('GAME_OVER', async (payload) => {
    if ('User is authenticated') {  // LEFT IN FOR FUTURE GUEST LOGIN
      const userStats = await userCollection.read(payload.username);
      const updatedStats = {
        username: payload.username,
        passphrase: userStats.passphrase,
        score: userStats.score + payload.score,
        gamesPlayed: userStats.gamesPlayed + 1,
        totalQuestions: userStats.totalQuestions + payload.questionAmount,
      };

      await userCollection.update(updatedStats, payload.username);
    }
    roomTracker[payload.currentRoom].playersCompleted++;
    roomTracker[payload.currentRoom].playerScores.push({ player: payload.username, score: payload.score });

    if (roomTracker[payload.currentRoom].playersCompleted === roomTracker[payload.currentRoom].players) {
      roomDirectory.push(payload.currentRoom);

      server.to(payload.currentRoom).emit('LEADERBOARD', roomTracker[payload.currentRoom].playerScores);
      roomTracker[payload.currentRoom].playerScores = [];
      roomTracker[payload.currentRoom].playersCompleted = 0;
    }
  });

  socket.on('RETRY', () => {
    if (roomTracker[socket.data.room].superUser === socket.id) {
      server.to(roomTracker[socket.data.room].superUser).emit('PROMPT_START');
    }
  });

  socket.on('LEAVE_ROOM', () => {
    roomTracker[socket.data.room].players--;
    socket.leave(socket.data.room);
    socket.data.room = '';
    socket.emit('ROOM_EXITED');
  });

  
  // DISCONNECT MESSAGE
  socket.on('disconnect', () => {
    if (socket.data.room && socket.data.room !== '') {
      roomTracker[socket.data.room].players--;
    }
    console.log(`User ${socket.id} has disconnected`);
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
});

module.exports = { getQuestions };
