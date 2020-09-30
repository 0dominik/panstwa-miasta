const table = document.querySelector('.table');
const timerContainer = document.querySelector('.timer-container');
const playersList = document.querySelector('.players-list');
const joinAddress = document.querySelector('.join-address');
const info = document.querySelector('.info');
const letter = document.querySelector('.letter');
const error = document.querySelector('.error');
const endBtn = document.querySelector('.end-btn');
const readyBtn = document.querySelector('.ready-btn');

socket.on('playerchange', (game) => {
  const players = game.players;

  playersList.innerHTML = `
      ${Object.keys(game.players)
        .map((el) => {
          const isReady = players[el].isReady ? 'READY' : '';
          const words = players[el].words ? `, last words: ${players[el].words}` : '';

          if (el == socket.id) {
            return `<li class="points hl">[YOU]${players[el].name}: ${players[el].points} points${words} ${isReady}</li>`;
          } else {
            return `<li class="points">${players[el].name}: ${players[el].points} points${words} ${isReady}</li>`;
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
  table.classList.remove('inactive');

  const timer = document.querySelector('.timer');
  timer.classList.remove('inactive');

  info.innerHTML = `
      <h2>GAME INFO</h2>
      <ul>
        <li class="round">rounds: ${game.roundsCounter + 1}/${game.rounds}</li>  
        <li>round time: ${game.roundTime} seconds</li>  
        <li>players: ${game.playersNumber} </li>
      </ul>`;

  table.innerHTML += createTable(game.categories, game.letter, game.roundsCounter);

  endBtn.addEventListener('click', () => {
    let wordList = [];
    const words = document.querySelectorAll('.word-input');

    words.forEach((wordInput) => {
      const word = wordInput.value;
      console.log('word', word);
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
  const words = document.querySelectorAll('.word-input');
  words.length = game.categories.length;
  endBtn.classList.add('inactive');
  error.classList.add('inactive');
  let wordList = [];

  words.forEach((wordInput) => {
    const word = wordInput.value;
    if (word != '' && word[0].toUpperCase() == game.letter) {
      wordList.push(word.toLowerCase());
    } else {
      wordList.push('---');
    }
  });

  if (wordList.length != 0) {
    socket.emit('wordlist', { code: game.id, wordList: wordList });
  }

  //remove inputs and put its value to table
  words.forEach((wordInput) => {
    wordInput.parentNode.textContent = wordInput.value;
    wordInput.remove();
  });

  socket.emit('playerchange', game.id);
  readyBtn.classList.remove('inactive');
});

socket.on('endgame', ({ players, code }) => {
  info.classList.remove('inactive');
  timerContainer.classList.add('inactive');
  table.classList.add('inactive');
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

const createTable = (cat, letter, round) => {
  if (round === 0) {
    return `
      <div class="row">
        <div class="cell">
          <span class="category-label">letter</span>
          <div class="input-container">${letter}</div>
        </div>
        ${cat
          .map(
            (el) => `
        <div class="cell">
          <label class="category-label" for="${el}-category">${el}</label>
          <div class="input-container">
            <input id="${el}-category" class="word-input" type="text" />
          </div>
        </div>`
          )
          .join('')}
      </div>`;
  } else {
    return `
      <div class="row">
        <div class="cell">
          <div class="input-container">${letter}</div>
        </div>
        ${cat
          .map(
            (el) => `
        <div class="cell">
          <div class="input-container">
            <input id="${el}-category" class="word-input" type="text" />
          </div>
        </div>
        `
          )
          .join('')}
      </div>`;
  }
};
