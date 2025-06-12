// Authentication Service
import { APIService } from './APIService';

export class AuthService {
    constructor() {
        this.apiService = new APIService();
        this.user = null;
        this.token = null;
        this.refreshToken = null;
        this.authStateListeners = [];
        
        // Bind methods
        this.handleTokenExpiry = this.handleTokenExpiry.bind(this);
        this.refreshAuthToken = this.refreshAuthToken.bind(this);
    }

    async initialize() {
        // Load stored authentication data
        this.loadStoredAuth();
        
        // Validate existing token
        if (this.token) {
            try {
                await this.validateToken();
            } catch (error) {
                console.log('Stored token invalid, clearing auth data');
                this.clearAuth();
            }
        }
        
        // Set up API service with auth token
        if (this.token) {
            this.apiService.setAuthToken(this.token);
        }
        
        // Set up token refresh timer
        this.setupTokenRefresh();
    }

    async login(email, password, rememberMe = false) {
        try {
            const response = await this.apiService.post('/auth/login', {
                email,
                password,
                remember_me: rememberMe
            });

            if (response.success) {
                await this.handleAuthSuccess(response.data, rememberMe);
                return { success: true, user: this.user };
            } else {
                return { success: false, error: response.error || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    }

    async register(userData) {
        try {
            const response = await this.apiService.post('/auth/register', userData);

            if (response.success) {
                await this.handleAuthSuccess(response.data, false);
                return { success: true, user: this.user };
            } else {
                return { success: false, error: response.error || 'Registration failed' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    }

    async logout() {
        try {
            // Call logout endpoint
            if (this.token) {
                await this.apiService.post('/auth/logout');
            }
        } catch (error) {
            console.error('Logout API error:', error);
            // Continue with client-side logout even if API call fails
        }

        // Clear authentication data
        this.clearAuth();
        
        // Notify listeners
        this.notifyAuthStateChange(null);
    }

    async validateToken() {
        if (!this.token) {
            throw new Error('No token to validate');
        }

        try {
            const response = await this.apiService.get('/auth/validate');
            
            if (response.success) {
                this.user = response.data.user;
                return true;
            } else {
                throw new Error('Token validation failed');
            }
        } catch (error) {
            throw new Error('Token validation failed');
        }
    }

    async refreshAuthToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await this.apiService.post('/auth/refresh', {
                refresh_token: this.refreshToken
            });

            if (response.success) {
                this.token = response.data.access_token;
                this.refreshToken = response.data.refresh_token || this.refreshToken;
                
                // Update stored auth data
                this.storeAuthData();
                
                // Update API service token
                this.apiService.setAuthToken(this.token);
                
                // Reset token refresh timer
                this.setupTokenRefresh();
                
                return true;
            } else {
                throw new Error('Token refresh failed');
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            // If refresh fails, logout user
            this.logout();
            throw error;
        }
    }

    async getCurrentUser() {
        if (this.user) {
            return this.user;
        }

        if (!this.token) {
            return null;
        }

        try {
            const response = await this.apiService.get('/auth/me');
            
            if (response.success) {
                this.user = response.data.user;
                return this.user;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    }

    async updateProfile(userData) {
        try {
            const response = await this.apiService.put('/auth/profile', userData);
            
            if (response.success) {
                this.user = { ...this.user, ...response.data.user };
                this.notifyAuthStateChange(this.user);
                return { success: true, user: this.user };
            } else {
                return { success: false, error: response.error || 'Profile update failed' };
            }
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            const response = await this.apiService.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword
            });

            if (response.success) {
                return { success: true };
            } else {
                return { success: false, error: response.error || 'Password change failed' };
            }
        } catch (error) {
            console.error('Password change error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    }

    async requestPasswordReset(email) {
        try {
            const response = await this.apiService.post('/auth/forgot-password', { email });
            
            return {
                success: response.success,
                error: response.success ? null : (response.error || 'Request failed')
            };
        } catch (error) {
            console.error('Password reset request error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    }

    async resetPassword(token, newPassword) {
        try {
            const response = await this.apiService.post('/auth/reset-password', {
                token,
                new_password: newPassword
            });
            
            return {
                success: response.success,
                error: response.success ? null : (response.error || 'Reset failed')
            };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    }

    async handleAuthSuccess(authData, rememberMe) {
        this.token = authData.access_token;
        this.refreshToken = authData.refresh_token;
        this.user = authData.user;
        
        // Store authentication data
        this.storeAuthData(rememberMe);
        
        // Set up API service with auth token
        this.apiService.setAuthToken(this.token);
        
        // Set up token refresh
        this.setupTokenRefresh();
        
        // Notify listeners
        this.notifyAuthStateChange(this.user);
    }

    handleTokenExpiry() {
        console.log('Token expired, attempting refresh...');
        
        this.refreshAuthToken().catch(error => {
            console.error('Failed to refresh token:', error);
        });
    }

    setupTokenRefresh() {
        // Clear existing timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        if (!this.token) return;

        try {
            // Decode JWT to get expiry time
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            const expiryTime = payload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            const timeUntilExpiry = expiryTime - currentTime;
            
            // Refresh token 5 minutes before expiry
            const refreshTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 60000); // At least 1 minute
            
            this.refreshTimer = setTimeout(this.handleTokenExpiry, refreshTime);
        } catch (error) {
            console.error('Error setting up token refresh:', error);
        }
    }

    storeAuthData(persistent = false) {
        const storage = persistent ? localStorage : sessionStorage;
        
        const authData = {
            token: this.token,
            refreshToken: this.refreshToken,
            user: this.user,
            timestamp: Date.now()
        };
        
        storage.setItem('auth_data', JSON.stringify(authData));
    }

    loadStoredAuth() {
        // Try localStorage first (persistent), then sessionStorage
        let authData = null;
        
        try {
            const stored = localStorage.getItem('auth_data') || sessionStorage.getItem('auth_data');
            if (stored) {
                authData = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading stored auth data:', error);
            return;
        }

        if (authData) {
            // Check if stored data is not too old (7 days)
            const age = Date.now() - authData.timestamp;
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            
            if (age < maxAge) {
                this.token = authData.token;
                this.refreshToken = authData.refreshToken;
                this.user = authData.user;
            } else {
                // Clear old data
                this.clearStoredAuth();
            }
        }
    }

    clearAuth() {
        this.token = null;
        this.refreshToken = null;
        this.user = null;
        
        // Clear API service token
        this.apiService.clearAuthToken();
        
        // Clear stored data
        this.clearStoredAuth();
        
        // Clear refresh timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    clearStoredAuth() {
        localStorage.removeItem('auth_data');
        sessionStorage.removeItem('auth_data');
    }

    // Authentication state management
    onAuthStateChange(listener) {
        this.authStateListeners.push(listener);
        
        // Return unsubscribe function
        return () => {
            const index = this.authStateListeners.indexOf(listener);
            if (index > -1) {
                this.authStateListeners.splice(index, 1);
            }
        };
    }

    notifyAuthStateChange(user) {
        this.authStateListeners.forEach(listener => {
            try {
                listener(user);
            } catch (error) {
                console.error('Auth state listener error:', error);
            }
        });
    }

    // Utility methods
    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    getToken() {
        return this.token;
    }

    getUser() {
        return this.user;
    }

    hasRole(role) {
        return this.user && this.user.roles && this.user.roles.includes(role);
    }

    hasPermission(permission) {
        return this.user && this.user.permissions && this.user.permissions.includes(permission);
    }
}