const express = require('express');
const app = express();
const http = require('http');
const helmet = require("helmet");
const morgan = require("morgan");
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/utils/SocketActions');

const server = http.createServer(app);
const io = new Server(server);

// app.use(express.static('build'));
// app.use((req, res, next) => {
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

const cors = require('cors');
app.use(cors({ origin: true }));

const coderunRoute = require("./code-run");

app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
app.use("/", coderunRoute);

const userSocketMap = {};

const socketToRoom = {};
const usersToRoom = {};

function getAllConnectedClients(roomId) {
    // Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

////// Connection  /////
io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {

      if (usersToRoom[roomId]) {
        usersToRoom[roomId].push(socket.id);
      } else {
        usersToRoom[roomId] = [socket.id];
      }

      socketToRoom[socket.id] = roomId;

      const usersInThisRoom = usersToRoom[roomId].filter(id => id !== socket.id);
      socket.emit(ACTIONS.ALL_PEERS, usersInThisRoom);

        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.REQ_TO_CONNECT, payload => {
      io.to(payload.userToSignal).emit(ACTIONS.PEER_JOINED, { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on(ACTIONS.RES_TO_CONNECT, payload => {
      io.to(payload.callerID).emit(ACTIONS.ACK_TO_CONNECT, { signal: payload.signal, id: socket.id });
    });

    socket.on(ACTIONS.MEDIADEVICE_STATE_CHANGE, (payload) => {
      socket.broadcast.emit(ACTIONS.MEDIADEVICE_STATE_CHANGE, payload)
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // Listen for code Language changes from client
    socket.on(ACTIONS.LANG_CHANGE, ({roomId, codeLang}) => {
      // emit to all other clients of the room
      socket.in(roomId).emit(ACTIONS.LANG_CHANGE, { codeLang });
    })

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));

// server.listen(PORT,'10.0.1.217', () => console.log(`Listening on port ${PORT}`));
