const socket = io();

const container = document.querySelector('.container');
const host = document.querySelector('.host');
let categories = [];
const checkbox = document.querySelectorAll('.checkbox');
const table = document.querySelector('.table');
const timerContainer = document.querySelector('.timer-container');
const info = document.querySelector('.info');
const maxPlayers = document.querySelector('.players-number');
const rounds = document.querySelector('.round-input');
const roundTime = document.querySelector('.round-time');

let password = '';

host.addEventListener('click', (e) => {
  checkbox.forEach((el) => {
    return el.checked ? categories.push(el.id) : null;
  });

  if (categories.length < 2 || rounds.value < 1) {
    info.textContent = 'Select at least 2 categories and enter number of rounds!';
    info.classList.remove('inactive');
    categories = [];
  } else {
    info.classList.add('inactive');
    container.classList.add('inactive');
    timerContainer.classList.remove('inactive');
    table.innerHTML = createTable(categories);
    socket.emit('host', { categories: categories, maxPlayers: maxPlayers.value, rounds: rounds.value, time: roundTime.value });
  }
});

const playersList = document.querySelector('.players-list');
const joinCodeEl = document.querySelector('.join-code');

socket.on('setcode', (data) => {
  if (data.id == socket.id) {
    window.history.pushState('', '', `/${data.password}`);
    joinCodeEl.innerText = `Join code: ${data.password}`;
    password = data.password;
  }
});

socket.on('playerchange', (game) => {
  playersList.innerHTML = `
      ${Object.keys(game.words)
        .map((el) => {
          if (game.words[el].length != 0) {
            if (el == socket.id) {
              return `<li class="points hl">[YOU]${game['players'][el]['name']}: ${game['players'][el]['points']} points, last words: ${game.words[el]}</li>`;
            } else {
              return `<li class="points">${game['players'][el]['name']}: ${game['players'][el]['points']} points, last words: ${game.words[el]}</li>`;
            }
          } else {
            if (el == socket.id) {
              return `<li class="points hl">[YOU]${game['players'][el]['name']}: ${game['players'][el]['points']} points</li>`;
            } else {
              return `<li class="points">${game['players'][el]['name']}: ${game['players'][el]['points']} points</li>`;
            }
          }
        })
        .join('')}`;
});

socket.on('correctpass', (data) => {
  info.classList.add('inactive');
  table.innerHTML = createTable(data);
  container.classList.add('inactive');
  timerContainer.classList.remove('inactive');
});

const incorrectCode = document.querySelector('.incorrect');
const readyBtn = document.querySelector('.start-btn');

readyBtn.addEventListener('click', () => {
  readyBtn.textContent = 'Waiting for other players...';
  socket.emit('ready', { password: password, id: socket.id });
});

const doneBtn = document.querySelector('.done-btn');
const letter = document.querySelector('.letter');
const letterContainer = document.querySelector('.letter-container');

socket.on('start', ({ game, password }) => {
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
        <li class="round">rounds: ${game['currentRound']}/${game['rounds']}</li>  
        <li>round time: ${game['roundTime']} seconds</li>  
        <li>password: ${game['id']}</li>  
        <li>max players: ${game['maxPlayers']}</li>
        <li>After every round you can mark other player's word as a wrong</li>  
      </ul>`;

  const tbody = document.querySelector('.tbody');
  tbody.innerHTML += `<tr class="tr">
      <td>${game.letter}</td>
      ${'<td class="word" contenteditable></td>'.repeat(game['categories'].length)}
    </tr>`;

  startTimer(game['roundTime'], timer, password);
  letter.textContent = game.letter;
});

const timer = document.querySelector('.timer');

const startTimer = (duration, display, password) => {
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
      socket.emit('endround', password);
    }
  };

  socket.on('endround', () => {
    clearInterval(interval);
  });
  const interval = setInterval(timer, 1000);
};

doneBtn.addEventListener('click', () => {
  socket.emit('endround', password);
});

socket.on('endround', () => {
  const words = document.querySelectorAll('.word');
  let wordList = [];

  words.forEach((el) => {
    if (el.textContent != '' && el.textContent[0].toUpperCase() == letter.textContent) {
      wordList.push(el.textContent.toLowerCase());
    } else {
      wordList.push('---');
    }
  });

  if (wordList.length != 0) {
    socket.emit('wordlist', { password: password, wordList: wordList });
  }

  words.forEach((el) => {
    el.classList.remove('word');
    el.setAttribute('contenteditable', 'false');
  });

  socket.emit('playerchange', password);
  readyBtn.classList.remove('inactive');
});

socket.on('updatePoints', (data) => {
  const points = document.querySelectorAll('.points-number');
  Object.keys(data).forEach((el, i) => {
    points[i].textContent = data[el]['points'];
  });
});

socket.on('endgame', (data) => {
  info.classList.remove('inactive');
  timer.classList.add('inactive');
  letterContainer.classList.add('inactive');
  readyBtn.classList.add('inactive');
  table.classList.add('inactive');
  doneBtn.classList.add('inactive');
  joinCodeEl.classList.add('inactive');

  const points = [];

  playersList.innerHTML = `
  ${Object.keys(data)
    .map((el) => {
      points.push(data[el]['points']);
      return `<li class="points">${data[el]['name']}: ${data[el]['points']} points</li>`;
    })
    .join('')}`;

  const winner = [];

  Object.keys(data).forEach((el) => {
    if (data[el]['points'] == Math.max(...points)) {
      winner.push(el);
    }
  });

  const form = winner.length > 1 ? 'winners are' : 'winner is';

  info.textContent = `GAME ENDED! The ${form} ${winner}`;
});

socket.on('deleteGame', (password) => {
  socket.emit('deleteGame', password);
});

const createTable = (cat) => {
  return `
  <thead>
  <tr>
    <th>letter</th>
    ${cat.map((el) => `<th>${el}</th>`).join('')}
  </tr>
  </thead>
  <tbody class="tbody">
  <tr class="tr">    
  </tr>
  </tbody>
  `;
};
