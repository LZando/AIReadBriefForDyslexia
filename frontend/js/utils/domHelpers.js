/**
 * DOM helper utility functions
 */

export const DOMHelpers = {
  /**
   * Get element by ID with error handling
   */
  getElementById(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element with ID '${id}' not found`);
    }
    return element;
  },

  /**
   * Get element by selector with error handling
   */
  querySelector(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`Element with selector '${selector}' not found`);
    }
    return element;
  },

  /**
   * Get elements by selector
   */
  querySelectorAll(selector) {
    return document.querySelectorAll(selector);
  },

  /**
   * Add event listener with automatic cleanup
   */
  addEventListener(element, event, handler, options = {}) {
    if (!element) {
      console.warn('Cannot add event listener to null element');
      return null;
    }
    
    element.addEventListener(event, handler, options);
    
    // Return cleanup function
    return () => {
      element.removeEventListener(event, handler, options);
    };
  },

  /**
   * Add multiple event listeners
   */
  addEventListeners(element, events) {
    const cleanupFunctions = [];
    
    for (const [event, handler, options] of events) {
      const cleanup = this.addEventListener(element, event, handler, options);
      if (cleanup) {
        cleanupFunctions.push(cleanup);
      }
    }
    
    // Return cleanup function for all listeners
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  },

  /**
   * Toggle class on element
   */
  toggleClass(element, className) {
    if (element) {
      element.classList.toggle(className);
    }
  },

  /**
   * Add class to element
   */
  addClass(element, className) {
    if (element) {
      element.classList.add(className);
    }
  },

  /**
   * Remove class from element
   */
  removeClass(element, className) {
    if (element) {
      element.classList.remove(className);
    }
  },

  /**
   * Check if element has class
   */
  hasClass(element, className) {
    return element ? element.classList.contains(className) : false;
  },

  /**
   * Set multiple classes
   */
  setClasses(element, classesToAdd = [], classesToRemove = []) {
    if (!element) return;
    
    classesToRemove.forEach(cls => element.classList.remove(cls));
    classesToAdd.forEach(cls => element.classList.add(cls));
  },

  /**
   * Create element with attributes and classes
   */
  createElement(tag, options = {}) {
    const element = document.createElement(tag);
    
    if (options.className) {
      element.className = options.className;
    }
    
    if (options.id) {
      element.id = options.id;
    }
    
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    
    if (options.innerHTML) {
      element.innerHTML = options.innerHTML;
    }
    
    if (options.textContent) {
      element.textContent = options.textContent;
    }
    
    return element;
  },

  /**
   * Show element
   */
  show(element) {
    if (element) {
      element.style.display = '';
      element.classList.remove('hidden');
    }
  },

  /**
   * Hide element
   */
  hide(element) {
    if (element) {
      element.classList.add('hidden');
    }
  },

  /**
   * Check if element is visible
   */
  isVisible(element) {
    if (!element) return false;
    return element.offsetParent !== null && !element.classList.contains('hidden');
  },

  /**
   * Wait for DOM to be ready
   */
  ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  },

  /**
   * Smooth scroll to element
   */
  scrollToElement(element, options = {}) {
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        ...options
      });
    }
  },

  /**
   * Get form data as object
   */
  getFormData(form) {
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    return data;
  },

  /**
   * Prevent body scroll (useful for modals)
   */
  preventBodyScroll() {
    document.body.style.overflow = 'hidden';
  },

  /**
   * Allow body scroll
   */
  allowBodyScroll() {
    document.body.style.overflow = '';
  },

  /**
   * Get viewport dimensions
   */
  getViewportSize() {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  },

  /**
   * Check if mobile device
   */
  isMobile() {
    return window.innerWidth <= 1024 || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  /**
   * Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};