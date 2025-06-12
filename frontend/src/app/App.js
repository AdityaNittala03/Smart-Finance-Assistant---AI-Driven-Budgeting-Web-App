// Main Application Class

import { Router } from './Router';
import { NavigationComponent } from '../components/Navigation';
import { DashboardPage } from '../pages/DashboardPage';
import { TransactionsPage } from '../pages/TransactionsPage';
import { BudgetsPage } from '../pages/BudgetsPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

export class App {
    constructor(options = {}) {
        this.authService = options.authService;
        this.notificationService = options.notificationService;
        this.router = null;
        this.navigation = null;
        this.currentUser = null;
        
        // Bind methods
        this.handleAuthStateChange = this.handleAuthStateChange.bind(this);
    }

    async initialize() {
        try {
            // Set up authentication state listener
            this.authService.onAuthStateChange(this.handleAuthStateChange);

            // Initialize router
            this.initializeRouter();

            // Check initial authentication state
            const isAuthenticated = await this.authService.isAuthenticated();
            
            if (isAuthenticated) {
                this.currentUser = await this.authService.getCurrentUser();
                this.initializeAuthenticatedApp();
            } else {
                this.initializePublicApp();
            }

            // Start the router
            this.router.start();

            console.log('App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            throw error;
        }
    }

    initializeRouter() {
        this.router = new Router({
            routes: {
                // Public routes
                '/': () => this.redirectBasedOnAuth(),
                '/login': () => this.renderPage(LoginPage),
                '/register': () => this.renderPage(RegisterPage),
                
                // Protected routes
                '/dashboard': () => this.renderProtectedPage(DashboardPage),
                '/transactions': () => this.renderProtectedPage(TransactionsPage),
                '/budgets': () => this.renderProtectedPage(BudgetsPage),
                '/analytics': () => this.renderProtectedPage(AnalyticsPage),
            },
            notFoundHandler: () => this.renderNotFound()
        });
    }

    initializeAuthenticatedApp() {
        // Initialize navigation for authenticated users
        this.navigation = new NavigationComponent({
            user: this.currentUser,
            onLogout: () => this.logout()
        });
        
        this.navigation.render();
        
        // Show authenticated layout
        document.getElementById('navbar').classList.remove('hidden');
    }

    initializePublicApp() {
        // Hide navigation for public pages
        document.getElementById('navbar').classList.add('hidden');
        
        // Clear any existing navigation
        if (this.navigation) {
            this.navigation.destroy();
            this.navigation = null;
        }
    }

    async handleAuthStateChange(user) {
        this.currentUser = user;
        
        if (user) {
            // User logged in
            this.initializeAuthenticatedApp();
            
            // Redirect to dashboard if on public page
            const currentPath = window.location.pathname;
            if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
                this.router.navigate('/dashboard');
            }
        } else {
            // User logged out
            this.initializePublicApp();
            
            // Redirect to login
            this.router.navigate('/login');
        }
    }

    async redirectBasedOnAuth() {
        const isAuthenticated = await this.authService.isAuthenticated();
        
        if (isAuthenticated) {
            this.router.navigate('/dashboard');
        } else {
            this.router.navigate('/login');
        }
    }

    async renderProtectedPage(PageClass) {
        // Check authentication
        const isAuthenticated = await this.authService.isAuthenticated();
        
        if (!isAuthenticated) {
            this.router.navigate('/login');
            return;
        }

        this.renderPage(PageClass);
    }

    renderPage(PageClass) {
        const mainContent = document.getElementById('main-content');
        
        if (!mainContent) {
            console.error('Main content container not found');
            return;
        }

        // Clear existing content
        mainContent.innerHTML = '';

        // Create and render new page
        const page = new PageClass({
            authService: this.authService,
            notificationService: this.notificationService,
            router: this.router,
            user: this.currentUser
        });

        // Render the page
        page.render(mainContent);

        // Update navigation active state
        if (this.navigation) {
            this.navigation.updateActiveRoute(window.location.pathname);
        }

        // Scroll to top
        window.scrollTo(0, 0);
    }

    renderNotFound() {
        const mainContent = document.getElementById('main-content');
        
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="min-h-screen flex items-center justify-center bg-gray-50">
                    <div class="max-w-md w-full text-center">
                        <div class="mb-8">
                            <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
                            <h2 class="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
                            <p class="text-gray-500">The page you're looking for doesn't exist.</p>
                        </div>
                        
                        <div class="space-y-4">
                            <button onclick="history.back()" 
                                    class="btn btn-outline mr-4">
                                Go Back
                            </button>
                            <button onclick="window.location.href='/dashboard'" 
                                    class="btn btn-primary">
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    async logout() {
        try {
            await this.authService.logout();
            this.notificationService.success('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            this.notificationService.error('Error logging out');
        }
    }

    // Utility methods for global app functionality
    showModal(modalContent) {
        const modalsContainer = document.getElementById('modals-container');
        
        const modalHTML = `
            <div class="modal-overlay" id="modal-overlay">
                <div class="modal-container">
                    <div class="modal-content">
                        ${modalContent}
                    </div>
                </div>
            </div>
        `;
        
        modalsContainer.innerHTML = modalHTML;
        
        // Close modal on overlay click
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') {
                this.hideModal();
            }
        });
        
        // Close modal on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    hideModal() {
        const modalsContainer = document.getElementById('modals-container');
        modalsContainer.innerHTML = '';
    }

    confirmAction(message, onConfirm, onCancel = null) {
        const modalContent = `
            <div class="modal-header">
                <h3 class="modal-title">Confirm Action</h3>
            </div>
            <div class="modal-body">
                <p class="text-gray-600">${message}</p>
            </div>
            <div class="modal-footer">
                <button id="cancel-btn" class="btn btn-outline">Cancel</button>
                <button id="confirm-btn" class="btn btn-danger">Confirm</button>
            </div>
        `;
        
        this.showModal(modalContent);
        
        // Handle button clicks
        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.hideModal();
            if (onCancel) onCancel();
        });
        
        document.getElementById('confirm-btn').addEventListener('click', () => {
            this.hideModal();
            onConfirm();
        });
    }

    // Global loading state management
    showGlobalLoading(message = 'Loading...') {
        const loadingHTML = `
            <div class="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
                <div class="text-center">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                    <p class="text-gray-600 font-medium">${message}</p>
                </div>
            </div>
        `;
        
        const loadingElement = document.createElement('div');
        loadingElement.id = 'global-loading';
        loadingElement.innerHTML = loadingHTML;
        document.body.appendChild(loadingElement);
    }

    hideGlobalLoading() {
        const loadingElement = document.getElementById('global-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }
}