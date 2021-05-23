const container = document.querySelector('.host-container');
const hostBtn = document.querySelector('.host');
const categoryInput = document.querySelector('.custom-category');
const categoryBtn = document.querySelector('.add-category');
const categoriesContainer = document.querySelector('.categories');
const playersNumber = document.querySelector('.players-number');
const roundsNumber = document.querySelector('.round-input');
const roundTime = document.querySelector('.round-time');
const playersContainer = document.querySelector('.players');
const info = document.querySelector('.info');
const timerContainer = document.querySelector('.timer-container');
const joinAddress = document.querySelector('.join-address');

export const host = (socket) => {
  categoryBtn.addEventListener('click', () => {
    const category = categoryInput.value.trim();

    if (category.length > 0 && category.length < 30) {
      categoriesContainer.insertAdjacentHTML(
        'beforeend',
        `<input type="checkbox" id="${category}" class="checkbox" />
        <label class="checkbox-label" for="${category}"> ${category} </label>`,
      );

      categoryInput.value = '';
    } else {
      alert('Category should be between 0 and 30 characters');
    }
  });

  hostBtn.addEventListener('click', () => {
    const checkboxes = [...document.querySelectorAll('.checkbox')];

    const categoriesWithDuplicates = checkboxes.flatMap((checkbox) => {
      if (checkbox.checked) {
        return checkbox.id.toLowerCase();
      } else return [];
    });

    const categories = [...new Set(categoriesWithDuplicates)];

    if (categories.length < 2 || roundsNumber.value < 1 || roundsNumber.value > 10) {
      alert('Select at least 2 different categories and enter number of rounds between 1 and 10!');
    } else {
      info.textContent = 'Wait for other players...';
      container.classList.add('inactive');
      timerContainer.classList.remove('inactive');
      socket.emit('host', { categories, playersNumber: parseInt(playersNumber.value), rounds: parseInt(roundsNumber.value), time: roundTime.value });
    }
  });

  socket.on('setCode', ({ code, id }) => {
    if (id === socket.id) {
      history.pushState(null, '', `/${code}`);
      playersContainer.classList.remove('inactive');
      joinAddress.innerText = `Join address: ${window.location.href}`;
    }
  });
};
