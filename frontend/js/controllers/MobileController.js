/**
 * MobileController - Manages mobile-specific UI interactions and responsive design
 */
import APIClient from '../utils/api.js';
import notifications from '../utils/notifications.js';
import { DOMHelpers } from '../utils/domHelpers.js';

export class MobileController {
  constructor() {
    this.mobileLibraryBtn = DOMHelpers.getElementById('mobile-library-btn');
    this.mobileChaptersBtn = DOMHelpers.getElementById('mobile-chapters-btn');
    this.mobileLibraryDrawer = DOMHelpers.getElementById('mobile-library-drawer');
    this.mobileChaptersDrawer = DOMHelpers.getElementById('mobile-chapters-drawer');
    this.mobileBackdrop = DOMHelpers.getElementById('mobile-backdrop');
    this.closeMobileLibrary = DOMHelpers.getElementById('close-mobile-library');
    this.closeMobileChapters = DOMHelpers.getElementById('close-mobile-chapters');
    this.mobileAddLibrary = DOMHelpers.getElementById('mobile-add-library');
    this.mobileGeneraBtn = DOMHelpers.getElementById('mobile-genera-btn');
    this.mobileLibraryContainer = DOMHelpers.getElementById('mobile-library-container');
    this.mobileChaptersContainer = DOMHelpers.getElementById('mobile-navbar-chapters');
    this.mobileResultContent = DOMHelpers.getElementById('mobile-result-content');

    this.stateMobileLibraryBtn = false;
    this.stateMobileChaptersBtn = false;
    
    this.init();
  }

  init() {
    // Library drawer events
    if (this.mobileLibraryBtn) {
      this.mobileLibraryBtn.addEventListener('click', () => this.openLibraryDrawer());
    }
    if (this.closeMobileLibrary) {
      this.closeMobileLibrary.addEventListener('click', () => this.closeLibraryDrawer());
    }

    // Chapters drawer events
    if (this.mobileChaptersBtn) {
      this.mobileChaptersBtn.addEventListener('click', () => this.openChaptersDrawer());
    }
    if (this.closeMobileChapters) {
      this.closeMobileChapters.addEventListener('click', () => this.closeChaptersDrawer());
    }

    // Backdrop close
    if (this.mobileBackdrop) {
      this.mobileBackdrop.addEventListener('click', () => this.closeAllDrawers());
    }

    // Add library button
    if (this.mobileAddLibrary) {
      this.mobileAddLibrary.addEventListener('click', () => {
        this.closeAllDrawers();
        if (window.addLibraryModal) {
          window.addLibraryModal.addBook();
        }
      });
    }

    // Generate button
    if (this.mobileGeneraBtn) {
      this.mobileGeneraBtn.addEventListener('click', () => {
        if (window.generateController) {
          window.generateController.handleGenerate();
        }
      });
    }
  }

    openLibraryDrawer() {
        this.closeChaptersDrawer();
        if (this.stateMobileLibraryBtn == false) {
            DOMHelpers.setClasses(this.mobileLibraryDrawer, ['translate-x-0'], ['-translate-x-full']);
            this.stateMobileLibraryBtn = true;

            if (this.mobileBackdrop) {
                DOMHelpers.setClasses(this.mobileBackdrop, ['opacity-100', 'pointer-events-auto'], ['opacity-0', 'pointer-events-none']);
            }
        }
        else
        {
            this.closeLibraryDrawer()
        }
        DOMHelpers.preventBodyScroll();
        this.syncLibraryContent();
    }

    closeLibraryDrawer() {
        if (this.stateMobileLibraryBtn == true) {
            DOMHelpers.setClasses(this.mobileLibraryDrawer, ['-translate-x-full'], ['translate-x-0']);
            this.stateMobileLibraryBtn = false;
            if (this.mobileBackdrop) {
                DOMHelpers.setClasses(this.mobileBackdrop, ['opacity-0', 'pointer-events-none'], ['opacity-100', 'pointer-events-auto']);
            }
        }

        DOMHelpers.allowBodyScroll();
    }

