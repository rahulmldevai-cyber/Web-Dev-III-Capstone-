
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST']
        }
    });

    // Authenticate Socket Connections
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error('Authentication token required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded.type !== 'access') {
                return next(new Error('Invalid access token'));
            }

            socket.user = decoded;
            next();
        } catch (error) {
            next(new Error('Invalid or expired token'));
        }
    });

    io.on('connection', (socket) => {
        const { id, role } = socket.user;

        socket.join(`user:${id}`);

        if (role === 'seller') {
            socket.join(`seller:${id}`);
        }

        if (role === 'admin') {
            socket.join('admin');
        }

        console.log(`Socket connected: ${id}`);

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO has not been initialized');
    }

    return io;
};

module.exports = { initializeSocket, getIO };
