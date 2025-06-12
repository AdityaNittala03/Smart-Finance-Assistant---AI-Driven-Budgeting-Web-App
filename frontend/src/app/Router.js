// Client-side Router for Single Page Application

export class Router {
    constructor(options = {}) {
        this.routes = options.routes || {};
        this.notFoundHandler = options.notFoundHandler || (() => console.error('Route not found'));
        this.currentRoute = null;
        this.isNavigating = false;
        
        // Bind methods
        this.handlePopState = this.handlePopState.bind(this);
        this.handleLinkClick = this.handleLinkClick.bind(this);
    }

    start() {
        // Listen for browser back/forward buttons
        window.addEventListener('popstate', this.handlePopState);
        
        // Intercept link clicks for client-side routing
        document.addEventListener('click', this.handleLinkClick);
        
        // Handle initial route
        this.handleRoute(window.location.pathname);
    }

    stop() {
        window.removeEventListener('popstate', this.handlePopState);
        document.removeEventListener('click', this.handleLinkClick);
    }

    handlePopState(event) {
        this.handleRoute(window.location.pathname);
    }

    handleLinkClick(event) {
        // Check if the clicked element is a link or inside a link
        const link = event.target.closest('a');
        
        if (!link) return;
        
        const href = link.getAttribute('href');
        
        // Only handle internal links
        if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }
        
        // Prevent default link behavior
        event.preventDefault();
        
        // Navigate to the link
        this.navigate(href);
    }

    navigate(path, options = {}) {
        if (this.isNavigating) return;
        
        // Normalize path
        path = this.normalizePath(path);
        
        // Don't navigate if already on this path
        if (path === window.location.pathname && !options.force) {
            return;
        }
        
        // Update browser history
        if (options.replace) {
            window.history.replaceState(null, '', path);
        } else {
            window.history.pushState(null, '', path);
        }
        
        // Handle the route
        this.handleRoute(path);
    }

    replace(path) {
        this.navigate(path, { replace: true });
    }

    back() {
        window.history.back();
    }

    forward() {
        window.history.forward();
    }

    handleRoute(path) {
        if (this.isNavigating) return;
        
        this.isNavigating = true;
        
        try {
            path = this.normalizePath(path);
            this.currentRoute = path;
            
            // Find matching route
            const handler = this.findRouteHandler(path);
            
            if (handler) {
                // Execute route handler
                Promise.resolve(handler(path)).catch(error => {
                    console.error('Route handler error:', error);
                    this.notFoundHandler();
                });
            } else {
                // No matching route found
                this.notFoundHandler();
            }
        } catch (error) {
            console.error('Route handling error:', error);
            this.notFoundHandler();
        } finally {
            this.isNavigating = false;
        }
    }

    findRouteHandler(path) {
        // Check for exact match first
        if (this.routes[path]) {
            return this.routes[path];
        }
        
        // Check for dynamic routes (basic pattern matching)
        for (const routePattern in this.routes) {
            if (this.matchRoute(routePattern, path)) {
                return this.routes[routePattern];
            }
        }
        
        return null;
    }

    matchRoute(pattern, path) {
        // Convert pattern to regex for basic dynamic routing
        // Support for :param patterns
        const regexPattern = pattern
            .replace(/\//g, '\\/')
            .replace(/:([^/]+)/g, '([^/]+)');
        
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(path);
    }

    extractParams(pattern, path) {
        const params = {};
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');
        
        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i];
            const pathPart = pathParts[i];
            
            if (patternPart.startsWith(':')) {
                const paramName = patternPart.slice(1);
                params[paramName] = pathPart;
            }
        }
        
        return params;
    }

    normalizePath(path) {
        // Remove trailing slash except for root
        if (path !== '/' && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        
        // Ensure path starts with /
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        return path;
    }

    getCurrentRoute() {
        return this.currentRoute;
    }

    getCurrentPath() {
        return window.location.pathname;
    }

    getCurrentQuery() {
        return new URLSearchParams(window.location.search);
    }

    updateQuery(params, options = {}) {
        const currentQuery = this.getCurrentQuery();
        
        // Update query parameters
        for (const [key, value] of Object.entries(params)) {
            if (value === null || value === undefined) {
                currentQuery.delete(key);
            } else {
                currentQuery.set(key, value);
            }
        }
        
        // Build new URL
        const queryString = currentQuery.toString();
        const newPath = window.location.pathname + (queryString ? '?' + queryString : '');
        
        // Update URL
        if (options.replace) {
            window.history.replaceState(null, '', newPath);
        } else {
            window.history.pushState(null, '', newPath);
        }
    }

    // Utility method to generate links
    link(path, text, attributes = {}) {
        const attributeString = Object.entries(attributes)
            .map(([key, value]) => `${key}="${value}"`)
            .join(' ');
        
        return `<a href="${path}" ${attributeString}>${text}</a>`;
    }

    // Method to check if current route matches pattern
    isActive(pattern) {
        const currentPath = this.getCurrentPath();
        
        if (pattern === currentPath) {
            return true;
        }
        
        return this.matchRoute(pattern, currentPath);
    }

    // Method to add route dynamically
    addRoute(pattern, handler) {
        this.routes[pattern] = handler;
    }

    // Method to remove route
    removeRoute(pattern) {
        delete this.routes[pattern];
    }

    // Method to set not found handler
    setNotFoundHandler(handler) {
        this.notFoundHandler = handler;
    }
}