import { host } from './host';
import { startGame } from './game';

const socket = io();

host(socket);
startGame(socket);
