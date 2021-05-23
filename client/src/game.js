import { startTimer, createTable } from './utils/helpers';

const info = document.querySelector('.info');
const playersContainer = document.querySelector('.players');
const inputs = document.querySelector('.inputs');
const table = document.querySelector('.table');
const timerContainer = document.querySelector('.timer-container');
const playersList = document.querySelector('.players-list');
const joinAddress = document.querySelector('.join-address');
const letter = document.querySelector('.letter');
const error = document.querySelector('.error');
const endBtn = document.querySelector('.end-btn');
const readyBtn = document.querySelector('.ready-btn');
const game = document.querySelector('.game');
const timer = document.querySelector('.timer');

export const startGame = (socket) => {
  socket.on('prepareGame', () => {
    playersContainer.classList.remove('inactive');

    joinAddress.innerText = `Join address: ${window.location.href}`;
    timerContainer.classList.remove('inactive');
  });

  socket.on('wrongRoom', () => {
    info.classList.remove('inactive');
    info.textContent = 'Wrong address, game ended or the room is full. Try another one or create a new room.';
  });

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
      socket.emit('ready', code);
    }
  });

  socket.on('start', ({ game, code }) => {
    readyBtn.classList.add('inactive');
    readyBtn.textContent = 'Press if ready';
    info.classList.remove('inactive');
    endBtn.classList.remove('inactive');
    inputs.classList.remove('inactive');

    timer.classList.remove('inactive');

    info.innerHTML = `
        <h2>GAME INFO</h2>
        <ul>
          <li class="round">round: ${game.roundsCounter + 1}/${game.rounds}</li>
          <li>round time: ${game.roundTime} seconds</li>
          <li>players: ${game.playersNumber}</li>
          <li>categories: ${game.categories.join(', ')}</li>
        </ul>`;

    inputs.innerHTML = `
    ${game.categories
      .map(
        (cat) => `
          <div class="input-container">
            <label class="category-label" for="${cat}-category">${cat}: </label>
            <input id="${cat}-category" class="word-input" type="text" />
          </div>
        `,
      )
      .join('')}`;

    const wordInputs = document.querySelectorAll('.word-input');

    wordInputs.forEach((wordInput) => {
      wordInput.addEventListener('input', (e) => {
        const { value } = e.target;
        if (value.length > 0 && value[0].toUpperCase() !== game.letter) {
          error.classList.remove('inactive');
          error.textContent = `Enter name beginning with ${game.letter}`;
        } else {
          error.classList.add('inactive');
        }
      });
    });

    endBtn.addEventListener('click', () => {
      const wordList = [...wordInputs].filter((wordInput) => {
        const word = wordInput.value.trim();

        if (word.length > 0 && word[0].toUpperCase() === game.letter) {
          return true;
        }
      });

      if (wordList.length == game.categories.length) {
        socket.emit('endRound', code);
      } else {
        error.classList.remove('inactive');
        error.textContent = `You have to correctly fill in all inputs to finish
        round before time!`;
      }
    });

    startTimer(game.roundTime, timer, code, socket);
    letter.textContent = game.letter;
  });

  socket.on('getWords', (game) => {
    const words = [...document.querySelectorAll('.word-input')];

    endBtn.classList.add('inactive');
    endBtn.classList.disabled = true;
    error.classList.add('inactive');
    timer.textContent = '00:00';

    const wordList = words.map((wordInput) => {
      const word = wordInput.value;

      if (word !== '' && word[0].toUpperCase() === game.letter) {
        return word.toLowerCase();
      }
    });

    if (wordList.length != 0) {
      socket.emit('wordlist', { code: game.id, wordList: wordList });
    }

    words.forEach((wordInput) => {
      wordInput.disabled = true;
    });

    readyBtn.classList.remove('inactive');
  });

  socket.on('updateTable', (game) => {
    table.innerHTML += createTable(game, socket);
  });

  socket.on('endgame', ({ players, code }) => {
    info.classList.remove('inactive');
    timerContainer.classList.add('inactive');
    inputs.classList.add('inactive');
    endBtn.classList.add('inactive');
    joinAddress.classList.add('inactive');

    const points = Object.values(players).map((player) => {
      return player.points;
    });

    const winner = Object.values(players)
      .filter((player) => player.points === Math.max(...points))
      .map((player) => player.name);

    const form = winner.length > 1 ? 'winners are' : 'winner is';
    info.textContent = `GAME ENDED! The ${form} ${winner}`;

    socket.emit('deleteGame', code);
  });

  socket.on('hostAbandon', () => {
    game.classList.add('inactive');
    error.textContent = 'The host abandoned the room.';
    error.classList.remove('inactive');
  });
};