  openChaptersDrawer() {
    this.closeLibraryDrawer();
    if (this.stateMobileChaptersBtn == false) {
      if (this.mobileChaptersDrawer) {
        // Remove the default hidden transform and apply open transform
        DOMHelpers.setClasses(this.mobileChaptersDrawer, ['translate-x-0'], ['translate-x-full']);
      }
      this.stateMobileChaptersBtn = true;
      
      if (this.mobileBackdrop) {
        DOMHelpers.setClasses(this.mobileBackdrop, ['opacity-100', 'pointer-events-auto'], ['opacity-0', 'pointer-events-none']);
      }
    } else {
      this.closeChaptersDrawer();
    }
    DOMHelpers.preventBodyScroll();
    // Load chapters content
    this.syncChaptersContent();
  }

  closeChaptersDrawer() {
    if (this.stateMobileChaptersBtn == true) {
      if (this.mobileChaptersDrawer) {
        // Restore the default hidden transform
        DOMHelpers.setClasses(this.mobileChaptersDrawer, ['translate-x-full'], ['translate-x-0']);
      }
      this.stateMobileChaptersBtn = false;
      
      if (this.mobileBackdrop) {
        DOMHelpers.setClasses(this.mobileBackdrop, ['opacity-0', 'pointer-events-none'], ['opacity-100', 'pointer-events-auto']);
      }
    }
    DOMHelpers.allowBodyScroll();
  }

  closeAllDrawers() {
    this.closeLibraryDrawer();
    this.closeChaptersDrawer();
    // Reset states
    this.stateMobileLibraryBtn = false;
    this.stateMobileChaptersBtn = false;
    DOMHelpers.allowBodyScroll();
  }

  async syncLibraryContent() {
    try {
      const data = await APIClient.getLibraryBooks();
      
      if (data.success && this.mobileLibraryContainer) {
        this.displayMobileBooks(data.books);
      }
    } catch (error) {
      console.error('Failed to load mobile library:', error);
      if (this.mobileLibraryContainer) {
        this.mobileLibraryContainer.innerHTML = '<p class="text-center py-8 px-4 text-red-500 text-sm">Failed to load books</p>';
      }
    }
  }

  displayMobileBooks(books) {
    if (!this.mobileLibraryContainer) return;
    
    if (books.length === 0) {
      this.mobileLibraryContainer.innerHTML = '<p class="text-center py-8 px-4 text-gray-500 text-sm italic">No books available</p>';
      return;
    }

    this.mobileLibraryContainer.innerHTML = books.map(book => `
      <div class="mobile-library-book-item relative overflow-hidden flex items-center p-3 mb-2 rounded-xl cursor-pointer bg-white/60 border border-transparent transition-all duration-300 hover:bg-white/90 hover:border-primary"
           data-book-id="${book.id}" 
           data-book-name="${book.displayName}">
        <div class="book-info flex-1 min-w-0 relative z-10">
          <h4 class="book-title text-sm font-semibold m-0 mb-1 leading-tight overflow-hidden text-ellipsis whitespace-nowrap text-gray-800">${book.displayName}</h4>
          <div class="flex items-center gap-2 mt-2">
          </div>
        </div>
      </div>
    `).join('');

    // Add event listeners to mobile book items
    this.mobileLibraryContainer.querySelectorAll('.mobile-library-book-item').forEach(item => {
      item.addEventListener('click', () => {
        const bookId = item.dataset.bookId;
        const bookName = item.dataset.bookName;
        
        // Close the drawer first
        this.closeLibraryDrawer();
        
        // Notify desktop navbar of selection if available
        if (window.navbar) {
          window.navbar.selectedBook = bookId;
          window.navbar.loadBookChapters(bookId);
        }
        
        // Show success notification
        notifications.showMobile(`Selected: ${bookName}`, 'success');
      });
    });
  }

  async syncChaptersContent() {
    if (!window.navbar || !window.navbar.selectedBook || !this.mobileChaptersContainer) {
      if (this.mobileChaptersContainer) {
        this.mobileChaptersContainer.innerHTML = '<p class="text-center py-8 px-4 text-gray-500 text-sm italic">Select a book first</p>';
      }
      return;
    }

    try {
      const data = await APIClient.getBookChapters(window.navbar.selectedBook);
      
      if (data.success) {
        this.displayMobileChapters(data.chapters || []);
      } else {
        throw new Error(data.error || 'Failed to load chapters');
      }
    } catch (error) {
      console.error('Failed to load mobile chapters:', error);
      if (this.mobileChaptersContainer) {
        this.mobileChaptersContainer.innerHTML = '<p class="text-center py-8 px-4 text-red-500 text-sm">Failed to load chapters</p>';
      }
    }
  }

