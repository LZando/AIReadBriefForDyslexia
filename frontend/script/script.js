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

class AddLibraryModal {
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

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.modal.style.display = 'block';
        document.getElementById('title').focus();
        document.body.style.overflow = 'hidden';
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

        if (!title.trim()) {
            alert('Il titolo è obbligatorio!');
            return;
        }

        const libraryItem = {
            title: title.trim(),
            author: author.trim() || 'Autore sconosciuto',
            pdfFile: pdfFile,
            dateAdded: new Date().toLocaleDateString('it-IT')
        };

        this.closeModal();

        // Show success message
        this.showSuccessMessage('Library aggiunta con successo!');
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

const libraryModal = new AddLibraryModal();

class ChapterPageController {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 24; // Default value
        this.bookname = 'alan'; // Default bookname
        
        this.init();
    }

    init() {
        this.removeEventListeners();
        
        // Find elements with updated selectors
        this.prevBtn = document.querySelector('.chapter-page-selector .prev-btn');
        this.nextBtn = document.querySelector('.chapter-page-selector .next-btn');
        this.pageSlider = document.querySelector('.chapter-page-selector .page-slider');
        this.pageInput = document.querySelector('#page-number input[type="number"]');
        this.pageImage = document.querySelector('.chapter-page-immagine img');
        this.pageConfirmBtn = document.getElementById("confirm-page-btn");

        if (this.pageSlider) {
            this.pageSlider.min = 1;
            this.pageSlider.max = this.totalPages;
            this.pageSlider.value = this.currentPage;
        }

        if (this.pageInput) {
            this.pageInput.min = 1;
            this.pageInput.max = this.totalPages;
            this.pageInput.value = this.currentPage;
            this.pageInput.step = 1;

            this.pageInput.addEventListener('keydown', (e) => {
                // Allow: backspace, delete, tab, escape, enter, home, end, left, right
                if ([8, 9, 27, 13, 35, 36, 37, 39, 46].indexOf(e.keyCode) !== -1 ||
                    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
                    (e.ctrlKey && [65, 67, 86, 88, 90].indexOf(e.keyCode) !== -1)) {
                    return; // let it happen, don't do anything
                }
                // Ensure that it is a number and stop the keypress
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                }
            });
        }

