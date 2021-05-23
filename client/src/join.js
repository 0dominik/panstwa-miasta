import { startGame } from './game';

const socket = io();
socket.emit('joinRoom', location.pathname.substring(1));

startGame(socket);
