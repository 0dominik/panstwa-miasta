const express = require('express');
const socket = require('socket.io');

const app = express();
const PORT = process.env.PORT || 4002;

const server = app.listen(PORT, () => {
  console.log('listening to reqest on port 4002');
});
app.use(express.static('./client'));

app.get(/(^\/[0-9]+$)/, function (req, res) {
  //Matches anything with alphabets,numbers and hyphen without trailing slash
  res.sendFile(__dirname + '/client/join.html');
});

const io = socket(server);

const games = {};

io.on('connect', (socket) => {
  socket.on('joinroom', function (room) {
    if (games[room]) {
      //
      if (games[room].hasStarted) {
        socket.emit('hasStarted', games[room]);
      }
      //
      socket.join(room);
      games[room].words[socket.id] = [];

      games[room].players[`${socket.id}`] = {
        points: 0,
        name: socket.id,
      };

      io.to(room).emit('playerchange', games[room]);

      console.log('games');
      console.dir(games, { depth: null });

      socket.emit('prepareGame', games[room]);

      socket.on('disconnect', () => {
        disconnect(socket, games[room]);
      });
    } else if (room == '') {
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

    console.dir(games, { depth: null });

    socket.emit('setcode', { code: code, id: socket.id, roundTime: games[code].roundTime });
    socket.emit('playerchange', games[code]);

    socket.on('disconnect', () => {
      disconnect(socket, games[code]);
      delete games[code];
    });
  });

  socket.on('ready', (code) => {
    games[code].players[socket.id].isReady = true;
    io.to(code).emit('playerchange', games[code]);

    const readyPlayers = Object.values(games[code].players)
      .map((player) => player.isReady === true)
      .filter((value) => value);

    console.log('readyPlayers', readyPlayers);

    if (readyPlayers.length == games[code].playersNumber) {
      games[code].hasStarted = true;
      const alphabet = games[code].alphabet;
      let random = alphabet[Math.floor(Math.random() * alphabet.length)];

      games[code].alphabet = alphabet.replace(random, '');
      games[code].letter = random;

      Object.values(games[code].players).forEach((player) => (player.isReady = false));

      io.to(code).emit('start', { game: games[code], code: code });
    }
  });

  socket.on('endround', (code) => {
    io.to(code).emit('endround', code); //TU SIĘ SKUPIĆ
  });

  socket.on('wordlist', ({ wordList, code }) => {
    games[code].checkDuplicatesCounter++;
    games[code].words[socket.id] = wordList;

    games[code].players[socket.id].words = wordList;

    wordList.forEach((word) => {
      if (word != '---') {
        games[code].players[socket.id].points += 10;
      }
    });

    if (games[code].checkDuplicatesCounter == Object.keys(games[code].players).length) {
      // sprawdzamy duplikaty, jeśli są wszystkie słowa
      games[code].checkDuplicatesCounter = 0;

      games[code].categories.forEach((el, i) => {
        let words = [];

        Object.values(games[code].words).forEach((el) => words.push(el[i]));

        const duplicates = words.getDuplicates();

        if (Object.keys(duplicates).length != 0 && !duplicates['---']) {
          Object.values(duplicates)[0].forEach((index) => {
            //moze to [0] zle
            games[code].players[Object.keys(games[code].players)[index]].points -= 5;
          });
        }
      });

      games[code].roundsCounter++;
      if (games[code].roundsCounter == games[code].rounds) {
        console.log('KONIEC GRY');
        Object.keys(games[code].players).forEach((player) => {
          games[code].players[player].words = null;
        });

        io.to(code).emit('endgame', { players: games[code].players, code: code });
      }

      io.to(code).emit('playerchange', games[code]);

      socket.on('deleteGame', () => {
        socket.leave(code);
        delete games[code];
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

Array.prototype.getDuplicates = function () {
  var duplicates = {};
  for (let i = 0; i < this.length; i++) {
    if (duplicates.hasOwnProperty(this[i])) {
      duplicates[this[i]].push(i);
    } else if (this.lastIndexOf(this[i]) !== i) {
      duplicates[this[i]] = [i];
    }
  }
  return duplicates;
};
