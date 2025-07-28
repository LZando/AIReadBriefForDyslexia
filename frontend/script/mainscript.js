import * as modal from './modal.js';
import { initNavbar, handleNavbarClick } from './navbar.js';

window.addEventListener('load', () => {
  const waitForIcons = setInterval(() => {
    const bookIcon = document.getElementById('bookIcon');
    const clockIcon = document.getElementById('clockIcon');

    if (bookIcon && clockIcon) {
      initNavbar();

      bookIcon.addEventListener('click', () => handleNavbarClick('book'));
      clockIcon.addEventListener('click', () => handleNavbarClick('clock'));
      clearInterval(waitForIcons);
    }
  }, 100);
});