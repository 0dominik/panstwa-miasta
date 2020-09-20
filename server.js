const express = require('express');
const socket = require('socket.io');

const app = express();
const PORT = process.env.PORT || 4002;

const server = app.listen(PORT, () => {
  console.log('listening to reqest on port 4002');
});

app.use(express.static('./client'));

app.get(/(^\/[0-9]+$)/, function (req, res) {
  res.sendFile(__dirname + '/client/join.html');
});

const io = socket(server);

const games = {};

io.on('connect', (socket) => {
  socket.on('joinroom', (code) => {
    const game = games[code];
    console.log('io.sockets', socket.rooms);
    console.log('wykonalo sie joinroom');
    if (game && game.playersNumber > Object.keys(game.players).length) {
      //
      if (game.hasStarted) {
        socket.emit('hasStarted', game);
      }
      //
      socket.join(code);
      game.words[socket.id] = [];

      game.players[`${socket.id}`] = {
        points: 0,
        name: socket.id,
      };

      io.to(code).emit('playerchange', game);

      console.log('games');
      console.dir(games, { depth: null });

      socket.emit('prepareGame', game);

      socket.on('disconnect', () => {
        disconnect(socket, game);
      });
    } else if (code == '') {
      console.log('jestes na /');
    } else {
      socket.emit('wrongRoom');
      console.log('there is no such a room');
    }
  });

  socket.on('host', ({ categories, playersNumber, rounds, time }) => {
    // const code = Math.floor(Math.random() * 901 + 100);
    const code = 200;

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
      playersNumber: playersNumber,
      rounds: rounds,
      roundsCounter: 0,
      roundTime: time,
      hasStarted: false,
      alphabet: 'ABCDEFGHIJKLMNOPRSTUWZ',
      checkDuplicatesCounter: 0,
    };

    const game = games[code];

    console.dir(games, { depth: null });

    socket.emit('setcode', { code: code, id: socket.id, roundTime: game.roundTime });
    socket.emit('playerchange', game);

    socket.on('disconnect', () => {
      //delete game if host leaves
      disconnect(socket, game);
      delete games[code];

      if (io.sockets.adapter.rooms[code]) {
        io.sockets.adapter.rooms[code].sockets = {};
      }
    });
  });

  socket.on('ready', (code) => {
    const game = games[code];

    try {
      game.players[socket.id].isReady = true;
      io.to(code).emit('playerchange', game);

      const readyPlayers = Object.values(game.players)
        .map((player) => player.isReady === true)
        .filter((value) => value);

      console.log('readyPlayers', readyPlayers);

      if (readyPlayers.length == game.playersNumber) {
        game.hasStarted = true;
        const alphabet = game.alphabet;
        let random = alphabet[Math.floor(Math.random() * alphabet.length)];

        game.alphabet = alphabet.replace(random, '');
        game.letter = random;

        Object.values(game.players).forEach((player) => (player.isReady = false));

        io.to(code).emit('start', { game: game, code: code });
      }
    } catch {
      console.log('error');
    }
  });

  socket.on('endround', (code) => {
    io.to(code).emit('getWords', code);
  });

  socket.on('wordlist', ({ wordList, code }) => {
    const game = games[code];

    game.checkDuplicatesCounter++;
    game.words[socket.id] = wordList;

    game.players[socket.id].words = wordList;

    wordList.forEach((word) => {
      if (word != '---') {
        game.players[socket.id].points += 10;
      }
    });

    if (game.checkDuplicatesCounter == Object.keys(game.players).length) {
      // sprawdzamy duplikaty, jeśli są wszystkie słowa
      game.checkDuplicatesCounter = 0;

      game.categories.forEach((el, i) => {
        let words = [];

        Object.values(game.words).forEach((el) => words.push(el[i]));

        const duplicates = getDuplicates(words);

        console.log('duplicates', duplicates);
        if (duplicates.length > 1) {
          duplicates.forEach((index) => {
            game.players[Object.keys(game.players)[index]].points -= 5;
          });
        }
      });

      game.roundsCounter++;
      if (game.roundsCounter == game.rounds) {
        console.log('KONIEC GRY');
        Object.keys(game.players).forEach((player) => {
          game.players[player].words = null;
        });

        io.to(code).emit('endgame', { players: game.players, code: code });
      }

      io.to(code).emit('playerchange', game);

      socket.on('deleteGame', () => {
        socket.leave(code);
        delete game;
      });
    }

    console.log('games');
    console.dir(games, { depth: null });
  });
});

const disconnect = (socket, game) => {
  if (game && Object.keys(game.players).length === 1) {
    delete game;
  } else if (game) {
    delete game.players[socket.id];
    delete game.words[socket.id];
    socket.leave(game.id);
    io.to(game.id).emit('playerchange', game);
  }
};

const getDuplicates = (array) => {
  var duplicates = [];
  for (let i = 0; i < array.length; i++) {
    if (array.filter((el) => el != array[i]).length < array.length - 1 && array[i] !== '---') {
      duplicates.push(i);
    }
  }
  return duplicates;
};
