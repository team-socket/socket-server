'use strict';

require('dotenv').config();
const { Server } = require('socket.io');

const server = new Server();
const PORT = 3001;
server.listen(PORT);


const roomDirectory = ['coolRoom', 'sadRoom', 'DoomROOM'];

// SOCKET.IO SINGLETON
server.on('connection', (socket) => {
  console.log(`New user connected with ${socket.id}.`);

  socket.on('GET_OPEN_ROOMS', () => {
    socket.emit('RECEIVE_ROOM_NAMES', roomDirectory);
  });

  socket.on('JOIN_ROOM', roomAndUser => {
    socket.join(roomAndUser.room);
    server.to(roomAndUser.room).emit('ROOM_JOINED', roomAndUser);
  });

  socket.on('START_TRIVIA', (questions) => {
    server.emit('START_TRIVIA', questions);
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
