const mongoose = require('mongoose');
mongoose.set('debug', false);
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');
const Socket = require('./models/Socket.model.js');
const server = require('http').createServer(app);

const DB = process.env.DATABASE;
mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then(() => console.log('DB connection successful!'));
const port = process.env.PORT || 5001;
server.listen(port, () => {
    console.log(`App running on port ${port}...`);
});
// =============================== Socket =======================================

const io = require('socket.io')(server, {
    cors: {
        origin: ['https://instantspace.app', "http://localhost:3003", "http://localhost:3002"],
    }
});

let onlineUsers = [];

io.on('connection', socket => {
    console.log("User connected");
    socket.on("addNewUser", (userId) => {
        !onlineUsers.some(user => user.userId === userId) &&
            onlineUsers.push({
                userId,
                socketId: socket.id
            });
        console.log({ onlineUsers });
        io.emit("getOnlineUsers", onlineUsers);
    });

    socket.on("sendMessage", (message) => {
        console.log({ message });
        const user = onlineUsers.find((user) => user.userId === message.receiver);
        if (user) {
            const forwardMsg = {
                conversationId: message.conversationId,
                sender: message.sender,
                message: message.message,
                receiver: message.receiver,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt
            }
            io.to(user.socketId).emit("getMessage", forwardMsg);
            // console.log('getMessage', forwardMsg);
            io.to(user.socketId).emit("getNotification", { ...forwardMsg, isRead: false, type: 'chat' });
        }
    });
    {
        nama:'w'
        age:`$`
    }

    socket.on("createBooking", (messages) => {
        console.log(typeof messages)
        messages.forEach((message) => {
            const user = onlineUsers.find((user) => user.userId === message.receiver);
            console.log(message);
            if (user) {
                const forwardMsg = {
                    bookingId: message.bookingId,
                    sender: message.sender,
                    details: message.details,
                    status: 'pending',
                    receiver: message.receiver,
                    createdAt: message.createdAt,
                    updatedAt: message.updatedAt
                }
                console.log(forwardMsg);
                io.to(user.socketId).emit("getNotification", { ...forwardMsg, isRead: false, type: 'booking' });
            }
        });
    });
    
    socket.on('bookingStatus', (messages) => {
        messages.forEach(message => {
          const user = onlineUsers.find(user => user.userId === message.receiver);
          if (user) {
            const forwardMsg = {
              bookingId: message.bookingId,
              sender: message.sender,
              sender: message.sender,
              message: message.message,
              status: message.status,
              receiver: message.receiver,
              createdAt: message.createdAt,
              updatedAt: message.updatedAt
            };
            io.to(user.socketId).emit('getNotification', {
              ...forwardMsg,
              isRead: false,
              type: 'booking'
            });
          }
        });
      });

    socket.on('disconnect', () => {
        console.log("User disconnected");
        onlineUsers = onlineUsers.filter(user => user.socketId !== socket.id);

        io.emit("getOnlineUsers", onlineUsers);
    });
});