'use strict';

require('dotenv').config();
const { Server } = require('socket.io');

const server = new Server();
const PORT = 3001;
server.listen(PORT);


// SOCKET.IO SINGLETON
server.on('connection', (socket) => {
  console.log(`New user connected with ${socket.id}.`);

  
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