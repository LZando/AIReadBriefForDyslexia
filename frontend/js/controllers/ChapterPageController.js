/**
 * ChapterPageController - Manages chapter extraction modal and page navigation
 */
import APIClient from '../utils/api.js';
import notifications from '../utils/notifications.js';
import { DOMHelpers } from '../utils/domHelpers.js';

export class ChapterPageController {
  constructor() {
    this.currentPage = 1;
    this.totalPages = 24; // Default value
    this.bookname = null; // Will be set when book is selected
    this.currentChaptersData = null;
    
    this.init();
  }

  init() {
    this.removeEventListeners();
    
    // Find elements with updated selectors
    this.prevBtn = DOMHelpers.querySelector('.chapter-page-selector .prev-btn');
    this.nextBtn = DOMHelpers.querySelector('.chapter-page-selector .next-btn');
    this.pageSlider = DOMHelpers.querySelector('.chapter-page-selector .page-slider');
    this.pageInput = DOMHelpers.querySelector('#page-number input[type="number"]');
    this.pageImage = DOMHelpers.querySelector('.chapter-page-immagine img');
    this.pageConfirmBtn = DOMHelpers.getElementById("confirm-page-btn");

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
    
    // Load first page image only if bookname is set
    if (this.bookname) {
      this.updateImage();
    }
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
    if (this.pageConfirmBtn && this.pageConfirmHandler) {
      this.pageConfirmBtn.removeEventListener('click', this.pageConfirmHandler);
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
      this.pageConfirmHandler = () => this.confirmPage();
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

  confirmPage() {
    console.log('Extracting chapters using page:', this.currentPage);
    this.extractChapters();
  }

  async extractChapters() {
    if (!this.bookname) {
      notifications.warning('Nessun libro selezionato');
      return;
    }
    
    try {
      const data = await APIClient.analyzeChapter(this.bookname, this.currentPage);
      
      if (data.success) {
        this.displayChaptersList(data);
      } else {
        throw new Error(data.error || 'Unknown error in chapter extraction');
      }
    } catch (error) {
      console.error('Errore durante l\'estrazione dei capitoli:', error);
      notifications.error(`Errore nell'estrazione: ${error.message}`);
    }
  }

  displayChaptersList(data) {
    const resultContainer = DOMHelpers.getElementById('chapter-result');
    if (!resultContainer) return;

    this.currentChaptersData = data;

    resultContainer.innerHTML = `
      <div class="card bg-white shadow rounded-lg p-6 space-y-6 flex flex-col h-full">
        <div class="chapters-list flex-1 flex flex-col">
          <div class="extraction-info mb-4">
            <strong>n chapters:</strong> ${data.totalChapters}
          </div>
          <div class="chapters-container flex-1 overflow-y-auto">
            ${data.chapters.map(ch => `
              <div class="chapter-item">
                <div class="chapter-number">Cap. ${ch.chapterNumber}</div>
                <div class="chapter-details">
                  <h5 class="chapter-title">${ch.title}</h5>
                  <div class="chapter-info">
                    <span class="page-range">Pages ${ch.startPage}-${ch.endPage}</span>
                    <span class="page-count">(${ch.pageCount} pages)</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="chapter-save-button-container">
          <button id="save-chapters-btn"
                  class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold shadow-lg bg-primary text-white transition hover:bg-gray-700">
            Save
          </button>
        </div>
      </div>
    `;

    this.connectSaveButton();
    DOMHelpers.scrollToElement(resultContainer);
  }

  connectSaveButton() {
    const saveBtn = DOMHelpers.getElementById('save-chapters-btn');
    if (saveBtn && !saveBtn.hasAttribute('data-connected')) {
      saveBtn.addEventListener('click', () => this.saveChapters());
      saveBtn.setAttribute('data-connected', 'true');
    }
  }

  async saveChapters() {
    if (!this.currentChaptersData) {
      notifications.warning('Nessun dato sui capitoli disponibile. Estrai prima i capitoli.');
      return;
    }

    try {
      const result = await APIClient.saveChapters(this.bookname, this.currentChaptersData);
      
      if (result.success) {
        notifications.success(`PDF diviso con successo in ${result.totalChapters} capitoli!\nCartella: ${result.outputDirectory}`);

        const modal = DOMHelpers.getElementById('chapter-confirmation');
        if (modal) {
          DOMHelpers.removeClass(modal, 'show');
          DOMHelpers.allowBodyScroll();
        }
        // Refresh library to show the new book
        if (window.navbar) {
          await window.navbar.loadLibraryBooks();
        }
        
        // Refresh all components
        if (window.aiReadBriefApp) {
          window.aiReadBriefApp.refreshAll();
        }
        
        if (window.navbar && window.navbar.selectedBook) {
          await window.navbar.loadBookChapters(window.navbar.selectedBook);
        }
      } else {
        throw new Error(result.error || 'Errore sconosciuto');
      }
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      notifications.error(`Errore nel salvataggio: ${error.message}`);
    }
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
    if (!this.pageImage || !this.bookname) return;

    // Load real image from server
    const imageUrl = APIClient.getPageImageURL(this.bookname, this.currentPage);
    
    const timestamp = new Date().getTime();
    this.pageImage.src = `${imageUrl}?t=${timestamp}`;
    this.pageImage.style.opacity = '0.7';
    
    this.pageImage.onload = () => {
      this.pageImage.style.opacity = '1';
      console.log(`Immagine caricata con successo per la pagina ${this.currentPage}`);
    };
    
    this.pageImage.onerror = () => {
      console.error(`Errore nel caricamento dell'immagine per la pagina ${this.currentPage}`);
      // Fallback to placeholder image
      this.pageImage.src = `https://via.placeholder.com/400x600/334155/ffffff?text=Page+${this.currentPage}+(Not+Found)`;
      this.pageImage.style.opacity = '1';
    };
  }

  reconnectInputListeners() {
    // Reconnect event listeners to the new input
    this.pageInput = DOMHelpers.querySelector('#page-number input[type="number"]');
    
    if (this.pageInput) {
      // Remove existing event listeners
      this.pageInput.removeEventListener('input', this.inputHandler);
      this.pageInput.removeEventListener('change', this.inputChangeHandler);
      this.pageInput.removeEventListener('blur', this.inputBlurHandler);
      
      // Add new event listeners
      this.pageInput.addEventListener('input', this.inputHandler);
      this.pageInput.addEventListener('change', this.inputChangeHandler);
      this.pageInput.addEventListener('blur', this.inputBlurHandler);
      
      // Update current value
      this.pageInput.value = this.currentPage;
    }
  }

  async initializeBookElaboration() {
    if (!this.bookname) {
      console.log('No bookname set, skipping book elaboration');
      return;
    }
    
    try {
      const data = await APIClient.bookElaboration(this.bookname);
      
      if (data.success) {
        this.totalPages = data.pages;
        console.log(`Book elaborated successfully. Total pages: ${this.totalPages}`);
        this.updatePageNumberDisplay();
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Errore durante l\'elaborazione del libro:', error);
      notifications.warning('Failed to elaborate book, using default values');
      // Use default values if elaboration fails
      console.log('Using default values due to elaboration error');
    }
  }

  updatePageNumberDisplay() {
    // Update the "of 24" part in the page number display
    const pageNumberDiv = DOMHelpers.querySelector('#page-number');
    if (pageNumberDiv) {
      pageNumberDiv.innerHTML = `Page <input type="number" min="1" max="${this.totalPages}" value="${this.currentPage}"> of ${this.totalPages}`;
      
      // Re-get the input reference since we recreated it
      this.pageInput = DOMHelpers.querySelector('#page-number input[type="number"]');
      if (this.pageInput) {
        this.pageInput.min = 1;
        this.pageInput.max = this.totalPages;
        this.pageInput.value = this.currentPage;
        this.pageInput.step = 1;
        
        // Re-add the keydown listener for the new input
        this.pageInput.addEventListener('keydown', (e) => {
          if ([8, 9, 27, 13, 35, 36, 37, 39, 46].indexOf(e.keyCode) !== -1 ||
              (e.ctrlKey && [65, 67, 86, 88, 90].indexOf(e.keyCode) !== -1)) {
            return;
          }
          if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
          }
        });
        
        // Re-add input event listeners
        this.pageInput.addEventListener('input', this.inputHandler);
        this.pageInput.addEventListener('change', this.inputChangeHandler);
        this.pageInput.addEventListener('blur', this.inputBlurHandler);
      }
    }
    
    // Update slider max value
    if (this.pageSlider) {
      this.pageSlider.max = this.totalPages;
    }
  }

  // Public methods for external control
  setBookname(bookname) {
    this.bookname = bookname;
    this.currentPage = 1;
    this.updateDisplay();
    this.updateImage();
    this.initializeBookElaboration();
  }

  showModal() {
    const modal = DOMHelpers.getElementById('chapter-confirmation');
    if (modal) {
      DOMHelpers.addClass(modal, 'show');
      DOMHelpers.preventBodyScroll();
    }
  }

  hideModal() {
    const modal = DOMHelpers.getElementById('chapter-confirmation');
    if (modal) {
      DOMHelpers.removeClass(modal, 'show');
      DOMHelpers.allowBodyScroll();
    }
  }
}