
import APIClient from '../utils/api.js';
import notifications from '../utils/notifications.js';
import { DOMHelpers } from '../utils/domHelpers.js';

export class NavBar {
  constructor() {
    this.stateLibrary = false;
    this.stateChapter = false;
    this.toggleLibrary = DOMHelpers.getElementById('library-menu-button');
    this.menuLibrary = DOMHelpers.getElementById('navbar-library');
    this.toggleChapters = DOMHelpers.getElementById('chapter-menu-button');
    this.menuChapters = DOMHelpers.getElementById('navbar-chapters');
    this.menuChaptersContainer = DOMHelpers.getElementById('navbar-chapters-container');
    this.libraryContainer = DOMHelpers.getElementById('library-container');
    this.selectedBook = null;
    this.selectedChapters = new Set();
    this.lastSelectedChapterIndex = -1;
    this.lastClickTime = 0;
    this.lastClickedChapter = null;

    this.init();
  }

  init() {
    // Bind methods
    this.toggleLibraryMenu = this.toggleLibraryMenu.bind(this);
    this.toggleChaptersMenu = this.toggleChaptersMenu.bind(this);

    // Add event listeners
    if (this.toggleLibrary) {
      this.toggleLibrary.addEventListener('click', this.toggleLibraryMenu);
    }
    if (this.toggleChapters) {
      this.toggleChapters.addEventListener('click', this.toggleChaptersMenu);
    }

    // Initialize chapters placeholder
    this.displayChapters([]);

    // Load library books on initialization
    this.loadLibraryBooks();
  }

  async toggleLibraryMenu() {
    this.stateLibrary = !this.stateLibrary;
    DOMHelpers.toggleClass(this.toggleLibrary, "active");
    DOMHelpers.toggleClass(this.menuLibrary, 'collapsed');
    
    // Refresh books when opening library
    if (this.stateLibrary) {
      await this.loadLibraryBooks();
    }
  }

  toggleChaptersMenu() {
    this.stateChapter = !this.stateChapter;
    DOMHelpers.toggleClass(this.toggleChapters, "active");
    // Toggle the parent container, not the inner div
    if (this.menuChaptersContainer) {
      DOMHelpers.toggleClass(this.menuChaptersContainer, 'collapsed');
    }
  }

  async loadLibraryBooks() {
    try {
      const data = await APIClient.getLibraryBooks();
      
      if (data.success) {
        this.displayBooks(data.books);
      } else {
        console.error('Failed to load library books:', data.error);
        this.displayError('Failed to load library books');
      }
    } catch (error) {
      console.error('Error loading library books:', error);
      notifications.error('Error loading library books');
      this.displayError('Error loading library books');
    }
  }

  displayBooks(books) {
    if (!this.libraryContainer) {
      console.error('libraryContainer not found!');
      return;
    }
    
    if (books.length === 0) {
      this.libraryContainer.innerHTML = '<p class="text-center py-8 px-4 text-gray-500 text-sm italic">No books available</p>';
      return;
    }

    this.libraryContainer.innerHTML = books.map(book => `
      <div class="library-book-item relative overflow-hidden flex items-center p-3 mb-2 rounded-xl cursor-pointer bg-white/60 border border-transparent transition-all duration-300 hover:bg-white/90 hover:border-primary ${this.selectedBook === book.id ? 'selected bg-gradient-to-br from-primary to-gray-800 text-white border-white/20' : ''}"
           data-book-id="${book.id}" 
           data-book-name="${book.displayName}">
        <div class="library-shimmer absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-all duration-700"></div>
        <div class="book-info flex-1 min-w-0 relative z-10">
          <h4 class="book-title text-sm font-semibold m-0 mb-1 leading-tight overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-300 ${this.selectedBook === book.id ? 'text-white' : 'text-gray-800 hover:text-primary'}">${book.displayName}</h4>
        </div>
        
        <!-- Icona cestino -->
        <button class="delete-book relative z-10 ml-3 p-1 rounded-lg hover:bg-red-100 transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ${this.selectedBook === book.id ? 'text-white' : 'text-gray-500 hover:text-red-600'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v1h6V4a1 1 0 00-1-1m-4 0h4"/>
          </svg>
        </button>
      </div>
    `).join('');

    // Add event listeners to book items
    this.libraryContainer.querySelectorAll('.library-book-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.selectBook(item);
      });

