/**
 * GenerateController - Manages summary generation functionality
 */
import APIClient from '../utils/api.js';
import notifications from '../utils/notifications.js';
import { DOMHelpers } from '../utils/domHelpers.js';

export class GenerateController {
  constructor() {
    this.generateBtn = DOMHelpers.getElementById('genera-btn');
    this.mobileGenerateBtn = DOMHelpers.getElementById('mobile-genera-btn');
    this.resultContent = DOMHelpers.getElementById('result-content');
    this.mobileResultContent = DOMHelpers.getElementById('mobile-result-content');
    this.isGenerating = false;
    this.currentGeneration = null;
    
    this.init();
  }

  init() {
    // Desktop generate button
    if (this.generateBtn) {
      this.generateBtn.addEventListener('click', () => this.handleGenerate());
    }

    // Mobile generate button  
    if (this.mobileGenerateBtn) {
      this.mobileGenerateBtn.addEventListener('click', () => this.handleGenerate());
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
    if (!window.navbar || !window.navbar.selectedBook) {
      notifications.warning('Choose a Book!');
      return;
    }

    // Get selected chapters
    const selectedChapters = window.navbar.getSelectedChaptersInfo();
    
    if (selectedChapters.length === 0) {
      notifications.warning('Seleziona almeno un capitolo da generare!');
      return;
    }

    // Start generation
    const bookName = window.navbar.selectedBook;
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
    this.disableButtons();
    this.updateGenerationProgress('Iniziando generazione...', 0);

    try {
      // Prepare selected chapter IDs for the API
      const selectedChapterIds = chapters.map(ch => ch.id);
      
      this.currentGeneration.status = 'processing';
      this.updateGenerationProgress('Elaborando capitoli...', 30);

      // Call the Gemini generation API
      const result = await APIClient.generateSummary(bookName, selectedChapterIds);

      this.updateGenerationProgress('Ricevendo risposta da Gemini...', 70);

      if (result.success) {
        this.currentGeneration.status = 'completed';
        this.currentGeneration.result = result.data;
        this.updateGenerationProgress('Completato!', 100);
        
        // Show results
        this.displayGenerationResults(result.data);
        notifications.success(`Generazione completata per ${result.data.total_chapters} capitoli!`);
        
        // Clear saved state since completed
        this.clearGenerationState();
      } else {
        throw new Error(result.error || 'Unknown error in generation');
      }
      
    } catch (error) {
      console.error('Generation error:', error);
      this.currentGeneration.status = 'error';
      this.currentGeneration.error = error.message;
      notifications.error(`Errore durante la generazione: ${error.message}`);
      this.clearGenerationState();
    } finally {
      // Reset state
      this.isGenerating = false;
      this.currentGeneration = null;
      this.resetButtons();
    }
  }

  displayGenerationResults(data) {
    if (!data || !data.gemini_summary) {
      notifications.error('No summary data received');
      return;
    }

    try {
      // Convert markdown to HTML using marked.js
      const htmlContent = marked.parse(data.gemini_summary);
      
      // Add book and chapter information at the top
      const bookInfo = `
        <div class="border-l-4 border-primary rounded-xl mb-5 p-4 bg-blue-50">
          <p class="text-sm text-gray-600 m-0">
            <strong>Capitoli analizzati:</strong> ${data.total_chapters} 
            (${data.chapters.map(ch => `Cap ${ch.chapter_number}`).join(', ')})
          </p>
        </div>
      `;

      const fullContent = bookInfo + htmlContent;
      
      // Set content for desktop
      if (this.resultContent) {
        this.resultContent.innerHTML = fullContent;
        DOMHelpers.scrollToElement(this.resultContent);
      }
      
      // Set content for mobile
      if (this.mobileResultContent) {
        this.mobileResultContent.innerHTML = fullContent;
        DOMHelpers.scrollToElement(this.mobileResultContent);
      }
      
      // Sync to mobile controller if exists
      if (window.mobileController && window.mobileController.syncResultContent) {
        window.mobileController.syncResultContent(fullContent);
      }

    } catch (error) {
      console.error('Error displaying results:', error);
      notifications.error('Error displaying results');
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
    
    if (this.generateBtn) {
      this.generateBtn.innerHTML = progressHTML;
    }
    
    if (this.mobileGenerateBtn) {
      this.mobileGenerateBtn.innerHTML = progressHTML;
    }
  }

  disableButtons() {
    if (this.generateBtn) {
      this.generateBtn.disabled = true;
    }
    if (this.mobileGenerateBtn) {
      this.mobileGenerateBtn.disabled = true;
    }
  }

  resetButtons() {
    const defaultHTML = '<span class="text-xl">⚡</span> Genera';
    
    if (this.generateBtn) {
      this.generateBtn.disabled = false;
      this.generateBtn.innerHTML = defaultHTML;
    }
    
    if (this.mobileGenerateBtn) {
      this.mobileGenerateBtn.disabled = false;
      this.mobileGenerateBtn.innerHTML = defaultHTML;
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

  // Public methods for external control
  isCurrentlyGenerating() {
    return this.isGenerating;
  }

  cancelGeneration() {
    if (this.isGenerating) {
      this.isGenerating = false;
      this.currentGeneration = null;
      this.resetButtons();
      this.clearGenerationState();
      notifications.info('Generation cancelled');
    }
  }
}