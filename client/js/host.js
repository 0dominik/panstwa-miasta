const socket = io();

const container = document.querySelector('.host-container');
const host = document.querySelector('.host');
let categories = [];
const checkboxes = document.querySelectorAll('.checkbox');
const playersNumber = document.querySelector('.players-number');
const roundsNumber = document.querySelector('.round-input');
const roundTime = document.querySelector('.round-time');
const playersContainer = document.querySelector('.players');

host.addEventListener('click', () => {
  checkboxes.forEach((checkbox) => {
    return checkbox.checked ? categories.push(checkbox.id) : null;
  });

  if (categories.length < 2 || roundsNumber.value < 1 || roundsNumber.value > 10) {
    info.textContent = 'Select at least 2 categories and enter number of rounds between 1 and 10!';
    info.classList.remove('inactive');
    categories = [];
  } else {
    info.textContent = 'Wait for other players...';
    container.classList.add('inactive');
    timerContainer.classList.remove('inactive');
    timerContainer.classList.remove('inactive');
    socket.emit('host', { categories: categories, playersNumber: playersNumber.value, rounds: roundsNumber.value, time: roundTime.value });
  }
});

socket.on('setcode', ({ code, id, roundTime }) => {
  if (id == socket.id) {
    window.history.pushState('', '', `/${code}`);
    playersContainer.classList.remove('inactive');
    joinAddress.innerText = `Join address: ${window.location.href}`;
  }
});