  displayMobileChapters(chapters) {
    if (!this.mobileChaptersContainer) return;
    
    if (chapters.length === 0) {
      this.mobileChaptersContainer.innerHTML = '<p class="text-center py-8 px-4 text-gray-500 text-sm italic">No chapters available</p>';
      return;
    }

    this.mobileChaptersContainer.innerHTML = chapters.map((chapter, index) => `
      <div class="mobile-chapter-item flex items-center p-3 mb-2 rounded-xl cursor-pointer bg-white/60 border border-transparent transition-all duration-300 hover:bg-white/90 hover:border-primary"
           data-chapter-index="${index}" 
           data-chapter-id="${chapter.id || index}">
        <div class="chapter-number w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
          ${index + 1}
        </div>
        <div class="chapter-details flex-1">
          <h4 class="chapter-title text-sm font-semibold m-0 mb-1 leading-tight">${chapter.title || `Chapter ${index + 1}`}</h4>
          <div class="chapter-info flex gap-2 text-xs text-gray-500">

          </div>
        </div>
        <div class="ml-2">
          <div class="w-6 h-6 border-2 border-primary rounded flex items-center justify-center chapter-checkbox">
            <span class="checkmark hidden text-primary text-sm">✓</span>
          </div>
        </div>
      </div>
    `).join('');

    // Add event listeners to mobile chapter items
    this.mobileChaptersContainer.querySelectorAll('.mobile-chapter-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.handleMobileChapterSelection(item, index);
      });
    });
  }

  handleMobileChapterSelection(chapterElement, chapterIndex) {
    const chapterId = chapterElement.dataset.chapterId;
    const checkbox = chapterElement.querySelector('.chapter-checkbox');
    const checkmark = chapterElement.querySelector('.checkmark');
    
    if (DOMHelpers.hasClass(chapterElement, 'selected')) {
      // Deselect
      DOMHelpers.removeClass(chapterElement, 'selected');
      if (checkbox) checkbox.style.background = 'transparent';
      if (checkmark) DOMHelpers.addClass(checkmark, 'hidden');
      
      // Remove from navbar selection if available
      if (window.navbar && window.navbar.selectedChapters) {
        window.navbar.selectedChapters.delete(chapterId);
      }
    } else {
      // Select
      DOMHelpers.addClass(chapterElement, 'selected');
      if (checkbox) checkbox.style.background = 'var(--color-primary)';
      if (checkmark) {
        DOMHelpers.removeClass(checkmark, 'hidden');
        checkmark.style.color = 'white';
      }
      
      // Add to navbar selection if available
      if (window.navbar && window.navbar.selectedChapters) {
        window.navbar.selectedChapters.add(chapterId);
      }
    }
    
    console.log('Selected chapters:', window.navbar?.selectedChapters ? Array.from(window.navbar.selectedChapters) : []);
  }

  syncResultContent(content) {
    if (this.mobileResultContent) {
      this.mobileResultContent.innerHTML = content;
    }
  }

  // Public methods for external control
  refreshLibrary() {
    if (DOMHelpers.hasClass(this.mobileLibraryDrawer, 'translate-x-0')) {
      this.syncLibraryContent();
    }
  }

  refreshChapters() {
    if (DOMHelpers.hasClass(this.mobileChaptersDrawer, 'translate-x-0')) {
      this.syncChaptersContent();
    }
  }

  isLibraryDrawerOpen() {
    return this.mobileLibraryDrawer && DOMHelpers.hasClass(this.mobileLibraryDrawer, 'translate-x-0');
  }

  isChaptersDrawerOpen() {
    return this.mobileChaptersDrawer && DOMHelpers.hasClass(this.mobileChaptersDrawer, 'translate-x-0');
  }

  isAnyDrawerOpen() {
    return this.isLibraryDrawerOpen() || this.isChaptersDrawerOpen();
  }
}