/**
 * Notification utility functions
 */

class NotificationManager {
  constructor() {
    this.notifications = new Set();
  }

  /**
   * Show a notification
   */
  show(message, type = 'info', duration = 3000) {
    // Create notification element
    const notification = document.createElement('div');
    const id = Date.now() + Math.random();
    notification.dataset.notificationId = id;
    
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white transition-all duration-300 transform translate-x-full max-w-md max-h-32 overflow-y-auto`;
    
    switch (type) {
      case 'success':
        notification.style.background = '#10b981';
        break;
      case 'error':
        notification.style.background = '#ef4444';
        break;
      case 'warning':
        notification.style.background = '#f59e0b';
        break;
      default:
        notification.style.background = '#3b82f6';
    }
    
    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="flex-1">${message}</span>
        <button class="ml-3 text-white/80 hover:text-white text-lg font-bold" onclick="this.parentElement.parentElement.remove()">&times;</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    this.notifications.add(id);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification);
      }, duration);
    }

    return id;
  }

  /**
   * Show success notification
   */
  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  /**
   * Show error notification
   */
  error(message, duration = 5000) {
    // Truncate very long error messages
    if (message.length > 200) {
      message = message.substring(0, 200) + '...';
    }
    return this.show(message, 'error', duration);
  }

  /**
   * Show warning notification
   */
  warning(message, duration = 4000) {
    return this.show(message, 'warning', duration);
  }

  /**
   * Show info notification
   */
  info(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }

  /**
   * Remove notification
   */
  remove(notification) {
    if (notification && notification.parentNode) {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
          const id = notification.dataset.notificationId;
          if (id) {
            this.notifications.delete(id);
          }
        }
      }, 300);
    }
  }

  /**
   * Mobile-specific notification (top positioned)
   */
  showMobile(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 left-4 right-4 z-50 p-3 rounded-lg shadow-lg text-white transition-all duration-300 transform translate-y-[-20px] opacity-0`;
    
    switch (type) {
      case 'success':
        notification.style.background = '#10b981';
        break;
      case 'error':
        notification.style.background = '#ef4444';
        break;
      case 'warning':
        notification.style.background = '#f59e0b';
        break;
      default:
        notification.style.background = '#3b82f6';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translate(0)';
      notification.style.opacity = '1';
    }, 100);

    // Remove after duration
    setTimeout(() => {
      notification.style.transform = 'translate(0, -20px)';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    const notifications = document.querySelectorAll('[data-notification-id]');
    notifications.forEach(notification => this.remove(notification));
  }
}

// Export singleton instance
export default new NotificationManager();