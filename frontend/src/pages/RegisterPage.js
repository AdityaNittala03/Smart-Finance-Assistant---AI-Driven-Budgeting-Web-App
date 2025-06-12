// Register Page Component

export class RegisterPage {
    constructor(options = {}) {
        this.authService = options.authService;
        this.notificationService = options.notificationService;
        this.router = options.router;
        this.container = null;
        this.isLoading = false;
        
        // Bind methods
        this.handleSubmit = this.handleSubmit.bind(this);
        this.togglePasswordVisibility = this.togglePasswordVisibility.bind(this);
        this.toggleConfirmPasswordVisibility = this.toggleConfirmPasswordVisibility.bind(this);
    }

    render(container) {
        this.container = container;
        this.container.innerHTML = this.getHTML();
        this.attachEventListeners();
        
        // Focus on first name input
        setTimeout(() => {
            const firstNameInput = document.getElementById('firstName');
            if (firstNameInput) firstNameInput.focus();
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
                            Create your account
                        </h2>
                        <p class="mt-2 text-center text-sm text-gray-600">
                            Join Smart Finance Assistant today
                        </p>
                    </div>

                    <!-- Register Form -->
                    <form id="register-form" class="mt-8 space-y-6">
                        <div class="space-y-4">
                            <!-- Name Fields -->
                            <div class="grid grid-cols-2 gap-4">
                                <div class="form-group">
                                    <label for="firstName" class="form-label">
                                        First name
                                    </label>
                                    <input id="firstName" 
                                           name="firstName" 
                                           type="text" 
                                           autocomplete="given-name" 
                                           required 
                                           class="input"
                                           placeholder="First name">
                                    <div id="firstName-error" class="form-error hidden"></div>
                                </div>

                                <div class="form-group">
                                    <label for="lastName" class="form-label">
                                        Last name
                                    </label>
                                    <input id="lastName" 
                                           name="lastName" 
                                           type="text" 
                                           autocomplete="family-name" 
                                           required 
                                           class="input"
                                           placeholder="Last name">
                                    <div id="lastName-error" class="form-error hidden"></div>
                                </div>
                            </div>

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
                                           autocomplete="new-password" 
                                           required 
                                           class="input pr-10"
                                           placeholder="Create a password">
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
                                <!-- Password strength indicator -->
                                <div id="password-strength" class="mt-2 hidden">
                                    <div class="flex space-x-1">
                                        <div id="strength-bar-1" class="h-1 flex-1 bg-gray-200 rounded"></div>
                                        <div id="strength-bar-2" class="h-1 flex-1 bg-gray-200 rounded"></div>
                                        <div id="strength-bar-3" class="h-1 flex-1 bg-gray-200 rounded"></div>
                                        <div id="strength-bar-4" class="h-1 flex-1 bg-gray-200 rounded"></div>
                                    </div>
                                    <p id="strength-text" class="text-xs text-gray-500 mt-1"></p>
                                </div>
                            </div>

                            <!-- Confirm Password Field -->
                            <div class="form-group">
                                <label for="confirmPassword" class="form-label">
                                    Confirm password
                                </label>
                                <div class="relative">
                                    <input id="confirmPassword" 
                                           name="confirmPassword" 
                                           type="password" 
                                           autocomplete="new-password" 
                                           required 
                                           class="input pr-10"
                                           placeholder="Confirm your password">
                                    <button type="button" 
                                            id="toggle-confirm-password"
                                            class="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <svg id="confirm-password-show-icon" class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                        </svg>
                                        <svg id="confirm-password-hide-icon" class="h-5 w-5 text-gray-400 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
                                        </svg>
                                    </button>
                                </div>
                                <div id="confirmPassword-error" class="form-error hidden"></div>
                            </div>

                            <!-- Terms and Privacy -->
                            <div class="flex items-start">
                                <div class="flex items-center h-5">
                                    <input id="terms" 
                                           name="terms" 
                                           type="checkbox" 
                                           required
                                           class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
                                </div>
                                <div class="ml-2 text-sm">
                                    <label for="terms" class="text-gray-700">
                                        I agree to the 
                                        <a href="#" class="text-primary-600 hover:text-primary-500 font-medium">Terms of Service</a>
                                        and 
                                        <a href="#" class="text-primary-600 hover:text-primary-500 font-medium">Privacy Policy</a>
                                    </label>
                                    <div id="terms-error" class="form-error hidden mt-1"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Error Message -->
                        <div id="register-error" class="hidden">
                            <div class="bg-danger-50 border border-danger-200 rounded-lg p-4">
                                <div class="flex">
                                    <div class="flex-shrink-0">
                                        <svg class="h-5 w-5 text-danger-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                                        </svg>
                                    </div>
                                    <div class="ml-3">
                                        <p id="register-error-message" class="text-sm text-danger-800"></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Submit Button -->
                        <div>
                            <button type="submit" 
                                    id="register-button"
                                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                <span id="register-button-text">Create account</span>
                                <div id="register-spinner" class="hidden absolute left-0 inset-y-0 flex items-center pl-3">
                                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                </div>
                            </button>
                        </div>

                        <!-- Login Link -->
                        <div class="text-center">
                            <p class="text-sm text-gray-600">
                                Already have an account?
                                <a href="/login" class="font-medium text-primary-600 hover:text-primary-500">
                                    Sign in here
                                </a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Form submission
        const form = document.getElementById('register-form');
        if (form) {
            form.addEventListener('submit', this.handleSubmit);
        }

        // Password toggles
        const togglePassword = document.getElementById('toggle-password');
        const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
        
        if (togglePassword) {
            togglePassword.addEventListener('click', this.togglePasswordVisibility);
        }
        
        if (toggleConfirmPassword) {
            toggleConfirmPassword.addEventListener('click', this.toggleConfirmPasswordVisibility);
        }

        // Real-time validation
        const inputs = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];
        inputs.forEach(inputName => {
            const input = document.getElementById(inputName);
            if (input) {
                input.addEventListener('blur', () => this.validateField(inputName));
                input.addEventListener('input', () => {
                    this.clearFieldError(inputName);
                    if (inputName === 'password') {
                        this.updatePasswordStrength(input.value);
                    }
                    if (inputName === 'confirmPassword') {
                        this.validatePasswordMatch();
                    }
                });
            }
        });

        // Terms checkbox
        const termsCheckbox = document.getElementById('terms');
        if (termsCheckbox) {
            termsCheckbox.addEventListener('change', () => this.clearFieldError('terms'));
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        if (this.isLoading) return;

        // Clear previous errors
        this.clearErrors();

        // Get form data
        const formData = new FormData(event.target);
        const userData = {
            firstName: formData.get('firstName').trim(),
            lastName: formData.get('lastName').trim(),
            email: formData.get('email').trim(),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            terms: formData.get('terms') === 'on'
        };

        // Validate inputs
        if (!this.validateInputs(userData)) {
            return;
        }

        // Show loading state
        this.setLoading(true);

        try {
            // Prepare registration data for API
            const registrationData = {
                first_name: userData.firstName,
                last_name: userData.lastName,
                email: userData.email,
                password: userData.password
            };

            // Attempt registration
            const result = await this.authService.register(registrationData);

            if (result.success) {
                this.notificationService.success('Account created successfully! Welcome to Smart Finance Assistant.');
                // Navigation will be handled by auth state change in App.js
            } else {
                this.showError(result.error || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.setLoading(false);
        }
    }

    validateInputs(userData) {
        let isValid = true;

        // First name validation
        if (!userData.firstName) {
            this.showFieldError('firstName', 'First name is required');
            isValid = false;
        } else if (userData.firstName.length < 2) {
            this.showFieldError('firstName', 'First name must be at least 2 characters');
            isValid = false;
        }

        // Last name validation
        if (!userData.lastName) {
            this.showFieldError('lastName', 'Last name is required');
            isValid = false;
        } else if (userData.lastName.length < 2) {
            this.showFieldError('lastName', 'Last name must be at least 2 characters');
            isValid = false;
        }

        // Email validation
        if (!userData.email) {
            this.showFieldError('email', 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(userData.email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        }

        // Password validation
        const passwordStrength = this.getPasswordStrength(userData.password);
        if (!userData.password) {
            this.showFieldError('password', 'Password is required');
            isValid = false;
        } else if (userData.password.length < 8) {
            this.showFieldError('password', 'Password must be at least 8 characters');
            isValid = false;
        } else if (passwordStrength.score < 2) {
            this.showFieldError('password', 'Password is too weak. Please use a stronger password.');
            isValid = false;
        }

        // Confirm password validation
        if (!userData.confirmPassword) {
            this.showFieldError('confirmPassword', 'Please confirm your password');
            isValid = false;
        } else if (userData.password !== userData.confirmPassword) {
            this.showFieldError('confirmPassword', 'Passwords do not match');
            isValid = false;
        }

        // Terms validation
        if (!userData.terms) {
            this.showFieldError('terms', 'You must agree to the terms and conditions');
            isValid = false;
        }

        return isValid;
    }

    validateField(fieldName) {
        const input = document.getElementById(fieldName);
        if (!input) return;

        const value = input.value.trim();

        switch (fieldName) {
            case 'firstName':
            case 'lastName':
                if (!value) {
                    this.showFieldError(fieldName, `${fieldName === 'firstName' ? 'First' : 'Last'} name is required`);
                    return false;
                } else if (value.length < 2) {
                    this.showFieldError(fieldName, `${fieldName === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`);
                    return false;
                }
                break;
                
            case 'email':
                if (!value) {
                    this.showFieldError('email', 'Email is required');
                    return false;
                } else if (!this.isValidEmail(value)) {
                    this.showFieldError('email', 'Please enter a valid email address');
                    return false;
                }
                break;
                
            case 'password':
                const strength = this.getPasswordStrength(value);
                if (!value) {
                    this.showFieldError('password', 'Password is required');
                    return false;
                } else if (value.length < 8) {
                    this.showFieldError('password', 'Password must be at least 8 characters');
                    return false;
                } else if (strength.score < 2) {
                    this.showFieldError('password', 'Password is too weak. Please use a stronger password.');
                    return false;
                }
                break;
                
            case 'confirmPassword':
                const password = document.getElementById('password')?.value;
                if (!value) {
                    this.showFieldError('confirmPassword', 'Please confirm your password');
                    return false;
                } else if (password !== value) {
                    this.showFieldError('confirmPassword', 'Passwords do not match');
                    return false;
                }
                break;
        }

        this.clearFieldError(fieldName);
        return true;
    }

    validatePasswordMatch() {
        const password = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.showFieldError('confirmPassword', 'Passwords do not match');
        } else if (confirmPassword) {
            this.clearFieldError('confirmPassword');
        }
    }

    updatePasswordStrength(password) {
        const strength = this.getPasswordStrength(password);
        const strengthIndicator = document.getElementById('password-strength');
        const strengthText = document.getElementById('strength-text');
        
        if (!strengthIndicator || !strengthText) return;

        if (password.length > 0) {
            strengthIndicator.classList.remove('hidden');
            
            // Update strength bars
            for (let i = 1; i <= 4; i++) {
                const bar = document.getElementById(`strength-bar-${i}`);
                if (bar) {
                    bar.className = `h-1 flex-1 rounded ${this.getStrengthBarColor(strength.score, i)}`;
                }
            }
            
            strengthText.textContent = strength.feedback;
            strengthText.className = `text-xs mt-1 ${this.getStrengthTextColor(strength.score)}`;
        } else {
            strengthIndicator.classList.add('hidden');
        }
    }

    getPasswordStrength(password) {
        let score = 0;
        let feedback = '';

        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        // Cap score at 4
        score = Math.min(score, 4);

        switch (score) {
            case 0:
            case 1:
                feedback = 'Very weak password';
                break;
            case 2:
                feedback = 'Weak password';
                break;
            case 3:
                feedback = 'Good password';
                break;
            case 4:
                feedback = 'Strong password';
                break;
        }

        return { score, feedback };
    }

    getStrengthBarColor(score, barIndex) {
        if (barIndex <= score) {
            switch (score) {
                case 1: return 'bg-red-500';
                case 2: return 'bg-orange-500';
                case 3: return 'bg-yellow-500';
                case 4: return 'bg-green-500';
                default: return 'bg-gray-200';
            }
        }
        return 'bg-gray-200';
    }

    getStrengthTextColor(score) {
        switch (score) {
            case 1: return 'text-red-600';
            case 2: return 'text-orange-600';
            case 3: return 'text-yellow-600';
            case 4: return 'text-green-600';
            default: return 'text-gray-500';
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        const inputElement = document.getElementById(fieldName);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
        
        if (inputElement && fieldName !== 'terms') {
            inputElement.classList.add('input-error');
        }
    }

    clearFieldError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        const inputElement = document.getElementById(fieldName);
        
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
        
        if (inputElement && fieldName !== 'terms') {
            inputElement.classList.remove('input-error');
        }
    }

    showError(message) {
        const errorElement = document.getElementById('register-error');
        const errorMessage = document.getElementById('register-error-message');
        
        if (errorElement && errorMessage) {
            errorMessage.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    clearErrors() {
        const errorElement = document.getElementById('register-error');
        if (errorElement) {
            errorElement.classList.add('hidden');
        }

        const fields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'terms'];
        fields.forEach(field => this.clearFieldError(field));
    }

    setLoading(loading) {
        this.isLoading = loading;
        
        const button = document.getElementById('register-button');
        const buttonText = document.getElementById('register-button-text');
        const spinner = document.getElementById('register-spinner');
        
        if (button && buttonText && spinner) {
            if (loading) {
                button.disabled = true;
                buttonText.textContent = 'Creating account...';
                spinner.classList.remove('hidden');
            } else {
                button.disabled = false;
                buttonText.textContent = 'Create account';
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

    toggleConfirmPasswordVisibility() {
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const showIcon = document.getElementById('confirm-password-show-icon');
        const hideIcon = document.getElementById('confirm-password-hide-icon');
        
        if (confirmPasswordInput && showIcon && hideIcon) {
            if (confirmPasswordInput.type === 'password') {
                confirmPasswordInput.type = 'text';
                showIcon.classList.add('hidden');
                hideIcon.classList.remove('hidden');
            } else {
                confirmPasswordInput.type = 'password';
                showIcon.classList.remove('hidden');
                hideIcon.classList.add('hidden');
            }
        }
    }

    destroy() {
        // Clean up event listeners if needed
        const form = document.getElementById('register-form');
        if (form) {
            form.removeEventListener('submit', this.handleSubmit);
        }
    }
}