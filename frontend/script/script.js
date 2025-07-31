class NavBar {
  constructor() {
    this.stateLibrary = false;
    this.stateChapter = false;

    this.menuLibrary = document.getElementById('navbar-library');
    this.toggleLibrary = document.getElementById('library-menu-button');

    this.menuChapters = document.getElementById('navbar-chapters');
    this.toggleChapters = document.getElementById('chapter-menu-button');

    this.toggleLibraryMenu = this.toggleLibraryMenu.bind(this);
    this.toggleChaptersMenu = this.toggleChaptersMenu.bind(this);

    this.toggleLibrary.addEventListener('click', this.toggleLibraryMenu);
    this.toggleChapters.addEventListener('click', this.toggleChaptersMenu);
  }

  toggleLibraryMenu() {
    this.stateLibrary = !this.stateLibrary;
    this.toggleLibrary.classList.toggle("active");
    this.menuLibrary.classList.toggle('collapsed');
  }

  toggleChaptersMenu() {
    this.stateChapter = !this.stateChapter;
    this.toggleChapters.classList.toggle("active");
    this.menuChapters.classList.toggle('collapsed');
  }
}

const navbar = new NavBar();


class LibraryModal {
    constructor() {
        this.modal = document.getElementById('add-library-modal');
        this.addButton = document.querySelector('.navbar-library > div:last-child p');
        this.closeButton = document.querySelector('.close');
        this.cancelButton = document.getElementById('cancel-btn');
        this.form = document.getElementById('add-library-form');
        
        this.init();
    }

    init() {
        this.addButton.addEventListener('click', () => this.openModal());
        this.closeButton.addEventListener('click', () => this.closeModal());
        this.cancelButton.addEventListener('click', () => this.closeModal());

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.modal.style.display = 'block';
        document.getElementById('title').focus();
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.form.reset();
        document.body.style.overflow = 'auto';
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const title = formData.get('title');
        const author = formData.get('author');
        const pdfFile = formData.get('pdf-file');
        
        // Validate required field
        if (!title.trim()) {
            alert('Il titolo è obbligatorio!');
            return;
        }
        
        // Create library item
        const libraryItem = {
            title: title.trim(),
            author: author.trim() || 'Autore sconosciuto',
            pdfFile: pdfFile,
            dateAdded: new Date().toLocaleDateString('it-IT')
        };
        
        // Add to library container
        this.addToLibrary(libraryItem);
        
        // Close modal
        this.closeModal();
        
        // Show success message
        this.showSuccessMessage('Library aggiunta con successo!');
    }

    addToLibrary(libraryItem) {
        const libraryContainer = document.getElementById('library-container');
        
        const libraryElement = document.createElement('div');
        libraryElement.className = 'library-item';
        libraryElement.innerHTML = `
            <div class="library-item-content">
                <h4>${libraryItem.title}</h4>
                <p>${libraryItem.author}</p>
                <small>${libraryItem.dateAdded}</small>
            </div>
        `;
        
        libraryContainer.appendChild(libraryElement);
    }

    showSuccessMessage(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
        `;
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// Initialize modal
const libraryModal = new LibraryModal();