      // Add delete button event listener
      const deleteBtn = item.querySelector('.delete-book');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent book selection when clicking delete
          this.deleteBook(item);
        });
      }
      
      // Add hover shimmer effect
      item.addEventListener('mouseenter', () => {
        const shimmer = item.querySelector('.library-shimmer');
        if (shimmer) {
          shimmer.style.left = '100%';
          setTimeout(() => {
            shimmer.style.left = '-100%';
          }, 700);
        }
      });
      
      // Reset shimmer on mouse leave for smoother experience
      item.addEventListener('mouseleave', () => {
        const shimmer = item.querySelector('.library-shimmer');
        if (shimmer) {
          shimmer.style.left = '-100%';
        }
      });
    });
  }

  selectBook(bookElement) {
    const bookId = bookElement.dataset.bookId;
    const bookName = bookElement.dataset.bookName;
    
    // Remove selection from all books
    this.libraryContainer.querySelectorAll('.library-book-item').forEach(item => {
      item.className = item.className
        .replace(/selected bg-gradient-to-br from-primary to-gray-800 text-white border-white\/20/, '')
        .replace(/bg-gradient-to-br from-primary to-gray-800/, 'bg-white/60')
        .replace(/text-white/, '')
        .replace(/border-white\/20/, 'border-transparent');
      
      const title = item.querySelector('.book-title');
      if (title) {
        title.className = title.className.replace(/text-white/, 'text-gray-800 hover:text-primary');
      }
    });
    
    // Add selection to clicked book
    bookElement.className = bookElement.className
      .replace(/bg-white\/60/, 'bg-gradient-to-br from-primary to-gray-800')
      .replace(/border-transparent/, 'border-white/20') + ' selected text-white';
    
    const selectedTitle = bookElement.querySelector('.book-title');
    if (selectedTitle) {
      selectedTitle.className = selectedTitle.className.replace(/text-gray-800 hover:text-primary/, 'text-white');
    }
    
    this.selectedBook = bookId;
    
    // Update the chapter controller with the selected book
    if (window.chapterPageController) {
      window.chapterPageController.bookname = bookName;
    }
    
    // Load and display chapters for selected book
    this.loadBookChapters(bookId);
    
    // Show success notification
    notifications.success(`Selected: ${bookName}`);
  }

  displayError(message) {
    if (!this.libraryContainer) return;
    
    this.libraryContainer.innerHTML = `<p class="text-center py-8 px-4 text-red-500 text-sm font-medium">${message}</p>`;
  }

  async deleteBook(bookElement) {
    const bookId = bookElement.dataset.bookId;
    const bookName = bookElement.dataset.bookName;

    // Show confirmation dialog
            if (!confirm(`Are you sure you want to delete "${bookName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const data = await APIClient.deleteBook(bookId);

      if (data.success) {
        // Remove the book element from the UI
        bookElement.remove();
        
        // If this was the selected book, clear the selection
        if (this.selectedBook === bookId) {
          this.selectedBook = null;
          this.selectedChapters.clear();
          this.displayChapters([]);
        }

        // Show success notification
        notifications.success(`Book "${bookName}" deleted successfully`);
      } else {
        notifications.error(`Error during deletion: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting book:', error);
              notifications.error('Error deleting the book');
    }
  }

  async loadBookChapters(bookname) {
    try {
      const data = await APIClient.getBookChapters(bookname);
      
      if (data.success) {
        this.displayChapters(data.chapters);
        // Clear previous chapter selections
        this.selectedChapters.clear();
        this.lastSelectedChapterIndex = -1;
      } else {
        console.error('Failed to load chapters:', data.error);
        this.displayChaptersError('Failed to load chapters');
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
      notifications.error('Error loading chapters');
      this.displayChaptersError('Error loading chapters');
    }
  }

  displayChapters(chapters) {
    if (!this.menuChapters) {
      console.error('menuChapters element not found!');
      return;
    }
    
    if (chapters.length === 0) {
      this.menuChapters.innerHTML = `
        <div class="flex items-center justify-center h-full text-gray-400 p-6">
          <div class="text-center">
            <p class="text-sm font-medium mb-2">No chapters available</p>
          </div>
        </div>
      `;
      return;
    }

    const chaptersHTML = `
      <div class="chapters-header p-4 border-b border-gray-200 bg-white/50">
        <h3 class="text-primary text-sm font-semibold m-0 mb-2 text-center">Chapters (${chapters.length})</h3>
      </div>
      <div class="chapters-container flex-1 p-4 overflow-y-auto min-h-0">
        ${chapters.map((chapter, index) => `
          <div class="chapter-item relative overflow-hidden flex items-center p-3 mb-2 rounded-xl cursor-pointer bg-white/60 border border-transparent transition-all duration-300 select-none hover:bg-white/90  ${this.selectedChapters.has(chapter.id) ? 'selected bg-gradient-to-br from-primary to-gray-800 text-white border-white/20' : ''}"
               data-chapter-id="${chapter.id}"
               data-chapter-index="${index}"
               data-chapter-number="${chapter.number}">
            <div class="chapter-shimmer absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-all duration-700"></div>
            <div class="chapter-info flex-1 min-w-0 relative z-10">
              <h4 class="chapter-title text-sm font-semibold m-0 mb-1 leading-tight overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-300 ${this.selectedChapters.has(chapter.id) ? 'text-white' : 'text-gray-800 hover:text-primary'}">
                <span class="chapter-number text-xs font-semibold transition-colors duration-300 ${this.selectedChapters.has(chapter.id) ? 'text-white' : 'text-primary'}">Cap ${chapter.number}</span>
                <span class="mx-1 ${this.selectedChapters.has(chapter.id) ? 'text-white' : 'text-gray-500'}">•</span>
                <span class="chapter-text ${this.selectedChapters.has(chapter.id) ? 'text-white' : 'text-gray-800'}">${chapter.title}</span>
              </h4>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.menuChapters.innerHTML = chaptersHTML;

    // Add event listeners to chapter items
    this.menuChapters.querySelectorAll('.chapter-item').forEach(item => {
      item.addEventListener('click', (e) => this.selectChapter(item, e));
    });
  }

  selectChapter(chapterElement, event) {
    const chapterId = chapterElement.dataset.chapterId;
    const chapterIndex = parseInt(chapterElement.dataset.chapterIndex);
    const currentTime = Date.now();
    
    // Check for double click (within 300ms)
    const isDoubleClick = (currentTime - this.lastClickTime < 300) && 
                         (this.lastClickedChapter === chapterId);
    
    if (isDoubleClick) {
      // Double click: select all chapters from 0 to current (inclusive)
      this.selectAllPreviousChapters(chapterIndex);
    } else if (event.shiftKey && this.lastSelectedChapterIndex !== -1) {
      // Range selection
      this.selectChapterRange(this.lastSelectedChapterIndex, chapterIndex);
    } else if (event.ctrlKey || event.metaKey) {
      // Multiple selection (Ctrl/Cmd + click)
      this.toggleChapterSelection(chapterElement, chapterId);
    } else {
      // Single selection
      this.clearChapterSelection();
      this.toggleChapterSelection(chapterElement, chapterId);
    }
    
    this.lastSelectedChapterIndex = chapterIndex;
    this.lastClickTime = currentTime;
    this.lastClickedChapter = chapterId;
    this.updateChapterSelectionDisplay();
  }

  selectChapterRange(startIndex, endIndex) {
    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    
    const chapterItems = this.menuChapters.querySelectorAll('.chapter-item');
    for (let i = start; i <= end; i++) {
      if (chapterItems[i]) {
        const chapterId = chapterItems[i].dataset.chapterId;
        this.selectedChapters.add(chapterId);
        chapterItems[i].classList.add('selected');
      }
    }
  }

  toggleChapterSelection(chapterElement, chapterId) {
    if (this.selectedChapters.has(chapterId)) {
      this.selectedChapters.delete(chapterId);
      chapterElement.classList.remove('selected');
    } else {
      this.selectedChapters.add(chapterId);
      chapterElement.classList.add('selected');
    }
  }

  selectAllPreviousChapters(toIndex) {
    // Clear previous selection
    this.clearChapterSelection();
    
    // Select all chapters from 0 to toIndex (inclusive)
    const chapterItems = this.menuChapters.querySelectorAll('.chapter-item');
    for (let i = 0; i <= toIndex; i++) {
      if (chapterItems[i]) {
        const chapterId = chapterItems[i].dataset.chapterId;
        this.selectedChapters.add(chapterId);
        chapterItems[i].classList.add('selected');
      }
    }
  }

  clearChapterSelection() {
    this.selectedChapters.clear();
    this.menuChapters.querySelectorAll('.chapter-item').forEach(item => {
      item.classList.remove('selected');
    });
    this.updateChapterSelectionDisplay();
  }

  updateChapterSelectionDisplay() {
    this.menuChapters.querySelectorAll('.chapter-item').forEach(item => {
      const chapterId = item.dataset.chapterId;
      const isSelected = this.selectedChapters.has(chapterId);
      
      // Get child elements
      const chapterTitle = item.querySelector('.chapter-title');
      const chapterNumber = item.querySelector('.chapter-number');
      const chapterSeparator = item.querySelector('.chapter-title .mx-1');
      const chapterText = item.querySelector('.chapter-text');
      
      if (isSelected) {
        // Apply selected state
        item.className = item.className
          .replace(/bg-white\/60/, 'bg-gradient-to-br from-primary to-gray-800')
          .replace(/border-transparent/, 'border-white/20')
          .replace(/text-gray-800/, 'text-white');
        
        if (!item.classList.contains('selected')) {
          item.classList.add('selected', 'text-white');
        }
        
        // Update child elements for selected state
        if (chapterTitle) {
          chapterTitle.className = chapterTitle.className
            .replace(/text-gray-800 hover:text-primary/, 'text-white')
            .replace(/text-gray-800/, 'text-white');
        }
        if (chapterNumber) {
          chapterNumber.className = chapterNumber.className.replace(/text-primary/, 'text-white');
        }
        if (chapterSeparator) {
          chapterSeparator.className = chapterSeparator.className.replace(/text-gray-500/, 'text-white');
        }
        if (chapterText) {
          chapterText.className = chapterText.className.replace(/text-gray-800/, 'text-white');
        }
      } else {
        // Apply unselected state
        item.className = item.className
          .replace(/selected bg-gradient-to-br from-primary to-gray-800 text-white border-white\/20/, '')
          .replace(/bg-gradient-to-br from-primary to-gray-800/, 'bg-white/60')
          .replace(/text-white/, '')
          .replace(/border-white\/20/, 'border-transparent');
        
        item.classList.remove('selected');
        
        // Update child elements for unselected state
        if (chapterTitle) {
          chapterTitle.className = chapterTitle.className
            .replace(/text-white/, 'text-gray-800 hover:text-primary');
        }
        if (chapterNumber) {
          chapterNumber.className = chapterNumber.className.replace(/text-white/, 'text-primary');
        }
        if (chapterSeparator) {
          chapterSeparator.className = chapterSeparator.className.replace(/text-white/, 'text-gray-500');
        }
        if (chapterText) {
          chapterText.className = chapterText.className.replace(/text-white/, 'text-gray-800');
        }
      }
    });
  }

  displayChaptersError(message) {
    if (!this.menuChapters) return;
    
    this.menuChapters.innerHTML = `
      <div class="chapters-header p-4 border-b border-gray-200 bg-white/50">
        <h3 class="text-primary text-sm font-semibold m-0 text-center">Chapters</h3>
      </div>
      <p class="text-center py-8 px-4 text-red-500 text-sm font-medium">${message}</p>
    `;
  }

  getSelectedChapters() {
    return Array.from(this.selectedChapters);
  }

  getSelectedChaptersInfo() {
    const selected = this.getSelectedChapters();
    const info = [];
    
    selected.forEach(chapterId => {
      const element = this.menuChapters.querySelector(`[data-chapter-id="${chapterId}"]`);
      if (element) {
        info.push({
          id: chapterId,
          number: parseInt(element.dataset.chapterNumber),
          title: element.querySelector('.chapter-title').textContent
        });
      }
    });
    
    return info.sort((a, b) => a.number - b.number);
  }
}