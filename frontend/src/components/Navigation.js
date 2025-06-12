// Navigation Component

export class NavigationComponent {
    constructor(options = {}) {
        this.user = options.user;
        this.onLogout = options.onLogout;
        this.router = options.router;
        this.container = null;
        this.mobileMenuOpen = false;
        
        // Bind methods
        this.toggleMobileMenu = this.toggleMobileMenu.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
    }

    render() {
        this.container = document.getElementById('navbar');
        
        if (!this.container) {
            console.error('Navigation container not found');
            return;
        }

        this.container.innerHTML = this.getNavigationHTML();
        this.attachEventListeners();
    }

    getNavigationHTML() {
        return `
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <!-- Left section -->
                    <div class="flex">
                        <!-- Logo -->
                        <div class="flex-shrink-0 flex items-center">
                            <a href="/dashboard" class="flex items-center">
                                <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                                    </svg>
                                </div>
                                <span class="text-xl font-bold text-gray-900">Smart Finance</span>
                            </a>
                        </div>

                        <!-- Desktop Navigation -->
                        <nav class="hidden md:ml-6 md:flex md:space-x-8">
                            ${this.getNavigationLinks()}
                        </nav>
                    </div>

                    <!-- Right section -->
                    <div class="flex items-center">
                        <!-- Desktop User Menu -->
                        <div class="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
                            <!-- Notifications -->
                            <button class="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                <span class="sr-only">View notifications</span>
                                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-3.5-3.5a1.5 1.5 0 0 1 0-2.12l.7-.7a1 1 0 0 1 1.4 0l.9.9a1 1 0 0 1 0 1.4l-.7.7a1.5 1.5 0 0 1-2.12 0L15 17z"/>
                                </svg>
                            </button>

                            <!-- Profile Dropdown -->
                            <div class="ml-3 relative" x-data="{ open: false }">
                                <div>
                                    <button @click="open = !open" 
                                            class="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" 
                                            id="user-menu-button">
                                        <span class="sr-only">Open user menu</span>
                                        ${this.getUserAvatar()}
                                    </button>
                                </div>

                                <div x-show="open" 
                                     @click.away="open = false"
                                     x-transition:enter="transition ease-out duration-100"
                                     x-transition:enter-start="transform opacity-0 scale-95"
                                     x-transition:enter-end="transform opacity-100 scale-100"
                                     x-transition:leave="transition ease-in duration-75"
                                     x-transition:leave-start="transform opacity-100 scale-100"
                                     x-transition:leave-end="transform opacity-0 scale-95"
                                     class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                    <div class="py-1">
                                        ${this.getUserMenuItems()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Mobile menu button -->
                        <div class="md:hidden">
                            <button id="mobile-menu-button" 
                                    class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
                                <span class="sr-only">Open main menu</span>
                                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mobile menu -->
            <div id="mobile-menu" class="md:hidden ${this.mobileMenuOpen ? '' : 'hidden'}">
                <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    ${this.getMobileNavigationLinks()}
                </div>
                <div class="pt-4 pb-3 border-t border-gray-200">
                    <div class="flex items-center px-4">
                        <div class="flex-shrink-0">
                            ${this.getUserAvatar()}
                        </div>
                        <div class="ml-3">
                            <div class="text-base font-medium text-gray-800">${this.user?.name || 'User'}</div>
                            <div class="text-sm font-medium text-gray-500">${this.user?.email || ''}</div>
                        </div>
                    </div>
                    <div class="mt-3 space-y-1">
                        ${this.getMobileUserMenuItems()}
                    </div>
                </div>
            </div>
        `;
    }

    getNavigationLinks() {
        const links = [
            { path: '/dashboard', label: 'Dashboard', icon: 'grid' },
            { path: '/transactions', label: 'Transactions', icon: 'credit-card' },
            { path: '/budgets', label: 'Budgets', icon: 'pie-chart' },
            { path: '/analytics', label: 'Analytics', icon: 'trending-up' }
        ];

        return links.map(link => `
            <a href="${link.path}" 
               class="nav-link ${this.isActiveLink(link.path) ? 'nav-link-active' : 'nav-link-inactive'} border-transparent inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                ${this.getIcon(link.icon)}
                <span class="ml-2">${link.label}</span>
            </a>
        `).join('');
    }

