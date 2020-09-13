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
    //May be do some authorization

    if (games[room]) {
      socket.join(room);
      console.log(socket.id, 'joined', room);
      games[room]['words'][socket.id] = [];

      games[room]['players'][`${socket.id}`] = {
        points: 0,
        name: socket.id,
      };

      io.to(room).emit('playerchange', games[room]);

      console.log('games');
      console.dir(games, { depth: null });

      socket.emit('prepareGame', { game: games[room], room: room });

      socket.on('disconnect', () => {
        socket.leave(room);
        delete games[room]['words'][socket.id];
        delete games[room]['players'][socket.id];
        disconnect(socket, games[room]);
      });

      var kupa = Object.keys(io.sockets.adapter.rooms[room].sockets);
      console.log('room', kupa);
    } else {
      socket.emit('wrongRoom');
      console.log('there is no such a room');
    }
  });

  socket.on('host', ({ categories, maxPlayers, rounds, time }) => {
    // const password = Math.floor(Math.random() * 901 + 100);
    const password = 200;

    socket.join(password);
    games[password] = {
      id: password,
      categories: categories,
      players: {
        [socket.id]: {
          points: 0,
          name: socket.id + '[HOST]',
        },
      },
      words: { [socket.id]: [] },
      readyPlayers: [],
      maxPlayers: maxPlayers,
      rounds: rounds,
      roundsCounter: 0,
      roundTime: time,
    };

    console.dir(games, { depth: null });

    socket.emit('setcode', { password: password, id: socket.id, roundTime: games[password].roundTime });
    socket.emit('playerchange', games[password]);

    socket.on('disconnect', () => {
      socket.leave(password);
      delete games[password]['words'][socket.id];
      delete games[password]['players'][socket.id];
      disconnect(socket, games[password]);
    });
  });

  socket.on('ready', ({ id, password }) => {
    console.log('this player is ready', id);
    const readyPlayers = games[password]['readyPlayers'];

    if (!readyPlayers.includes(id)) {
      readyPlayers.push(id);
    }
    console.log('readyPlayers', readyPlayers);

    if (readyPlayers.length == games[password]['maxPlayers']) {
      const alphabet = 'ABCDEFGHIJKLMNOPRSTUWZ';
      let r = alphabet[Math.floor(Math.random() * alphabet.length)];

      games[password]['letter'] = r;

      games[password]['readyPlayers'] = [];
      io.to(password).emit('start', { game: games[password], password: password }); // ewentualnie ify dodac u klienta
    }
  });

  socket.on('endround', (code) => {
    io.to(code).emit('endround'); //TU SIĘ SKUPIĆ
    console.log('socket.roms', socket.rooms);
  });

  socket.on('wordlist', ({ wordList, password }) => {
    console.log('wordlist', wordList);
    games[password]['words'][socket.id] = wordList;

    wordList.forEach((word) => {
      if (word != '---') {
        games[password]['players'][socket.id]['points'] += 10;
      }
    });

    const lengths = Object.values(games[password]['words']).filter((el) => Object.keys(el).length != 0).length;

    console.log('lengths', lengths);
    if (lengths == Object.keys(games[password]['players']).length) {
      console.log('spelniony if');
      //
      games[password]['categories'].forEach((el, i) => {
        let words = [];

        Object.values(games[password]['words']).forEach((el) => words.push(el[i]));

        const duplicates = words.getDuplicates();

        if (Object.keys(duplicates).length != 0 && !duplicates['---']) {
          Object.values(duplicates)[0].forEach((index) => {
            //moze to [0] zle
            games[password]['players'][Object.keys(games[password]['players'])[index]]['points'] -= 5;
          });
        }
      });
      //

      //to na dole bylo nizej jak cos
      io.to(password).emit('playerchange', games[password]);

      games[password]['roundsCounter']++;
      if (games[password]['roundsCounter'] == games[password]['rounds']) {
        console.log('KONIEC GRY');
        io.to(password).emit('endgame', games[password]['players']);
        io.to(password).emit('deleteGame', password);
      }

      socket.on('deleteGame', () => {
        socket.leave(password);
        delete games[password];
      });
    }

    console.log('games');
    console.dir(games, { depth: null });
  });
});

const disconnect = (socket, game) => {
  if (Object.keys(game['players']).length === 1) {
    delete game;
  } else {
    delete game['players'][socket.id];

    const readyPlayers = game['readyPlayers'];
    if (readyPlayers.includes(socket.id)) {
      //tu zmiana (prztestowac)
      readyPlayers.splice(readyPlayers.indexOf(socket.id, 1));
    }
    io.to(game['id']).emit('playerchange', game);
  }
  console.log('usunieto', socket.id);
  console.log('games:');
  console.dir(games, { depth: null });
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
