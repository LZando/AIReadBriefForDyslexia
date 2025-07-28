window.addEventListener('DOMContentLoaded', () => {
  fetch('modal_add_book.html')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return res.text();
    })
    .then(html => {
      const container = document.getElementById('modal-container');
      if (!container) throw new Error('Modal container not found.');
      container.innerHTML = html;
      setupModalEvents();
    })
    .catch(err => {
      console.error('Errore nel caricamento della modale:', err);
    });
});

function openModal() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.style.display = 'flex';
    modal.querySelector('#bookName')?.focus();
  }
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.style.display = 'none';
    modal.querySelector('form')?.reset();
  }
}

function setupModalEvents() {
  const form = document.getElementById('uploadForm');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const titleInput = document.getElementById('bookName');
    const authorInput = document.getElementById('authorName');
    const fileInput = document.getElementById('fileInput');

    const title = titleInput?.value.trim();
    const author = authorInput?.value.trim();
    const file = fileInput?.files[0];

    if (!title) {
      alert('Title missing.');
      titleInput?.focus();
      return;
    }

    if (!file) {
      alert('File missing.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author || '');
    formData.append('file', file);

    try {
      const res = await fetch('/api/add-book', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert('Book uploaded!');
        closeModal();
      } else {
        alert(`Errore: ${data.error || 'Error.'}`);
      }
    } catch (err) {
      console.error('Error', err);
      alert('Error');
    }
  });
}
