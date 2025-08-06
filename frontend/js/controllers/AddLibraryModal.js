import APIClient from '../utils/api.js';
import notifications from '../utils/notifications.js';
import { DOMHelpers } from '../utils/domHelpers.js';

export class AddLibraryModal {
  constructor() {
    this.modal = DOMHelpers.getElementById('add-library-modal');
    this.addButton = DOMHelpers.querySelector('.navbar-library > div:last-child p');
    this.closeButton = DOMHelpers.querySelector('#add-library-modal span');
    this.cancelButton = DOMHelpers.getElementById('cancel-btn');
    this.form = DOMHelpers.getElementById('add-library-form');

    this.init();
  }

  init() {
    if (this.addButton) {
      this.addButton.addEventListener('click', () => this.handleAddButtonClick());
    }
    
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => this.closeModal());
    }
    
    if (this.cancelButton) {
      this.cancelButton.addEventListener('click', () => this.closeModal());
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.closeModal();
        }
      });
    }

    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.closeModal();
      }
    });


  }
  
  isOpen() {
    return this.modal && !DOMHelpers.hasClass(this.modal, 'hidden') && this.modal.style.display === 'flex';
  }

  openModal() {
    if (this.modal) {
      DOMHelpers.removeClass(this.modal, 'hidden');
      this.modal.style.display = 'flex';

      const titleInput = DOMHelpers.getElementById('title');
      if (titleInput) {
        titleInput.focus();
      }
      
      DOMHelpers.preventBodyScroll();
    }
  }

  closeModal() {
    if (this.modal) {
      DOMHelpers.addClass(this.modal, 'hidden');
      this.modal.style.display = 'none';
      
      if (this.form) {
        this.form.reset();
      }
      
      DOMHelpers.allowBodyScroll();
    }
  }

  async handleAddButtonClick() {
    try {
      await this.cleanWorkspace();
      this.openModal();
    } catch (error) {
      console.error('Failed to clean workspace:', error);
      notifications.warning('Warning: Could not clean workspace');
      this.openModal();
    }
  }

  async cleanWorkspace() {
    try {
      const response = await fetch('/api/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        console.log('Workspace cleaned successfully');
      } else {
        console.error('Failed to clean workspace:', data.error);
      }
    } catch (error) {
      console.error('Error cleaning workspace:', error);
      throw error;
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const formData = DOMHelpers.getFormData(this.form);
    const { title, author } = formData;
    const bookFile = this.form.elements['pdf-file'].files[0];

    if (!title || !title.trim()) {
      notifications.error('Title is required.');
      return;
    }

    if (!bookFile || bookFile.size === 0) {
      notifications.error('Please upload a PDF or EPUB file.');
      return;
    }

    const allowedTypes = ['application/pdf', 'application/epub+zip'];
    if (!allowedTypes.includes(bookFile.type)) {
      notifications.error('Only PDF or EPUB files are allowed.');
      return;
    }

    const submitBtn = this.form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner mr-2"></span>Uploading...';

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('title', title.trim());
      uploadFormData.append('author', (author || '').trim() || 'Unknown Author');
      uploadFormData.append('book-file', bookFile);

      const data = await APIClient.uploadBook(uploadFormData);

      if (data.success) {
        this.closeModal();
        notifications.success(`Book "${title}" uploaded successfully!`);

     if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    window.showChapterModal(data.bookname);


      } else {
        throw new Error(data.error || 'Book upload failed.');
      }

    } catch (error) {
      console.error('Upload error:', error);
      notifications.error(`Upload failed: ${error.message}`);
    } finally {
      // Reset button state
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }

  addBook() {
    this.handleAddButtonClick();
  }
}