const inputs = document.querySelector('.inputs');
const table = document.querySelector('.table');
const timerContainer = document.querySelector('.timer-container');
const playersList = document.querySelector('.players-list');
const joinAddress = document.querySelector('.join-address');
const info = document.querySelector('.info');
const letter = document.querySelector('.letter');
const error = document.querySelector('.error');
const endBtn = document.querySelector('.end-btn');
const readyBtn = document.querySelector('.ready-btn');

socket.on('playerChange', (game) => {
  const players = game.players;

  playersList.innerHTML = `
      ${Object.keys(game.players)
        .map((el) => {
          const isReady = players[el].isReady ? 'READY' : '';

          if (el == socket.id) {
            return `<li class="points hl">[YOU]${players[el].name}: ${players[el].points} points ${isReady}</li>`;
          } else {
            return `<li class="points">${players[el].name}: ${players[el].points} points ${isReady}</li>`;
          }
        })
        .join('')}`;
});

readyBtn.addEventListener('click', () => {
  const code = location.pathname.substring(1);
  if (code) {
    readyBtn.textContent = 'Waiting for other players...';
    socket.emit('ready', location.pathname.substring(1));
  }
});

socket.on('start', ({ game, code }) => {
  readyBtn.classList.add('inactive');
  readyBtn.textContent = 'Press if ready';
  info.classList.remove('inactive');
  endBtn.classList.remove('inactive');
  inputs.classList.remove('inactive');

  const timer = document.querySelector('.timer');
  timer.classList.remove('inactive');

  info.innerHTML = `
      <h2>GAME INFO</h2>
      <ul>
        <li class="round">round: ${game.roundsCounter + 1}/${game.rounds}</li>  
        <li>round time: ${game.roundTime} seconds</li>  
        <li>players: ${game.playersNumber} </li>
      </ul>`;

  inputs.innerHTML = `
  ${game.categories
    .map(
      (cat) => `
        <div class="input-container">
          <label class="category-label" for="${cat}-category">${cat}: </label>
          <input id="${cat}-category" class="word-input" type="text" />
        </div>
      `
    )
    .join('')}`;

  endBtn.addEventListener('click', () => {
    let wordList = [];
    const words = document.querySelectorAll('.word-input');

    words.forEach((wordInput) => {
      const word = wordInput.value;
      if (word != '' && word[0].toUpperCase() == game.letter) {
        wordList.push(word.toLowerCase());
      }
    });

    if (wordList.length == game.categories.length) {
      socket.emit('endround', code);
    } else {
      error.classList.remove('inactive');
    }
  });

  const startTimer = (duration, display, code) => {
    let time = duration;
    let minutes;
    let seconds;

    const timer = () => {
      minutes = parseInt(time / 60, 10);
      seconds = parseInt(time % 60, 10);

      seconds = seconds < 10 ? `0${seconds}` : seconds;

      display.textContent = `${minutes}:${seconds}`;

      if (--time < 0) {
        time = duration;
        clearInterval(interval);
        socket.emit('endround', code);
      }
    };

    socket.on('getWords', () => {
      time = duration;
      clearInterval(interval);
    });
    const interval = setInterval(timer, 1000);
  };

  startTimer(game.roundTime, timer, code);
  letter.textContent = game.letter;
});

socket.on('getWords', (game) => {
  const [...words] = document.querySelectorAll('.word-input');
  words.length = game.categories.length;
  endBtn.classList.add('inactive');
  error.classList.add('inactive');
  let wordList = [];

  words.forEach((wordInput) => {
    const word = wordInput.value;
    if (word !== '' && word[0].toUpperCase() === game.letter) {
      wordList.push(word.toLowerCase());
    } else {
      wordList.push('---');
    }
  });

  if (wordList.length != 0) {
    socket.emit('wordlist', { code: game.id, wordList: wordList });
  }

  words.forEach((wordInput) => {
    wordInput.remove();
  });

  readyBtn.classList.remove('inactive');
});

socket.on('updateTable', (game) => {
  table.innerHTML += createTable(game);
});

socket.on('endgame', ({ players, code }) => {
  info.classList.remove('inactive');
  timerContainer.classList.add('inactive');
  inputs.classList.add('inactive');
  endBtn.classList.add('inactive');
  joinAddress.classList.add('inactive');

  const points = [];

  Object.keys(players).forEach((player) => {
    points.push(players[player].points);
  });

  const winner = [];

  Object.keys(players).forEach((player) => {
    if (players[player].points == Math.max(...points)) {
      winner.push(player);
    }
  });

  const form = winner.length > 1 ? 'winners are' : 'winner is';
  info.textContent = `GAME ENDED! The ${form} ${winner}`;

  socket.emit('deleteGame', code);
});

const createTable = (game) => {
  let html = `<tr class="tr">
  <td class="td-letter" rowspan="${Object.keys(game.players).length}">${game.letter}</td>
      ${Object.keys(game.words)
        .map((player) => {
          return `
        <td class="td">${player === socket.id ? `<b>${player}</>` : player}</td>
        ${game.words[player]
          .map((el, i) => {
            return `<td class="td">${game.words[player][i]}</td>`;
          })
          .join('')}
      </tr>`;
        })
        .join('')}`;

  if (game.roundsCounter === 1) {
    return `
      <thead>
      <tr>
        <th class="th">letter</th>
        <th class="th">player</th>
        ${game.categories
          .map((cat) => {
            return `<th class="th">${cat}</th>`;
          })
          .join('')}
      </tr>
    </thead>
    <tbody class="tbody">
      ${html}
    </tbody>`;
  } else {
    return html;
  }
};
