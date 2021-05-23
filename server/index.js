import express from 'express';
import path from 'path';
import { Server } from 'socket.io';
import { getDuplicates, generateRoomId } from './utils/helpers.js';
import { INITIAL_ALPHABET } from './utils/constants';

const app = express();
const PORT = process.env.PORT || 4002;

const server = app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

app.use('/', express.static(path.resolve('../client/build')));
app.get('/:id', (_, res) => {
  res.sendFile(path.resolve('../client/build') + '/game.html');
});

const io = new Server(server);

const games = {};

io.on('connection', (socket) => {
  socket.on('joinRoom', (code) => {
    const game = games[code];
    if (game && game.playersNumber > Object.keys(game.players).length) {
      socket.join(code);

      game.words[socket.id] = [];
      game.players[`${socket.id}`] = {
        points: 0,
        name: socket.id,
      };

      io.to(code).emit('playerChange', game);

      socket.emit('prepareGame', game);
      socket.on('disconnect', () => {
        disconnect(socket, game);
      });
    } else if (code !== '') {
      socket.emit('wrongRoom');
    }
  });

  socket.on('host', ({ categories, playersNumber, rounds, time }) => {
    const code = generateRoomId();

    socket.join(code);
    games[code] = {
      id: code,
      categories: categories,
      players: {
        [socket.id]: {
          points: 0,
          name: socket.id + '[HOST]',
        },
      },
      words: { [socket.id]: [] },
      playersNumber,
      rounds,
      roundsCounter: 0,
      roundTime: time,
      alphabet: INITIAL_ALPHABET,
      checkDuplicatesCounter: 0,
    };

    const game = games[code];

    socket.emit('setCode', { code: code, id: socket.id });
    socket.emit('playerChange', game);

    socket.on('disconnect', () => {
      io.to(code).emit('hostAbandon', game);
      disconnect(socket, game);
      delete games[code];

      if (io.sockets.adapter.rooms[code]) {
        io.sockets.adapter.rooms[code].sockets = {};
      }
    });
  });

  socket.on('ready', (code) => {
    const game = games[code];

    if (game) {
      game.players[socket.id].isReady = true;
      io.to(code).emit('playerChange', game);

      const readyPlayers = Object.values(game.players)
        .map((player) => player.isReady === true)
        .filter((value) => value);

      if (readyPlayers.length === game.playersNumber) {
        const alphabet = game.alphabet;
        const random = alphabet[Math.floor(Math.random() * alphabet.length)];

        game.alphabet = alphabet.replace(random, '');
        game.letter = random;

        Object.values(game.players).forEach((player) => (player.isReady = false));

        io.to(code).emit('start', { game: game, code: code });
      }
    }
  });

  socket.on('endRound', (code) => {
    io.to(code).emit('getWords', games[code]);
  });

  socket.on('wordlist', ({ wordList, code }) => {
    const game = games[code];

    game.checkDuplicatesCounter++;
    game.words[socket.id] = wordList;
    game.players[socket.id].words = wordList;

    wordList.forEach((word) => {
      if (word) {
        game.players[socket.id].points += 2;
      }
    });

    if (game.checkDuplicatesCounter == Object.keys(game.players).length) {
      game.checkDuplicatesCounter = 0;

      game.categories.forEach((_, i) => {
        const words = Object.values(game.words).map((arr) => arr[i]);

        const duplicates = getDuplicates(words);

        if (duplicates.length > 1) {
          duplicates.forEach((index) => {
            game.players[Object.keys(game.players)[index]].points -= 1;
          });
        }
      });

      game.roundsCounter++;
      if (game.roundsCounter === game.rounds) {
        Object.keys(game.players).forEach((player) => {
          game.players[player].words = null;
        });

        io.to(code).emit('endgame', { players: game.players, code: code });
      }

      io.to(code).emit('playerChange', game);
      io.to(code).emit('updateTable', games[code]);

      socket.on('deleteGame', () => {
        socket.leave(code);
        delete games[code];
      });
    }
  });
});

const disconnect = (socket, game) => {
  if (game && Object.keys(game.players).length === 1) {
    delete games[game.id];
  } else if (game) {
    delete game.players[socket.id];
    delete game.words[socket.id];
    socket.leave(game.id);
    io.to(game.id).emit('playerChange', game);
  }
};
