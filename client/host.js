const socket = io();
console.log('hi from host.js');

const container = document.querySelector('.container');
const host = document.querySelector('.host');
let categories = [];
const checkbox = document.querySelectorAll('.checkbox');
const info = document.querySelector('.info');
const maxPlayers = document.querySelector('.players-number');
const rounds = document.querySelector('.round-input');
const roundTime = document.querySelector('.round-time');

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
    timerContainer.classList.remove('inactive');
    table.innerHTML = createTable(categories);
    socket.emit('host', { categories: categories, maxPlayers: maxPlayers.value, rounds: rounds.value, time: roundTime.value });
  }
});

socket.on('setcode', (data) => {
  if (data.id == socket.id) {
    window.history.pushState('', '', `/${data.password}`);
    const players = document.querySelector('.players');
    players.classList.remove('inactive');
    joinCodeEl.innerText = `Join code: ${data.password}`;
    password = data.password;
    timer.textContent = `0${data.roundTime / 60}:00`;
  }
});
