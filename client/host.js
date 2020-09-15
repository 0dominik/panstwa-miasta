const socket = io();

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

  if (categories.length < 2 || rounds.value < 1 || rounds.value > 10) {
    info.textContent = 'Select at least 2 categories and enter number of rounds between 1 and 10!';
    info.classList.remove('inactive');
    categories = [];
  } else {
    info.textContent = 'Wait for other players...';
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
    joinAddress.innerText = `Join address: ${window.location.href}`;
    password = data.password;
    timer.textContent = `0${data.roundTime / 60}:00`;
  }
});
