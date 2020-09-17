socket.emit('joinroom', location.pathname.substring(1));

const table = document.querySelector('.table');
const timerContainer = document.querySelector('.timer-container');

const playersList = document.querySelector('.players-list');
const players = document.querySelector('.players');
const joinAddress = document.querySelector('.join-address');
const info = document.querySelector('.info');

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

const doneBtn = document.querySelector('.done-btn');
const incorrectCode = document.querySelector('.incorrect');
const readyBtn = document.querySelector('.start-btn');

readyBtn.addEventListener('click', () => {
  readyBtn.textContent = 'Waiting for other players...';
  socket.emit('ready', location.pathname.substring(1));
});

const letter = document.querySelector('.letter');
const letterContainer = document.querySelector('.letter-container');

socket.on('start', ({ game, code }) => {
  readyBtn.classList.add('inactive');
  readyBtn.textContent = 'Press if ready';
  info.classList.remove('inactive');
  doneBtn.classList.remove('inactive');
  letterContainer.classList.remove('inactive');
  table.classList.remove('inactive');
  timer.classList.remove('inactive');

  info.innerHTML = `
      <h2>GAME INFO</h2>
      <ul>
        <li class="round">rounds: ${game.roundsCounter + 1}/${game.rounds}</li>  
        <li>round time: ${game.roundTime} seconds</li>  
        <li>max players: ${game.playersNumber}</li>
      </ul>`;

  const tbody = document.querySelector('.tbody');
  tbody.innerHTML += `<tr class="tr">
      <td class="td">${game.letter}</td>
      ${'<td class="td word" contenteditable></td>'.repeat(game.categories.length)}
    </tr>`;

  const startTimer = (duration, display, code) => {
    let time = duration;
    let minutes;
    let seconds;
    const timer = () => {
      minutes = parseInt(time / 60, 10);
      seconds = parseInt(time % 60, 10);

      minutes = minutes < 10 ? `0${minutes}` : minutes;
      seconds = seconds < 10 ? `0${seconds}` : seconds;

      display.textContent = `${minutes}:${seconds}`;

      if (--time < 0) {
        time = duration;
        socket.emit('endround', code);
      }
    };
    socket.on('endround', () => {
      clearInterval(interval);
    });
    const interval = setInterval(timer, 1000);
  };

  startTimer(game.roundTime, timer, code);
  letter.textContent = game.letter;

  doneBtn.addEventListener('click', () => {
    socket.emit('endround', code);
  });
});

const timer = document.querySelector('.timer');

socket.on('endround', (code) => {
  const words = document.querySelectorAll('.word');
  doneBtn.classList.add('inactive');
  let wordList = [];

  [...words].forEach((el) => {
    if (el.textContent != '' && el.textContent[0].toUpperCase() == letter.textContent) {
      wordList.push(el.textContent.toLowerCase());
    } else {
      wordList.push('---');
    }
  });

  if (wordList.length != 0) {
    socket.emit('wordlist', { code: code, wordList: wordList });
  }

  words.forEach((el) => {
    el.classList.remove('word');
    el.setAttribute('contenteditable', 'false');
  });

  socket.emit('playerchange', code);
  readyBtn.classList.remove('inactive');
});

socket.on('endgame', ({ players, code }) => {
  info.classList.remove('inactive');
  timerContainer.classList.add('inactive');
  table.classList.add('inactive');
  doneBtn.classList.add('inactive');
  joinAddress.classList.add('inactive');

  const points = [];

  Object.keys(players).forEach((el) => {
    points.push(players[el].points);
  });

  const winner = [];

  Object.keys(players).forEach((el) => {
    if (players[el].points == Math.max(...points)) {
      winner.push(el);
    }
  });

  const form = winner.length > 1 ? 'winners are' : 'winner is';

  info.textContent = `GAME ENDED! The ${form} ${winner}`;

  socket.emit('deleteGame', code);
});

const createTable = (cat) => {
  return `
  <thead>
  <tr>
    <th class="th">letter</th>
    ${cat.map((el) => `<th class="th">${el}</th>`).join('')}
  </tr>
  </thead>
  <tbody class="tbody">
  <tr class="tr">
  </tr>
  </tbody>
  `;
};
