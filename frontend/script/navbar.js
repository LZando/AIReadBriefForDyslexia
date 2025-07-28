let elements = {};

const navbarState = {
  book: {
    isActive: false,
    toggle() { this.isActive = !this.isActive; },
  },
  clock: {
    isActive: false,
    toggle() { this.isActive = !this.isActive; },
  }
};

export function initNavbar() {
  elements = {
    bookIcon: document.getElementById('bookIcon'),
    clockIcon: document.getElementById('clockIcon'),
    booknavbar: document.getElementsByClassName('navbartitles')[0],
    clocknavbar: document.getElementsByClassName('progress-tracker')[0]
  };

  updateUI('book');
  updateUI('clock');
}

export function handleNavbarClick(type) {
  if (navbarState[type]) {
    navbarState[type].toggle();
    updateUI(type);
  }
}

function updateUI(type) {
  const state = navbarState[type];

  if (type === 'book') {
    const { bookIcon, booknavbar } = elements;

    if (state.isActive) {
      bookIcon?.classList.add('deactive');
      booknavbar?.classList.add('hidden');
    } else {
      bookIcon?.classList.remove('deactive');
      booknavbar?.classList.remove('hidden');
    }
  } else if (type === 'clock') {
    const { clockIcon, clocknavbar } = elements;

    if (state.isActive) {
      clockIcon?.classList.add('deactive');
      clocknavbar?.classList.add('hidden');
    } else {
      clockIcon?.classList.remove('deactive');
      clocknavbar?.classList.remove('hidden');
    }
  }
}