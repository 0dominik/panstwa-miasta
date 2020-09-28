socket.emit('joinroom', location.pathname.substring(1));

socket.on('prepareGame', () => {
  playersContainer.classList.remove('inactive');

  info.classList.add('inactive');
  joinAddress.innerText = `Join address: ${window.location.href}`;
  timerContainer.classList.remove('inactive');
  container.classList.add('inactive');
});

socket.on('wrongRoom', () => {
  playersContainer.classList.add('inactive');
  info.classList.remove('inactive');
  info.textContent = 'Wrong address, game ended or the room is full. Try another one or create a new room.';
  container.classList.add('inactive');
});
