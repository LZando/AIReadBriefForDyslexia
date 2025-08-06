import { NavBar } from './controllers/NavBar.js';
import { AddLibraryModal } from './controllers/AddLibraryModal.js';
import { GenerateController } from './controllers/GenerateController.js';
import { ChapterPageController } from './controllers/ChapterPageController.js';
import { MobileController } from './controllers/MobileController.js';
import LoadingModal from './controllers/LoadingModal.js';
import { DOMHelpers } from './utils/domHelpers.js';
import notifications from './utils/notifications.js';

class AIReadBriefApp {
  constructor() {
    this.navbar = null;
    this.addLibraryModal = null;
    this.generateController = null;
    this.chapterPageController = null;
    this.mobileController = null;
    this.loadingModal = null;

    this.init();
  }

  async init() {
    try {
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      this.initializeControllers();
      this.setupGlobalFunctions();
      this.setupKeyboardShortcuts();
      cleanWorkspace();

    } catch (error) {
      console.error('Failed to initialize application:', error);
      notifications.error('Application failed to initialize');
    }
  }

  initializeControllers() {
    try {
      this.navbar = new NavBar();
      window.navbar = this.navbar;

      this.addLibraryModal = new AddLibraryModal();
      window.addLibraryModal = this.addLibraryModal;

      this.generateController = new GenerateController();
      window.generateController = this.generateController;

      this.mobileController = new MobileController();
      window.mobileController = this.mobileController;

      LoadingModal.init();
      this.loadingModal = LoadingModal;
      window.loadingModal = this.loadingModal;

      this.initializeChapterModal();

    } catch (error) {
      console.error('Failed to initialize controllers:', error);
      throw error;
    }
  }

  initializeChapterModal() {
    const chapterModal = DOMHelpers.getElementById('chapter-confirmation');

    if (chapterModal) {
      const closeBtn = DOMHelpers.querySelector('.close-modal-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          DOMHelpers.removeClass(chapterModal, 'show');
          DOMHelpers.allowBodyScroll();
        });
      }

      // Close on background click
      chapterModal.addEventListener('click', (e) => {
        if (e.target === chapterModal) {
          DOMHelpers.removeClass(chapterModal, 'show');
          DOMHelpers.allowBodyScroll();
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && DOMHelpers.hasClass(chapterModal, 'show')) {
          DOMHelpers.removeClass(chapterModal, 'show');
          DOMHelpers.allowBodyScroll();
        }
      });
    }
  }

  setupGlobalFunctions() {
    // Global function to show chapter modal
    window.showChapterModal = (bookname) => {
      const chapterModal = DOMHelpers.getElementById('chapter-confirmation');

      if (chapterModal) {
        DOMHelpers.addClass(chapterModal, 'show');
        DOMHelpers.preventBodyScroll();

        // Initialize or update controller
        if (!window.chapterPageController) {
          // Create controller for the first time
          setTimeout(() => {
            this.chapterPageController = new ChapterPageController();
            window.chapterPageController = this.chapterPageController;
            this.chapterPageController.setBookname(bookname);
          }, 100);
        } else {
          // Update existing controller with new book name
          window.chapterPageController.setBookname(bookname);
        }
      }
    };

    // Global function to clean workspace
    window.cleanWorkspace = async () => {
      try {
        const response = await fetch('/api/cleanup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
    };

    // Legacy compatibility functions
    window.startElaborateBook = async () => {
      try {
        const response = await fetch('/api/bookelaboration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ bookname: 'alan' })
        });

        const data = await response.json();

        if (!data.success || !data.pages) {
          throw new Error('Errore nella risposta: ' + JSON.stringify(data));
        }

        return data.pages;
      } catch (error) {
        console.error('Error in startElaborateBook:', error);
        throw error;
      }
    };

    window.aggiornaNumeroPagine = async (numberOfPages) => {
      const pageContainer = DOMHelpers.getElementById('page-number');

      if (!pageContainer) {
        console.error('Elemento page-number non trovato');
        return;
      }

      pageContainer.innerHTML = `Page <input type="number" min="1" max="${numberOfPages}" value="1"> of ${numberOfPages}`;

      // Update existing controller with new page count
      if (window.chapterPageController) {
        window.chapterPageController.updateTotalPages(numberOfPages);
        window.chapterPageController.reconnectInputListeners();
      }
    };
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + L - Open Library
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        if (DOMHelpers.isMobile()) {
          this.mobileController.openLibraryDrawer();
        } else {
          this.navbar.toggleLibraryMenu();
        }
      }

      // Ctrl/Cmd + K - Open Chapters
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (DOMHelpers.isMobile()) {
          this.mobileController.openChaptersDrawer();
        } else {
          this.navbar.toggleChaptersMenu();
        }
      }

      // Ctrl/Cmd + G - Generate Summary
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        this.generateController.handleGenerate();
      }

      // Ctrl/Cmd + U - Upload Book
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        this.addLibraryModal.addBook();
      }

      // Escape - Close mobile drawers
      if (e.key === 'Escape' && DOMHelpers.isMobile()) {
        this.mobileController.closeAllDrawers();
      }
    });
  }

  // Public methods for external access
  getController(name) {
    switch (name) {
      case 'navbar': return this.navbar;
      case 'addLibraryModal': return this.addLibraryModal;
      case 'generateController': return this.generateController;
      case 'chapterPageController': return this.chapterPageController;
      case 'mobileController': return this.mobileController;
      default: return null;
    }
  }

  refreshAll() {
    // Refresh all data
    if (this.navbar) {
      this.navbar.loadLibraryBooks();
    }
    if (this.mobileController) {
      this.mobileController.refreshLibrary();
      this.mobileController.refreshChapters();
    }
  }
}


const app = new AIReadBriefApp();
window.aiReadBriefApp = app;

export default app;