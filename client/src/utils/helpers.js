export const startTimer = (duration, display, code, socket) => {
  let time = duration;
  let minutes;
  let seconds;

  const timer = () => {
    minutes = parseInt(time / 60, 10);
    seconds = parseInt(time % 60, 10);

    seconds = seconds < 10 ? `0${seconds}` : seconds;

    display.textContent = `${minutes}:${seconds}`;

    if (--time < 0) {
      time = duration;
      clearInterval(interval);
      socket.emit('endRound', code);
    }
  };

  socket.on('getWords', () => {
    time = duration;
    clearInterval(interval);
  });
  const interval = setInterval(timer, 1000);
};

export const createTable = (game, socket) => {
  const html = `<tr class="tr">
  <td class="td-letter" rowspan="${Object.keys(game.players).length}">${game.letter}</td>
      ${Object.keys(game.words)
        .map((player) => {
          return `
        <td class="td">${player === socket.id ? `<b>${player}</>` : player}</td>
        ${game.words[player].map((word) => `<td class="td">${word ? word : '---'}</td>`).join('')}
      </tr>`;
        })
        .join('')}`;

  if (game.roundsCounter === 1) {
    return `
      <thead>
        <tr>
          <th class="th">letter</th>
          <th class="th">player</th>
          ${game.categories
            .map((category) => {
              return `<th class="th">${category}</th>`;
            })
            .join('')}
        </tr>
      </thead>
      <tbody class="tbody">
        ${html}
      </tbody>`;
  } else {
    return html;
  }
};
