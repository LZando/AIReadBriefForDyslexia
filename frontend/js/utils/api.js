/**
 * API utility functions for making HTTP requests
 */

class APIClient {
  constructor() {
    this.baseURL = '/api';
  }

  /**
   * Generic request method
   */
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Get library books
   */
  async getLibraryBooks() {
    return this.request('/library');
  }

  /**
   * Delete book
   */
  async deleteBook(bookId) {
    return this.request(`/library/${bookId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get book chapters
   */
  async getBookChapters(bookId) {
    return this.request(`/book-chapters/${bookId}`);
  }

  /**
   * Generate summary
   */
  async generateSummary(bookId, chapters) {
    return this.request('/gemini-generation', {
      method: 'POST',
      body: JSON.stringify({ 
        bookname: bookId, 
        selectedChapters: chapters 
      })
    });
  }

  /**
   * Upload book
   */
  async uploadBook(formData) {
    try {
      const response = await fetch(`${this.baseURL}/upload-book`, {
        method: 'POST',
        body: formData // Don't set Content-Type for FormData
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  /**
   * Book elaboration
   */
  async bookElaboration(bookname) {
    return this.request('/bookelaboration', {
      method: 'POST',
      body: JSON.stringify({ bookname })
    });
  }

  /**
   * Analyze chapter
   */
  async analyzeChapter(bookname, pageNumber) {
    return this.request('/analyze-chapter', {
      method: 'POST',
      body: JSON.stringify({ bookname, pageNumber })
    });
  }

  /**
   * Save chapters
   */
  async saveChapters(bookname, chapters) {
    return this.request('/save-chapters', {
      method: 'POST',
      body: JSON.stringify({ bookname, chapters })
    });
  }

  /**
   * Get page image
   */
  getPageImageURL(bookname, pageNumber) {
    return `/api/book-image/${bookname}/${pageNumber}`;
  }
}

// Export singleton instance
export default new APIClient();