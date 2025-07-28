window.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("navbar");
  const res = await fetch("components/navbar.html");
  const html = await res.text();
  container.innerHTML = html;
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
