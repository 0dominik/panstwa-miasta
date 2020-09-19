const socket = io();

const container = document.querySelector('.container');
const host = document.querySelector('.host');
let categories = [];
const checkbox = document.querySelectorAll('.checkbox');
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
    socket.emit('host', { categories: categories, playersNumber: maxPlayers.value, rounds: rounds.value, time: roundTime.value });
  }
});

socket.on('setcode', ({ code, id, roundTime }) => {
  if (id == socket.id) {
    window.history.pushState('', '', `/${code}`);
    players.classList.remove('inactive');
    joinAddress.innerText = `Join address: ${window.location.href}`;
    // timer.textContent = `0${roundTime / 60}:00`;
  }
});
