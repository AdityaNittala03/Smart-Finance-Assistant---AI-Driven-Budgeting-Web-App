// Login Page Component

export class LoginPage {
    constructor(options = {}) {
        this.authService = options.authService;
        this.notificationService = options.notificationService;
        this.router = options.router;
        this.container = null;
        this.isLoading = false;
        
        // Bind methods
        this.handleSubmit = this.handleSubmit.bind(this);
        this.togglePasswordVisibility = this.togglePasswordVisibility.bind(this);
    }

    render(container) {
        this.container = container;
        this.container.innerHTML = this.getHTML();
        this.attachEventListeners();
        
        // Focus on email input
        setTimeout(() => {
            const emailInput = document.getElementById('email');
            if (emailInput) emailInput.focus();
        }, 100);
    }

    getHTML() {
        return `
            <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div class="max-w-md w-full space-y-8">
                    <!-- Header -->
                    <div>
                        <div class="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
                            <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                            </svg>
                        </div>
                        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Sign in to your account
                        </h2>
                        <p class="mt-2 text-center text-sm text-gray-600">
                            Welcome back to Smart Finance Assistant
                        </p>
                    </div>

                    <!-- Login Form -->
                    <form id="login-form" class="mt-8 space-y-6">
                        <div class="space-y-4">
                            <!-- Email Field -->
                            <div class="form-group">
                                <label for="email" class="form-label">
                                    Email address
                                </label>
                                <input id="email" 
                                       name="email" 
                                       type="email" 
                                       autocomplete="email" 
                                       required 
                                       class="input"
                                       placeholder="Enter your email">
                                <div id="email-error" class="form-error hidden"></div>
                            </div>

                            <!-- Password Field -->
                            <div class="form-group">
                                <label for="password" class="form-label">
                                    Password
                                </label>
                                <div class="relative">
                                    <input id="password" 
                                           name="password" 
                                           type="password" 
                                           autocomplete="current-password" 
                                           required 
                                           class="input pr-10"
                                           placeholder="Enter your password">
                                    <button type="button" 
                                            id="toggle-password"
                                            class="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <svg id="password-show-icon" class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                        </svg>
                                        <svg id="password-hide-icon" class="h-5 w-5 text-gray-400 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
                                        </svg>
                                    </button>
                                </div>
                                <div id="password-error" class="form-error hidden"></div>
                            </div>

                            <!-- Remember Me -->
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <input id="remember-me" 
                                           name="remember-me" 
                                           type="checkbox" 
                                           class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
                                    <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                                        Remember me
                                    </label>
                                </div>

                                <div class="text-sm">
                                    <a href="#" id="forgot-password-link" class="font-medium text-primary-600 hover:text-primary-500">
                                        Forgot your password?
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- Error Message -->
                        <div id="login-error" class="hidden">
                            <div class="bg-danger-50 border border-danger-200 rounded-lg p-4">
                                <div class="flex">
                                    <div class="flex-shrink-0">
                                        <svg class="h-5 w-5 text-danger-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                                        </svg>
                                    </div>
                                    <div class="ml-3">
                                        <p id="login-error-message" class="text-sm text-danger-800"></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Submit Button -->
                        <div>
                            <button type="submit" 
                                    id="login-button"
                                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                <span id="login-button-text">Sign in</span>
                                <div id="login-spinner" class="hidden absolute left-0 inset-y-0 flex items-center pl-3">
                                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                </div>
                            </button>
                        </div>

                        <!-- Register Link -->
                        <div class="text-center">
                            <p class="text-sm text-gray-600">
                                Don't have an account?
                                <a href="/register" class="font-medium text-primary-600 hover:text-primary-500">
                                    Sign up here
                                </a>
                            </p>
                        </div>
                    </form>

                    <!-- Demo Credentials -->
                    <div class="mt-6">
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-sm font-medium text-blue-800">Demo Account</h3>
                                    <div class="mt-2 text-sm text-blue-700">
                                        <p>Email: demo@smartfinance.com</p>
                                        <p>Password: demo123</p>
                                    </div>
                                    <button id="demo-login" 
                                            class="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 underline">
                                        Use demo credentials
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Form submission
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', this.handleSubmit);
        }

        // Password toggle
        const togglePassword = document.getElementById('toggle-password');
        if (togglePassword) {
            togglePassword.addEventListener('click', this.togglePasswordVisibility);
        }

        // Demo login
        const demoLogin = document.getElementById('demo-login');
        if (demoLogin) {
            demoLogin.addEventListener('click', this.fillDemoCredentials.bind(this));
        }

        // Forgot password
        const forgotPasswordLink = document.getElementById('forgot-password-link');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', this.handleForgotPassword.bind(this));
        }

        // Real-time validation
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (emailInput) {
            emailInput.addEventListener('blur', () => this.validateField('email'));
            emailInput.addEventListener('input', () => this.clearFieldError('email'));
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('input', () => this.clearFieldError('password'));
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        if (this.isLoading) return;

        // Clear previous errors
        this.clearErrors();

        // Get form data
        const formData = new FormData(event.target);
        const email = formData.get('email').trim();
        const password = formData.get('password');
        const rememberMe = formData.get('remember-me') === 'on';

        // Validate inputs
        if (!this.validateInputs(email, password)) {
            return;
        }

        // Show loading state
        this.setLoading(true);

        try {
            // Attempt login
            const result = await this.authService.login(email, password, rememberMe);

            if (result.success) {
                this.notificationService.success('Login successful! Welcome back.');
                // Navigation will be handled by auth state change in App.js
            } else {
                this.showError(result.error || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.setLoading(false);
        }
    }

    validateInputs(email, password) {
        let isValid = true;

        // Email validation
        if (!email) {
            this.showFieldError('email', 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        }

        // Password validation
        if (!password) {
            this.showFieldError('password', 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            this.showFieldError('password', 'Password must be at least 6 characters');
            isValid = false;
        }

        return isValid;
    }

    validateField(fieldName) {
        const input = document.getElementById(fieldName);
        if (!input) return;

        const value = input.value.trim();

        if (fieldName === 'email') {
            if (!value) {
                this.showFieldError('email', 'Email is required');
                return false;
            } else if (!this.isValidEmail(value)) {
                this.showFieldError('email', 'Please enter a valid email address');
                return false;
            }
        }

        this.clearFieldError(fieldName);
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        const inputElement = document.getElementById(fieldName);
        
        if (errorElement && inputElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
            inputElement.classList.add('input-error');
        }
    }

    clearFieldError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        const inputElement = document.getElementById(fieldName);
        
        if (errorElement && inputElement) {
            errorElement.classList.add('hidden');
            inputElement.classList.remove('input-error');
        }
    }

    showError(message) {
        const errorElement = document.getElementById('login-error');
        const errorMessage = document.getElementById('login-error-message');
        
        if (errorElement && errorMessage) {
            errorMessage.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    clearErrors() {
        const errorElement = document.getElementById('login-error');
        if (errorElement) {
            errorElement.classList.add('hidden');
        }

        this.clearFieldError('email');
        this.clearFieldError('password');
    }

    setLoading(loading) {
        this.isLoading = loading;
        
        const button = document.getElementById('login-button');
        const buttonText = document.getElementById('login-button-text');
        const spinner = document.getElementById('login-spinner');
        
        if (button && buttonText && spinner) {
            if (loading) {
                button.disabled = true;
                buttonText.textContent = 'Signing in...';
                spinner.classList.remove('hidden');
            } else {
                button.disabled = false;
                buttonText.textContent = 'Sign in';
                spinner.classList.add('hidden');
            }
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const showIcon = document.getElementById('password-show-icon');
        const hideIcon = document.getElementById('password-hide-icon');
        
        if (passwordInput && showIcon && hideIcon) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                showIcon.classList.add('hidden');
                hideIcon.classList.remove('hidden');
            } else {
                passwordInput.type = 'password';
                showIcon.classList.remove('hidden');
                hideIcon.classList.add('hidden');
            }
        }
    }

    fillDemoCredentials() {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (emailInput && passwordInput) {
            emailInput.value = 'demo@smartfinance.com';
            passwordInput.value = 'demo123';
            
            // Clear any previous errors
            this.clearErrors();
        }
    }

    handleForgotPassword(event) {
        event.preventDefault();
        
        // For now, just show a notification
        this.notificationService.info('Password reset functionality will be available soon. Please contact support if you need immediate assistance.');
        
        // TODO: Implement forgot password flow
        // this.router.navigate('/forgot-password');
    }

    destroy() {
        // Clean up event listeners if needed
        const form = document.getElementById('login-form');
        if (form) {
            form.removeEventListener('submit', this.handleSubmit);
        }
    }
}