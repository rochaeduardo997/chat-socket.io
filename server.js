const path     = require('path');
const express  = require('express');
const http     = require('http');
const socketio = require('socket.io');

const formatMessage = require('./utils/messages');
const users         = require('./utils/users');

const PORT = 3000 || process.env.PORT;

const app    = express();
const server = http.createServer(app);
const io     = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {  
  socket.on('joinRoom', ({ username, room }) => {
    const user = users.userJoin(socket.id, username, room);
    
    socket
      .join(user.room);
    
    socket
      .emit('message', formatMessage('Bot', `${username}, welcome`));
    
    socket
      .broadcast
      .to(user.room)
      .emit('message', formatMessage('Bot', `${username} has joined the chat`));

    io
      .to(user.room)
      .emit('roomUsers', { room: user.room, users: users.getRoomUsers(user.room) });
  });
  
  socket.on('disconnect', () => {
    const user = users.userLeave(socket.id);

    if(user)
      io.to(user.room).emit('message', formatMessage('Bot', `${user.username} has left the chat`));
  });

  socket.on('chatMessage',  msg => {
    const user = users.getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });
})

server.listen(PORT, () => { console.log(PORT) });
