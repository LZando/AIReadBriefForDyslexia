class NavBar {
  constructor() {
    this.stateLibrary = false;
    this.stateChapter = false;
    this.toggleLibrary = document.getElementById('library-menu-button');
    this.menuLibrary = document.getElementById('navbar-library');
    this.toggleChapters = document.getElementById('chapter-menu-button');
    this.menuChapters = document.getElementById('navbar-chapters');
    this.menuChaptersContainer = document.getElementById('navbar-chapters-container'); // Add reference to parent container
    this.libraryContainer = document.getElementById('library-container');
    this.selectedBook = null;
    this.selectedChapters = new Set();
    this.lastSelectedChapterIndex = -1;
    this.lastClickTime = 0;
    this.lastClickedChapter = null;

    // Bind methods
    this.toggleLibraryMenu = this.toggleLibraryMenu.bind(this);
    this.toggleChaptersMenu = this.toggleChaptersMenu.bind(this);

    // Add event listeners
    this.toggleLibrary.addEventListener('click', this.toggleLibraryMenu);
    this.toggleChapters.addEventListener('click', this.toggleChaptersMenu);

    // Initialize chapters placeholder
    this.displayChapters([]);

    // Load library books on initialization
    this.loadLibraryBooks();
  }

  async toggleLibraryMenu() {
    this.stateLibrary = !this.stateLibrary;
    this.toggleLibrary.classList.toggle("active");
    this.menuLibrary.classList.toggle('collapsed');
    
    // Refresh books when opening library
    if (this.stateLibrary) {
      await this.loadLibraryBooks();
    }
  }

  toggleChaptersMenu() {
    this.stateChapter = !this.stateChapter;
    this.toggleChapters.classList.toggle("active");
    // Toggle the parent container, not the inner div
    if (this.menuChaptersContainer) {
      this.menuChaptersContainer.classList.toggle('collapsed');
    }
  }

  async loadLibraryBooks() {
    try {
      const response = await fetch('/api/library');
      const data = await response.json();
      
      if (data.success) {
        this.displayBooks(data.books);
      } else {
        console.error('Failed to load library books:', data.error);
        this.displayError('Failed to load library books');
      }
    } catch (error) {
      console.error('Error loading library books:', error);
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
      </div>
    `).join('');

    // Add event listeners to book items
    this.libraryContainer.querySelectorAll('.library-book-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.selectBook(item);
      });
      
      // Add hover shimmer effect
      item.addEventListener('mouseenter', () => {
        const shimmer = item.querySelector('.library-shimmer');
        shimmer.style.left = '100%';
        setTimeout(() => {
          shimmer.style.left = '-100%';
        }, 700);
      });
      
      // Reset shimmer on mouse leave for smoother experience
      item.addEventListener('mouseleave', () => {
        const shimmer = item.querySelector('.library-shimmer');
        shimmer.style.left = '-100%';
      });
    });
  }

  selectBook(bookElement) {
    const bookId = bookElement.dataset.bookId;
    const bookName = bookElement.dataset.bookName;
    
    // Remove selection from all books - reset to normal Tailwind classes
    this.libraryContainer.querySelectorAll('.library-book-item').forEach(item => {
      // Reset to normal state classes
      item.className = item.className
        .replace(/selected bg-gradient-to-br from-primary to-gray-800 text-white border-white\/20/, '')
        .replace(/bg-gradient-to-br from-primary to-gray-800/, 'bg-white/60')
        .replace(/text-white/, '')
        .replace(/border-white\/20/, 'border-transparent');
      
      // Reset title and status colors
      const title = item.querySelector('.book-title');
      const status = item.querySelector('.book-status');
      
      if (title) {
        title.className = title.className.replace(/text-white/, 'text-gray-800 hover:text-primary');
      }
      if (status) {
        status.className = status.className.replace(/text-green-300/, 'text-green-600');
        status.textContent = '✓';
      }
    });
    
    // Add selection to clicked book - apply selected Tailwind classes
    bookElement.className = bookElement.className
      .replace(/bg-white\/60/, 'bg-gradient-to-br from-primary to-gray-800')
      .replace(/border-transparent/, 'border-white/20') + ' selected text-white';
    
    // Update title and status for selected book
    const selectedTitle = bookElement.querySelector('.book-title');
    const selectedStatus = bookElement.querySelector('.book-status');
    
    if (selectedTitle) {
      selectedTitle.className = selectedTitle.className.replace(/text-gray-800 hover:text-primary/, 'text-white');
    }
    if (selectedStatus) {
      selectedStatus.className = selectedStatus.className.replace(/text-green-600/, 'text-green-300');
      selectedStatus.textContent = '✓';
    }
    
    this.selectedBook = bookId;
    
    // Update the chapter controller with the selected book
    if (window.chapterPageController) {
      window.chapterPageController.bookname = bookName;
    }
    
    // Load and display chapters for selected book
    this.loadBookChapters(bookId);  // Use bookId instead of bookName
    
    // Show success message
  }

  showBookSelection(message) {
    // Create a temporary selection message
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
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
    messageDiv.textContent = message;

    document.body.appendChild(messageDiv);

    // Remove after 2 seconds
    setTimeout(() => {
      messageDiv.remove();
    }, 2000);
  }

  displayError(message) {
    if (!this.libraryContainer) return;
    
    this.libraryContainer.innerHTML = `<p class="text-center py-8 px-4 text-red-500 text-sm font-medium">${message}</p>`;
  }

  async loadBookChapters(bookname) {
    try {
      const response = await fetch(`/api/book-chapters/${bookname}`);
      const data = await response.json();
      
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
      
      // DUPLICATE: Add hover shimmer effect - exact same as library (lines 97-110)
      /*
      item.addEventListener('mouseenter', () => {
        const shimmer = item.querySelector('.chapter-shimmer');
        shimmer.style.left = '100%';
        setTimeout(() => {
          shimmer.style.left = '-100%';
        }, 700);
      });
      
      // Reset shimmer on mouse leave for smoother experience
      item.addEventListener('mouseleave', () => {
        const shimmer = item.querySelector('.chapter-shimmer');
        shimmer.style.left = '-100%';
      });
      */
    });

    // Add clear selection button listener
    const clearBtn = this.menuChapters.querySelector('.clear-selection');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearChapterSelection());
    }
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
      const chapterStatus = item.querySelector('.chapter-status');
      
      if (isSelected) {
        // Apply selected state - same as library items
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
        if (chapterStatus) {
          chapterStatus.className = chapterStatus.className.replace(/text-green-600/, 'text-green-300');
          chapterStatus.textContent = '✓';
        }
      } else {
        // Apply unselected state - same as library items
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
        if (chapterStatus) {
          chapterStatus.className = chapterStatus.className.replace(/text-green-300/, 'text-green-600');
          chapterStatus.textContent = '';
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
    const chapterElements = this.menuChapters.querySelectorAll('.chapter-item');
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

const navbar = new NavBar();

class AddLibraryModal {
    constructor() {
        this.modal = document.getElementById('add-library-modal');
        this.addButton = document.querySelector('.navbar-library > div:last-child p');
        this.closeButton = document.querySelector('#add-library-modal span');
        this.cancelButton = document.getElementById('cancel-btn');
        this.form = document.getElementById('add-library-form');

        this.init();
    }

    init() {
        this.addButton.addEventListener('click', () => this.handleAddButtonClick());
        this.closeButton.addEventListener('click', () => this.closeModal());
        this.cancelButton.addEventListener('click', () => this.closeModal());

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.closeModal();
            }
        });
    }



    openModal() {
        this.modal.style.display = 'flex';
        document.getElementById('title').focus();
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.form.reset();
        document.body.style.overflow = 'auto';
    }

    async handleAddButtonClick() {
        await cleanWorkspace();
        this.openModal();
    }

async handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(this.form);
    const title = formData.get('title');
    const author = formData.get('author');
    const bookFile = formData.get('pdf-file');

    if (!title.trim()) {
        alert('Title is required.');
        return;
    }

    if (!bookFile || bookFile.size === 0) {
        alert('Please upload a PDF or EPUB file.');
        return;
    }

    const allowedTypes = ['application/pdf', 'application/epub+zip'];
    if (!allowedTypes.includes(bookFile.type)) {
        alert('Only PDF or EPUB files are allowed.');
        return;
    }

    try {
        const uploadFormData = new FormData();
        uploadFormData.append('title', title.trim());
        uploadFormData.append('author', author.trim() || 'Unknown Author');
        uploadFormData.append('book-file', bookFile);

        const response = await fetch('/api/upload-book', {
            method: 'POST',
            body: uploadFormData
        });

        const data = await response.json();

        if (data.success) {
            this.closeModal();
            if (navbar) {
                await navbar.loadLibraryBooks();
            }

            setTimeout(() => {
                showChapterModal(data.bookname);
            }, 1000);
        } else {
            throw new Error(data.error || 'Book upload failed.');
        }

    } catch (error) {
        console.error('Upload error:', error);
        alert(`Error: ${error.message}`);
    }
}

}

const libraryModal = new AddLibraryModal();

class GenerateController {
    constructor() {
        this.generateBtn = document.getElementById('genera-btn');
        this.resultContent = document.getElementById('result-content');
        this.isGenerating = false;
        this.currentGeneration = null;
        this.init();
    }

    init() {
        if (this.generateBtn) {
            this.generateBtn.addEventListener('click', () => this.handleGenerate());
        }

        // Restore state on page load
        this.restoreGenerationState();

        // Handle page unload during generation
        window.addEventListener('beforeunload', (e) => {
            if (this.isGenerating) {
                e.preventDefault();
                e.returnValue = 'È in corso una generazione. Sei sicuro di voler uscire?';
                return e.returnValue;
            }
        });

        // Periodically save state during generation
        setInterval(() => {
            if (this.isGenerating && this.currentGeneration) {
                this.saveGenerationState();
            }
        }, 1000);
    }

    handleGenerate() {
        // Check if a book is selected
        if (!navbar.selectedBook) {
            alert('Chose a Book!');
            return;
        }

        // Get selected chapters
        const selectedChapters = navbar.getSelectedChaptersInfo();
        
        if (selectedChapters.length === 0) {
            alert('Seleziona almeno un capitolo da generare!');
            return;
        }

        // Show what will be generated
        const bookName = navbar.selectedBook;
        const chapterList = selectedChapters.map(ch => `Cap ${ch.number}: ${ch.title}`).join('\n');
        this.startGeneration(bookName, selectedChapters);
    }

    async startGeneration(bookName, chapters) {
        // Set generation state
        this.isGenerating = true;
        this.currentGeneration = {
            bookName: bookName,
            chapters: chapters,
            startTime: Date.now(),
            status: 'starting'
        };

        // Save initial state
        this.saveGenerationState();

        // Update UI
        this.generateBtn.disabled = true;
        this.updateGenerationProgress('Iniziando generazione...', 0);

        try {
            // Prepare selected chapter IDs for the API
            const selectedChapterIds = chapters.map(ch => ch.id);
            
            this.currentGeneration.status = 'processing';
            this.updateGenerationProgress('Elaborando capitoli...', 30);

            // Call the Gemini generation API
            const response = await fetch('/api/gemini-generation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bookname: bookName,
                    selectedChapters: selectedChapterIds
                })
            });

            this.updateGenerationProgress('Ricevendo risposta da Gemini...', 70);

            const result = await response.json();

            if (result.success) {
                this.currentGeneration.status = 'completed';
                this.currentGeneration.result = result.data;
                this.updateGenerationProgress('Completato!', 100);
                
                // Show results
                this.displayGenerationResults(result.data);
                this.showSuccess(`Generazione completata per ${result.data.total_chapters} capitoli!`);
                
                // Clear saved state since completed
                this.clearGenerationState();
            } else {
                throw new Error(result.error || 'Unknown error in generation');
            }
            
        } catch (error) {
            console.error('Generation error:', error);
            this.currentGeneration.status = 'error';
            this.currentGeneration.error = error.message;
            alert(`Errore durante la generazione: ${error.message}`);
            this.clearGenerationState();
        } finally {
            // Reset state
            this.isGenerating = false;
            this.currentGeneration = null;
            
            // Re-enable button
            this.generateBtn.disabled = false;
            this.generateBtn.innerHTML = '<span class="text-xl">⚡</span> Genera';
            
            // Sync reset to mobile button
            if (window.mobileController && window.mobileController.mobileGeneraBtn) {
                window.mobileController.mobileGeneraBtn.disabled = false;
                window.mobileController.mobileGeneraBtn.innerHTML = '<span class="text-xl">⚡</span> Genera';
            }
        }
    }

    displayGenerationResults(data) {
        // Display results in the UI
        if (this.resultContent) {
            // Convert markdown to HTML using marked.js
            const htmlContent = marked.parse(data.gemini_summary);
            
            // Add book and chapter information at the top
           const bookInfo = `
              <div class="border-l-4 border-primary rounded-xl mb-5 p-4">
                <p class="text-sm text-gray-600 m-0">
                  <strong>Capitoli analizzati:</strong> ${data.total_chapters} 
                  (${data.chapters.map(ch => `Cap ${ch.chapter_number}`).join(', ')})
                </p>
              </div>
            `;

            const fullContent = bookInfo + htmlContent;
            
            // Set the content for desktop
            this.resultContent.innerHTML = fullContent;
            
            // Sync content to mobile
            if (window.mobileController) {
                window.mobileController.syncResultContent(fullContent);
            }
            
            // Scroll to results area
            this.resultContent.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }

    updateGenerationProgress(message, percentage) {
        const progressHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span>${message}</span>
            </div>
            <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin-top: 8px;">
                <div style="width: ${percentage}%; height: 100%; background: white; border-radius: 2px; transition: width 0.3s ease;"></div>
            </div>
        `;
        
        this.generateBtn.innerHTML = progressHTML;
        
        // Sync progress to mobile button
        if (window.mobileController && window.mobileController.mobileGeneraBtn) {
            window.mobileController.mobileGeneraBtn.innerHTML = progressHTML;
        }
    }

    saveGenerationState() {
        if (this.currentGeneration) {
            localStorage.setItem('aiReadBrief_generationState', JSON.stringify({
                ...this.currentGeneration,
                timestamp: Date.now()
            }));
        }
    }

    restoreGenerationState() {
        try {
            const savedState = localStorage.getItem('aiReadBrief_generationState');
            if (savedState) {
                const state = JSON.parse(savedState);
                const timeElapsed = Date.now() - state.timestamp;
                
                // If more than 5 minutes passed, consider it expired
                if (timeElapsed > 5 * 60 * 1000) {
                    this.clearGenerationState();
                    return;
                }

                // Show recovery dialog
                if (state.status === 'processing' || state.status === 'starting') {
                    this.showRecoveryDialog(state);
                } else if (state.status === 'completed' && state.result) {
                    // Restore completed results
                    this.displayGenerationResults(state.result);
                    this.clearGenerationState();
                }
            }
        } catch (error) {
            console.error('Error restoring generation state:', error);
            this.clearGenerationState();
        }
    }

    showRecoveryDialog(state) {
        const timeElapsed = Math.round((Date.now() - state.startTime) / 1000);
        const message = `È stata rilevata una generazione interrotta per "${state.bookName}".\n\nTempo trascorso: ${timeElapsed}s\n\nVuoi riprovare la generazione?`;
        
        if (confirm(message)) {
            // Restart generation
            this.startGeneration(state.bookName, state.chapters);
        } else {
            this.clearGenerationState();
        }
    }

    clearGenerationState() {
        localStorage.removeItem('aiReadBrief_generationState');
    }



    showSuccess(message) {
        // Create a success message
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

const generateController = new GenerateController();

class ChapterPageController {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 24; // Default value
        this.bookname = null; // Will be set when book is selected
        
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

    confirmpage() {
        console.log('Extracting chapters using page:', this.currentPage);
        this.extractChapters();
    }

    async extractChapters() {
        if (!this.bookname) {
            alert('Nessun libro selezionato');
            return;
        }
        
        try {
            const response = await fetch('/api/analyze-chapter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    bookname: this.bookname,
                    pageNumber: this.currentPage
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.displayChaptersList(data);
            } else {
                throw new Error(data.error || 'Unknown error in chapter extraction');
            }
        } catch (error) {
            console.error('Errore durante l\'estrazione dei capitoli:', error);
            alert(`Errore nell'estrazione: ${error.message}`);
        }
    }

displayChaptersList(data) {
  const resultContainer = document.getElementById('chapter-result');
  if (!resultContainer) return;

  this.currentChaptersData = data;

  resultContainer.innerHTML = /* html */`
    <div class="card bg-white shadow rounded-lg p-6 space-y-6
                flex flex-col h-full">          <!-- flex-column -->

        <!-- HEADER + LISTA ------------------------------------------------ -->
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
                                <span class="page-range">
                                    Pages ${ch.startPage}-${ch.endPage}
                                </span>
                                <span class="page-count">
                                    (${ch.pageCount} pages)
                                </span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- FOOTER FISSO --------------------------------------------------- -->
        <div class="chapter-save-button-container">
            <button id="save-chapters-btn"
                    class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl
                           font-semibold shadow-lg bg-primary text-white
                           transition hover:bg-gray-700">
                Save
            </button>
        </div>
    </div>
  `;

  this.connectSaveButton();
  resultContainer.scrollIntoView({behavior: 'smooth', block: 'nearest'});
}


    connectSaveButton() {
        const saveBtn = document.getElementById('save-chapters-btn');
        if (saveBtn && !saveBtn.hasAttribute('data-connected')) {
            saveBtn.addEventListener('click', () => this.saveChapters());
            saveBtn.setAttribute('data-connected', 'true');
        }
    }

    async saveChapters() {
        if (!this.currentChaptersData) {
            alert('Nessun dato sui capitoli disponibile. Estrai prima i capitoli.');
            return;
        }

        try {
            const response = await fetch('/api/save-chapters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    bookname: this.bookname,
                    chaptersData: this.currentChaptersData
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                alert(`PDF diviso con successo in ${result.totalChapters} capitoli!\nCartella: ${result.outputDirectory}`);
            } else {
                throw new Error(result.error || 'Errore sconosciuto');
            }
        } catch (error) {
            console.error('Errore durante il salvataggio:', error);
            alert(`Errore nel salvataggio: ${error.message}`);
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

        // Carica l'immagine reale dal server
        const imageUrl = `/api/book-image/${this.bookname}/${this.currentPage}`;
        
        const timestamp = new Date().getTime();
        this.pageImage.src = `${imageUrl}?t=${timestamp}`;
        this.pageImage.style.opacity = '0.7';
        
        this.pageImage.onload = () => {
            this.pageImage.style.opacity = '1';
            console.log(`Immagine caricata con successo per la pagina ${this.currentPage}`);
        };
        
        this.pageImage.onerror = () => {
            console.error(`Errore nel caricamento dell'immagine per la pagina ${this.currentPage}`);
            // Fallback a un'immagine placeholder
            this.pageImage.src = `https://via.placeholder.com/400x600/334155/ffffff?text=Page+${this.currentPage}+(Not+Found)`;
            this.pageImage.style.opacity = '1';
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

    async initializeBookElaboration() {
        if (!this.bookname) {
            console.log('No bookname set, skipping book elaboration');
            return;
        }
        
        try {
            const response = await fetch('/api/bookelaboration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bookname: this.bookname })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.totalPages = data.pages;
                console.log(`Book elaborated successfully. Total pages: ${this.totalPages}`);
                this.updatePageNumberDisplay();
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Errore durante l\'elaborazione del libro:', error);
            // Use default values if elaboration fails
            console.log('Using default values due to elaboration error');
        }
    }

    updatePageNumberDisplay() {
        // Update the "of 24" part in the page number display
        const pageNumberDiv = document.querySelector('#page-number');
        if (pageNumberDiv) {
            pageNumberDiv.innerHTML = `Page <input type="number" min="1" max="${this.totalPages}" value="${this.currentPage}"> of ${this.totalPages}`;
            
            // Re-get the input reference since we recreated it
            this.pageInput = document.querySelector('#page-number input[type="number"]');
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
}

// Initialize page controller when modal is opened
let chapterPageController = null;
window.chapterPageController = null;

// Initialize chapter modal functionality but don't show it immediately
document.addEventListener('DOMContentLoaded', function() {
    const chapterModal = document.getElementById('chapter-confirmation');

    if (chapterModal) {
        // Don't initialize controller until we have a book

        // Close modal functionality
        const closeBtn = document.querySelector('.close-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                chapterModal.classList.remove('show');
                document.body.style.overflow = 'auto';
            });
        }

        // Close on background click
        chapterModal.addEventListener('click', function(e) {
            if (e.target === chapterModal) {
                chapterModal.classList.remove('show');
                document.body.style.overflow = 'auto';
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && chapterModal.classList.contains('show')) {
                chapterModal.classList.remove('show');
                document.body.style.overflow = 'auto';
            }
        });
    }
});

// Function to clean workspace on startup
async function cleanWorkspace() {
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
    }
}

// Function to show chapter modal with selected book
function showChapterModal(bookname) {
    const chapterModal = document.getElementById('chapter-confirmation');
    
    if (chapterModal) {
        chapterModal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Initialize or update controller
        if (!window.chapterPageController) {
            // Create controller for the first time
            setTimeout(() => {
                chapterPageController = new ChapterPageController();
                window.chapterPageController = chapterPageController;
                chapterPageController.bookname = bookname;
                chapterPageController.initializeBookElaboration();
            }, 100);
        } else {
            // Update existing controller with new book name
            window.chapterPageController.bookname = bookname;
            window.chapterPageController.currentPage = 1;
            window.chapterPageController.updateDisplay();
            window.chapterPageController.updateImage();
            // Re-initialize book elaboration for the new book
            window.chapterPageController.initializeBookElaboration();
        }
    }
}

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

// Mobile Controller for responsive design
class MobileController {
  constructor() {
    this.mobileLibraryBtn = document.getElementById('mobile-library-btn');
    this.mobileChaptersBtn = document.getElementById('mobile-chapters-btn');
    this.mobileLibraryDrawer = document.getElementById('mobile-library-drawer');
    this.mobileChaptersDrawer = document.getElementById('mobile-chapters-drawer');
    this.mobileBackdrop = document.getElementById('mobile-backdrop');
    this.closeMobileLibrary = document.getElementById('close-mobile-library');
    this.closeMobileChapters = document.getElementById('close-mobile-chapters');
    this.mobileAddLibrary = document.getElementById('mobile-add-library');
    this.mobileGeneraBtn = document.getElementById('mobile-genera-btn');
    this.mobileLibraryContainer = document.getElementById('mobile-library-container');
    this.mobileChaptersContainer = document.getElementById('mobile-navbar-chapters');
    this.mobileResultContent = document.getElementById('mobile-result-content');
    
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
        if (window.libraryModal) {
          window.libraryModal.handleAddButtonClick();
        }
      });
    }

    // Generate button
    if (this.mobileGeneraBtn && window.generateController) {
      this.mobileGeneraBtn.addEventListener('click', () => {
        if (window.generateController) {
          window.generateController.handleGenerate();
        }
      });
    }
  }

  openLibraryDrawer() {
    this.closeChaptersDrawer();
    if (this.mobileLibraryDrawer) {
      this.mobileLibraryDrawer.classList.add('mobile-drawer-open');
    }
    if (this.mobileBackdrop) {
      this.mobileBackdrop.classList.add('mobile-backdrop-open');
    }
    // Copy library content to mobile
    this.syncLibraryContent();
  }

  closeLibraryDrawer() {
    if (this.mobileLibraryDrawer) {
      this.mobileLibraryDrawer.classList.remove('mobile-drawer-open');
    }
    if (this.mobileBackdrop) {
      this.mobileBackdrop.classList.remove('mobile-backdrop-open');
    }
  }

  openChaptersDrawer() {
    this.closeLibraryDrawer();
    if (this.mobileChaptersDrawer) {
      this.mobileChaptersDrawer.classList.add('mobile-drawer-open');
    }
    if (this.mobileBackdrop) {
      this.mobileBackdrop.classList.add('mobile-backdrop-open');
    }
    // Copy chapters content to mobile
    this.syncChaptersContent();
  }

  closeChaptersDrawer() {
    if (this.mobileChaptersDrawer) {
      this.mobileChaptersDrawer.classList.remove('mobile-drawer-open');
    }
    if (this.mobileBackdrop) {
      this.mobileBackdrop.classList.remove('mobile-backdrop-open');
    }
  }

  closeAllDrawers() {
    this.closeLibraryDrawer();
    this.closeChaptersDrawer();
  }

  syncLibraryContent() {
    if (window.navbar && this.mobileLibraryContainer) {
      const desktopContent = document.getElementById('library-container');
      if (desktopContent) {
        this.mobileLibraryContainer.innerHTML = desktopContent.innerHTML;
        
        // DUPLICATE: Re-add event listeners for mobile library items (similar to lines 92-95)
        /*
        this.mobileLibraryContainer.querySelectorAll('.library-book-item').forEach(item => {
          item.addEventListener('click', () => {
            if (window.navbar) {
              window.navbar.selectBook(item);
              this.closeLibraryDrawer();
            }
          });
        });
        */
      }
    }
  }

  syncChaptersContent() {
    if (window.navbar && this.mobileChaptersContainer) {
      const desktopContent = document.getElementById('navbar-chapters');
      if (desktopContent) {
        this.mobileChaptersContainer.innerHTML = desktopContent.innerHTML;
        
        // DUPLICATE: Re-add event listeners for mobile chapter items (similar to lines 267-268)
        /*
        this.mobileChaptersContainer.querySelectorAll('.chapter-item').forEach(item => {
          item.addEventListener('click', (e) => {
            if (window.navbar) {
              window.navbar.selectChapter(item, e);
            }
          });
        });
        */
      }
    }
  }

  syncResultContent(content) {
    if (this.mobileResultContent) {
      this.mobileResultContent.innerHTML = content;
    }
  }
}

// Initialize mobile controller when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    window.mobileController = new MobileController();
  });
} else {
  window.mobileController = new MobileController();
}
