const socket = io();
const info = document.querySelector('.info');

socket.emit('joinroom', location.pathname.substring(1));

socket.on('prepareGame', ({ game, room }) => {
  password = room;
  info.classList.add('inactive');
  table.innerHTML = createTable(game.categories);
  joinAddress.innerText = `Join address: ${window.location.href}`;
  timerContainer.classList.remove('inactive');
  timer.textContent = `0${game['roundTime'] / 60}:00`;
});

socket.on('wrongRoom', () => {
  players.classList.add('inactive');
  info.classList.remove('inactive');
  info.textContent = 'Wrong address or game ended. Try another one or create a new room.';
});
//
socket.on('hasStarted', (game) => {
  table.innerHTML = createTable(game['categories']);

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
        <li class="round">rounds: ${game['roundsCounter'] + 1}/${game['rounds']}</li>  
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

  // startTimer(game['roundTime'], timer, password);
  letter.textContent = game.letter;
});
//
