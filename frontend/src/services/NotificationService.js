// Notification Service for user feedback

export class NotificationService {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.nextId = 1;
        this.defaultDuration = 5000; // 5 seconds
        
        this.initialize();
    }

    initialize() {
        // Find or create notifications container
        this.container = document.getElementById('notifications-container');
        
        if (!this.container) {
            console.warn('Notifications container not found');
            return;
        }

        // Set up container styles if needed
        this.setupContainer();
    }

    setupContainer() {
        if (!this.container) return;
        
        // Ensure container has proper positioning
        if (!this.container.classList.contains('fixed')) {
            this.container.classList.add('fixed', 'top-4', 'right-4', 'z-40', 'space-y-2');
        }
    }

    show(message, type = 'info', options = {}) {
        if (!this.container) {
            console.log(`[${type.toUpperCase()}] ${message}`);
            return null;
        }

        const notification = {
            id: this.nextId++,
            message,
            type,
            timestamp: Date.now(),
            duration: options.duration !== undefined ? options.duration : this.defaultDuration,
            persistent: options.persistent || false,
            actions: options.actions || [],
            onClick: options.onClick,
            onClose: options.onClose
        };

        this.notifications.push(notification);
        this.renderNotification(notification);

        // Auto-remove if not persistent
        if (!notification.persistent && notification.duration > 0) {
            setTimeout(() => {
                this.remove(notification.id);
            }, notification.duration);
        }

        return notification.id;
    }

    renderNotification(notification) {
        const element = this.createNotificationElement(notification);
        this.container.appendChild(element);

        // Trigger animation
        requestAnimationFrame(() => {
            element.classList.add('notification-enter');
        });
    }

    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.id = `notification-${notification.id}`;
        element.className = this.getNotificationClasses(notification.type);
        
        // Handle click if provided
        if (notification.onClick) {
            element.style.cursor = 'pointer';
            element.addEventListener('click', notification.onClick);
        }

        element.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    ${this.getNotificationIcon(notification.type)}
                </div>
                <div class="ml-3 w-0 flex-1 pt-0.5">
                    <p class="text-sm font-medium text-gray-900">
                        ${this.escapeHtml(notification.message)}
                    </p>
                    ${this.renderActions(notification.actions)}
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                    <button class="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            onclick="window.notificationService.remove(${notification.id})">
                        <span class="sr-only">Close</span>
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        return element;
    }

    renderActions(actions) {
        if (!actions || actions.length === 0) {
            return '';
        }

        const actionsHtml = actions.map(action => `
            <button class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 mr-2 mt-2"
                    onclick="${action.onClick}">
                ${this.escapeHtml(action.label)}
            </button>
        `).join('');

        return `<div class="mt-2">${actionsHtml}</div>`;
    }

    getNotificationClasses(type) {
        const baseClasses = 'notification max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-out translate-x-full opacity-0';
        
        const typeClasses = {
            success: 'border-l-4 border-success-400',
            error: 'border-l-4 border-danger-400',
            warning: 'border-l-4 border-warning-400',
            info: 'border-l-4 border-primary-400'
        };

        return `${baseClasses} ${typeClasses[type] || typeClasses.info} p-4`;
    }

    getNotificationIcon(type) {
        const icons = {
            success: `
                <svg class="h-6 w-6 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            `,
            error: `
                <svg class="h-6 w-6 text-danger-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
            `,
            warning: `
                <svg class="h-6 w-6 text-warning-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
            `,
            info: `
                <svg class="h-6 w-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            `
        };

        return icons[type] || icons.info;
    }

    remove(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;

        const element = document.getElementById(`notification-${id}`);
        if (element) {
            // Animate out
            element.classList.add('notification-exit');
            
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        }

        // Remove from array
        this.notifications = this.notifications.filter(n => n.id !== id);

        // Call onClose callback if provided
        if (notification.onClose) {
            notification.onClose();
        }
    }

    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification.id);
        });
    }

    // Convenience methods
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', {
            duration: 8000, // Longer duration for errors
            ...options
        });
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    // Persistent notifications
    persistentSuccess(message, options = {}) {
        return this.success(message, { persistent: true, ...options });
    }

    persistentError(message, options = {}) {
        return this.error(message, { persistent: true, ...options });
    }

    persistentWarning(message, options = {}) {
        return this.warning(message, { persistent: true, ...options });
    }

    persistentInfo(message, options = {}) {
        return this.info(message, { persistent: true, ...options });
    }

    // Confirmation notifications
    confirm(message, onConfirm, onCancel = null) {
        const actions = [
            {
                label: 'Confirm',
                onClick: `window.notificationService.handleConfirm(${this.nextId}, ${onConfirm})`
            },
            {
                label: 'Cancel',
                onClick: `window.notificationService.handleCancel(${this.nextId}, ${onCancel})`
            }
        ];

        return this.show(message, 'warning', {
            persistent: true,
            actions
        });
    }

    handleConfirm(id, callback) {
        this.remove(id);
        if (callback) callback();
    }

    handleCancel(id, callback) {
        this.remove(id);
        if (callback) callback();
    }

    // Loading notifications
    loading(message, options = {}) {
        const loadingIcon = `
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        `;

        return this.show(message, 'info', {
            persistent: true,
            icon: loadingIcon,
            ...options
        });
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getNotificationById(id) {
        return this.notifications.find(n => n.id === id);
    }

    getAllNotifications() {
        return [...this.notifications];
    }

    getNotificationsByType(type) {
        return this.notifications.filter(n => n.type === type);
    }

    // Update notification
    update(id, updates) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return false;

        Object.assign(notification, updates);
        
        const element = document.getElementById(`notification-${id}`);
        if (element) {
            // Re-render the notification
            this.remove(id);
            this.renderNotification(notification);
        }

        return true;
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    .notification-enter {
        transform: translateX(0);
        opacity: 1;
    }
    
    .notification-exit {
        transform: translateX(100%);
        opacity: 0;
    }
`;
document.head.appendChild(style);