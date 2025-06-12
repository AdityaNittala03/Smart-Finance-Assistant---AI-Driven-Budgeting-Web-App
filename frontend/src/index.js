// Smart Finance Assistant - Main Application Entry Point

import './styles/main.css';
import { App } from './app/App';
import { AuthService } from './services/AuthService';
import { NotificationService } from './services/NotificationService';

// Import Alpine.js for reactive components
import Alpine from 'alpinejs';

// Initialize Alpine.js
window.Alpine = Alpine;
Alpine.start();

// Main Application Class
class SmartFinanceApp {
    constructor() {
        this.app = null;
        this.authService = new AuthService();
        this.notificationService = new NotificationService();
        
        this.initializeApp();
    }

    async initializeApp() {
        try {
            // Show loading screen
            this.showLoadingScreen();

            // Initialize services
            await this.initializeServices();

            // Create main app instance
            this.app = new App({
                authService: this.authService,
                notificationService: this.notificationService
            });

            // Initialize the app
            await this.app.initialize();

            // Hide loading screen and show app
            this.hideLoadingScreen();

            console.log('🤖 Smart Finance Assistant initialized successfully');

        } catch (error) {
            console.error('Failed to initialize Smart Finance Assistant:', error);
            this.showError('Failed to load application. Please refresh the page.');
        }
    }

    async initializeServices() {
        // Initialize authentication service
        await this.authService.initialize();

        // Initialize notification service
        this.notificationService.initialize();

        // Set up global error handling
        this.setupErrorHandling();

        // Set up API interceptors
        this.setupAPIInterceptors();
    }

    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.notificationService.error('An unexpected error occurred');
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.notificationService.error('An unexpected error occurred');
        });
    }

    setupAPIInterceptors() {
        // Set up global API error handling
        window.addEventListener('auth:unauthorized', () => {
            this.notificationService.warning('Your session has expired. Please log in again.');
            this.authService.logout();
        });

        window.addEventListener('auth:forbidden', () => {
            this.notificationService.error('You do not have permission to access this resource.');
        });

        window.addEventListener('api:server-error', (event) => {
            console.error('Server error:', event.detail);
            this.notificationService.error('Server error occurred. Please try again later.');
        });
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const appContainer = document.getElementById('app');
        
        if (loadingScreen && appContainer) {
            // Add fade out animation
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.3s ease-out';
            
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                appContainer.classList.remove('hidden');
                appContainer.style.opacity = '0';
                appContainer.style.transition = 'opacity 0.3s ease-in';
                
                // Trigger fade in
                setTimeout(() => {
                    appContainer.style.opacity = '1';
                }, 10);
            }, 300);
        }
    }

    showError(message) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="text-center">
                    <div class="text-red-500 mb-4">
                        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                        </svg>
                    </div>
                    <p class="text-gray-800 font-medium mb-4">${message}</p>
                    <button onclick="window.location.reload()" 
                            class="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    window.smartFinanceApp = new SmartFinanceApp();
    
    // Make notification service globally available for components
    window.notificationService = window.smartFinanceApp.notificationService;
});

// Export for testing
export { SmartFinanceApp };