    getMobileNavigationLinks() {
        const links = [
            { path: '/dashboard', label: 'Dashboard', icon: 'grid' },
            { path: '/transactions', label: 'Transactions', icon: 'credit-card' },
            { path: '/budgets', label: 'Budgets', icon: 'pie-chart' },
            { path: '/analytics', label: 'Analytics', icon: 'trending-up' }
        ];

        return links.map(link => `
            <a href="${link.path}" 
               class="${this.isActiveLink(link.path) ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                <div class="flex items-center">
                    ${this.getIcon(link.icon)}
                    <span class="ml-3">${link.label}</span>
                </div>
            </a>
        `).join('');
    }

    getUserMenuItems() {
        return `
            <a href="/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Your Profile
            </a>
            <a href="/settings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Settings
            </a>
            <button id="logout-button" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Sign out
            </button>
        `;
    }

    getMobileUserMenuItems() {
        return `
            <a href="/profile" class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                Your Profile
            </a>
            <a href="/settings" class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                Settings
            </a>
            <button id="mobile-logout-button" class="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                Sign out
            </button>
        `;
    }

    getUserAvatar() {
        if (this.user?.avatar) {
            return `<img class="h-8 w-8 rounded-full" src="${this.user.avatar}" alt="${this.user.name}">`;
        } else {
            const initials = this.getInitials(this.user?.name || 'U');
            return `
                <div class="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                    <span class="text-sm font-medium text-white">${initials}</span>
                </div>
            `;
        }
    }

    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    getIcon(iconName) {
        const icons = {
            grid: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>`,
            'credit-card': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>`,
            'pie-chart': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
            </svg>`,
            'trending-up': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>`
        };

        return icons[iconName] || '';
    }

    isActiveLink(path) {
        return window.location.pathname === path;
    }

    attachEventListeners() {
        // Mobile menu toggle
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        if (mobileMenuButton) {
            mobileMenuButton.addEventListener('click', this.toggleMobileMenu);
        }

        // Logout buttons
        const logoutButton = document.getElementById('logout-button');
        const mobileLogoutButton = document.getElementById('mobile-logout-button');
        
        if (logoutButton) {
            logoutButton.addEventListener('click', this.handleLogout);
        }
        
        if (mobileLogoutButton) {
            mobileLogoutButton.addEventListener('click', this.handleLogout);
        }

        // Close mobile menu when clicking on links
        const mobileLinks = document.querySelectorAll('#mobile-menu a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.mobileMenuOpen = false;
                this.updateMobileMenu();
            });
        });
    }

    toggleMobileMenu() {
        this.mobileMenuOpen = !this.mobileMenuOpen;
        this.updateMobileMenu();
    }

    updateMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            if (this.mobileMenuOpen) {
                mobileMenu.classList.remove('hidden');
            } else {
                mobileMenu.classList.add('hidden');
            }
        }
    }

    handleLogout(event) {
        event.preventDefault();
        
        if (this.onLogout) {
            this.onLogout();
        }
    }

    updateActiveRoute(currentPath) {
        // Update active state for navigation links
        const links = this.container.querySelectorAll('a[href]');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            const isActive = href === currentPath;
            
            if (link.classList.contains('nav-link-active') || link.classList.contains('nav-link-inactive')) {
                // Desktop navigation link
                link.classList.remove('nav-link-active', 'nav-link-inactive');
                link.classList.add(isActive ? 'nav-link-active' : 'nav-link-inactive');
            } else if (link.classList.contains('border-l-4')) {
                // Mobile navigation link
                if (isActive) {
                    link.classList.remove('border-transparent', 'text-gray-600');
                    link.classList.add('bg-primary-50', 'border-primary-500', 'text-primary-700');
                } else {
                    link.classList.remove('bg-primary-50', 'border-primary-500', 'text-primary-700');
                    link.classList.add('border-transparent', 'text-gray-600');
                }
            }
        });
    }

    updateUser(user) {
        this.user = user;
        this.render(); // Re-render with updated user info
    }

    destroy() {
        // Clean up event listeners
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        if (mobileMenuButton) {
            mobileMenuButton.removeEventListener('click', this.toggleMobileMenu);
        }

        const logoutButton = document.getElementById('logout-button');
        const mobileLogoutButton = document.getElementById('mobile-logout-button');
        
        if (logoutButton) {
            logoutButton.removeEventListener('click', this.handleLogout);
        }
        
        if (mobileLogoutButton) {
            mobileLogoutButton.removeEventListener('click', this.handleLogout);
        }

        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}