        this.updateDisplay();
        this.addEventListeners();
    }

    removeEventListeners() {
        // Remove existing listeners to prevent duplicates
        if (this.prevBtn && this.prevClickHandler) {
            this.prevBtn.removeEventListener('click', this.prevClickHandler);
        }
        if (this.nextBtn && this.nextClickHandler) {
            this.nextBtn.removeEventListener('click', this.nextClickHandler);
        }
        if (this.pageSlider && this.sliderInputHandler) {
            this.pageSlider.removeEventListener('input', this.sliderInputHandler);
        }
        if (this.pageInput) {
            if (this.inputHandler) {
                this.pageInput.removeEventListener('input', this.inputHandler);
            }
            if (this.inputChangeHandler) {
                this.pageInput.removeEventListener('change', this.inputChangeHandler);
            }
            if (this.inputBlurHandler) {
                this.pageInput.removeEventListener('blur', this.inputBlurHandler);
            }
        }
    }

    addEventListeners() {
        this.prevClickHandler = () => this.previousPage();
        this.nextClickHandler = () => this.nextPage();
        this.sliderInputHandler = (e) => this.setPage(parseInt(e.target.value));
        this.inputHandler = (e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value)) {
                this.setPage(value);
            }
        };
        this.inputChangeHandler = (e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value)) {
                this.setPage(value);
            } else {
                e.target.value = this.currentPage;
            }
        };
        this.inputBlurHandler = (e) => {
            if (!e.target.value || isNaN(parseInt(e.target.value))) {
                e.target.value = this.currentPage;
            }
        };

        if (this.pageConfirmBtn) {
            this.pageConfirmHandler = () => this.confirmpage();
            this.pageConfirmBtn.addEventListener('click', this.pageConfirmHandler);
        }


        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', this.prevClickHandler);
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', this.nextClickHandler);
        }
        if (this.pageSlider) {
            this.pageSlider.addEventListener('input', this.sliderInputHandler);
        }
        if (this.pageInput) {
            this.pageInput.addEventListener('input', this.inputHandler);
            this.pageInput.addEventListener('change', this.inputChangeHandler);
            this.pageInput.addEventListener('blur', this.inputBlurHandler);
        }
    }

    confirmpage(){
        alert(this.currentPage);
    }

    updateTotalPages(totalPages) {
        this.totalPages = totalPages;
        
        // Update slider max value
        if (this.pageSlider) {
            this.pageSlider.max = totalPages;
        }
        
        // Update input max value
        if (this.pageInput) {
            this.pageInput.max = totalPages;
        }
        
        // Update display
        this.updateDisplay();
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.setPage(this.currentPage - 1);
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.setPage(this.currentPage + 1);
        }
    }

    setPage(page) {
        // Validate page number
        if (isNaN(page) || page === null || page === undefined) {
            page = this.currentPage;
        }
        if (page < 1) page = 1;
        if (page > this.totalPages) page = this.totalPages;

        this.currentPage = page;
        this.updateDisplay();
        this.updateImage();
        this.updateSliderProgress();
    }

    updateDisplay() {
        // Update slider
        if (this.pageSlider) {
            this.pageSlider.value = this.currentPage;
        }

        // Update input
        if (this.pageInput) {
            this.pageInput.value = this.currentPage;
        }

        // Enable/disable buttons
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentPage <= 1;
            if (this.currentPage <= 1) {
                this.prevBtn.style.opacity = '0.5';
                this.prevBtn.style.cursor = 'not-allowed';
            } else {
                this.prevBtn.style.opacity = '1';
                this.prevBtn.style.cursor = 'pointer';
            }
        }

        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentPage >= this.totalPages;
            if (this.currentPage >= this.totalPages) {
                this.nextBtn.style.opacity = '0.5';
                this.nextBtn.style.cursor = 'not-allowed';
            } else {
                this.nextBtn.style.opacity = '1';
                this.nextBtn.style.cursor = 'pointer';
            }
        }
    }

    updateSliderProgress() {
        // Calculate progress percentage
        const progress = ((this.currentPage - 1) / (this.totalPages - 1)) * 100;

        // Update CSS custom property for slider progress
        if (this.pageSlider) {
            this.pageSlider.style.setProperty('--slider-progress', progress + '%');
        }
    }

    updateImage() {
        if (!this.pageImage) return;

        // Carica l'immagine reale dal server
        const imageUrl = `/api/book-image/${this.bookname}/${this.currentPage}`;
        
        const timestamp = new Date().getTime();
        this.pageImage.src = `${imageUrl}?t=${timestamp}`;
        this.pageImage.style.opacity = '0.7';
        
        this.pageImage.onload = () => {
            this.pageImage.style.opacity = '1';
            console.log(`Immagine caricata con successo per la pagina ${this.currentPage}`);
        };
    }

    reconnectInputListeners() {
        // Ricollega gli event listener al nuovo input
        this.pageInput = document.querySelector('#page-number input[type="number"]');
        
        if (this.pageInput) {
            // Rimuovi eventuali event listener esistenti
            this.pageInput.removeEventListener('input', this.inputHandler);
            this.pageInput.removeEventListener('change', this.inputChangeHandler);
            this.pageInput.removeEventListener('blur', this.inputBlurHandler);
            
            // Aggiungi i nuovi event listener
            this.pageInput.addEventListener('input', this.inputHandler);
            this.pageInput.addEventListener('change', this.inputChangeHandler);
            this.pageInput.addEventListener('blur', this.inputBlurHandler);
            
            // Aggiorna il valore corrente
            this.pageInput.value = this.currentPage;
        }
    }
}

// Initialize page controller when modal is opened
let chapterPageController = null;

// Show modal immediately on page load
document.addEventListener('DOMContentLoaded', function() {
    const chapterModal = document.getElementById('chapter-confirmation');

    if (chapterModal) {
        // Show modal immediately
        chapterModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Initialize controller after a short delay to ensure elements are rendered
        setTimeout(() => {
            chapterPageController = new ChapterPageController();
            // Avvia l'elaborazione del libro dopo aver inizializzato il controller
            initializeBookElaboration();
        }, 100);

        // Close modal functionality
        const closeBtn = document.querySelector('.close-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                chapterModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
        }

        // Close on background click
        chapterModal.addEventListener('click', function(e) {
            if (e.target === chapterModal) {
                chapterModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && chapterModal.style.display === 'flex') {
                chapterModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
});

async function startElaborateBook() {
  const response = await fetch("/api/bookelaboration", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ bookname: "alan" })
  });

  const data = await response.json();

  if (!data.success || !data.pages) {
    throw new Error('Errore nella risposta: ' + JSON.stringify(data));
  }


  return data.pages;
}

async function initializeBookElaboration() {
  try {
    const numberOfPages = await startElaborateBook();
    aggiornaNumeroPagine(numberOfPages);
    chapterPageController.updateImage();
  } catch (error) {
    console.error('Errore durante l\'elaborazione del libro:', error);
  }
}

async function aggiornaNumeroPagine(numberOfPages) {
  const pageContainer = document.getElementById("page-number");

  if (!pageContainer) {
    console.error('Elemento page-number non trovato');
    return;
  }

  pageContainer.innerHTML = `Page <input type="number" min="1" max="${numberOfPages}" value="1"> of ${numberOfPages}`;

  // Aggiorna il controller esistente con il nuovo numero di pagine
  if (chapterPageController) {
    chapterPageController.updateTotalPages(numberOfPages);
    // Ricollega gli event listener al nuovo input
    chapterPageController.reconnectInputListeners();
  }
}
