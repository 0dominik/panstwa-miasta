const socket = io();
const info = document.querySelector('.info');
console.log('hi from joim.js');

socket.emit('joinroom', location.pathname.substring(1));
console.log('hi from join.js');

socket.on('prepareGame', ({ game, room }) => {
  password = room;
  info.classList.add('inactive');
  table.innerHTML = createTable(game.categories);
  timerContainer.classList.remove('inactive');
  timer.textContent = `0${game['roundTime'] / 60}:00`;
});

socket.on('wrongRoom', () => {
  players.classList.add('inactive');
  info.classList.remove('inactive');
  info.textContent = 'Wrong address. Try another or create a new room.';
});
