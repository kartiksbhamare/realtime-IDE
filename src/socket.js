import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempt: 'Infinity',
        timeout: 10000,
        transports: ['websocket'],
    };
    // const BACKEND_URL = "http://10.0.1.217:5000/"
    // return io(BACKEND_URL, options);
    
    const BACKEND_URL="http://localhost:5000/"
    return io(BACKEND_URL, options);
};
