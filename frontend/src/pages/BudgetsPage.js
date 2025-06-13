// Budgets Page Component

export class BudgetsPage {
    constructor(options = {}) {
        this.authService = options.authService;
        this.notificationService = options.notificationService;
        this.router = options.router;
        this.user = options.user;
        this.container = null;
        this.isLoading = true;
        this.budgets = [];
        this.currentPeriod = 'monthly';
        this.selectedBudget = null;
        
        // Bind methods
        this.handlePeriodChange = this.handlePeriodChange.bind(this);
        this.handleCreateBudget = this.handleCreateBudget.bind(this);
        this.handleEditBudget = this.handleEditBudget.bind(this);
        this.handleDeleteBudget = this.handleDeleteBudget.bind(this);
        this.handleBulkAction = this.handleBulkAction.bind(this);
    }

    async render(container) {
        this.container = container;
        
        // Show loading state initially
        this.container.innerHTML = this.getLoadingHTML();
        
        // Check for action in URL
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        try {
            await this.loadBudgets();
            this.container.innerHTML = this.getHTML();
            this.attachEventListeners();
            
            // Handle URL actions
            if (action === 'create') {
                setTimeout(() => this.showBudgetModal('Create Budget'), 100);
            }
        } catch (error) {
            console.error('Failed to load budgets:', error);
            this.container.innerHTML = this.getErrorHTML();
        }
    }

    async loadBudgets() {
        // Simulate API call - replace with actual API service call
        this.budgets = [
            {
                id: 1,
                name: 'Food & Dining',
                category: 'Food',
                limit: 800,
                spent: 485.50,
                period: 'monthly',
                startDate: '2024-12-01',
                endDate: '2024-12-31',
                isActive: true,
                alertThreshold: 80,
                description: 'Monthly food and dining expenses'
            },
            {
                id: 2,
                name: 'Transportation',
                category: 'Transportation',
                limit: 400,
                spent: 320.40,
                period: 'monthly',
                startDate: '2024-12-01',
                endDate: '2024-12-31',
                isActive: true,
                alertThreshold: 90,
                description: 'Gas, public transport, and vehicle maintenance'
            },
            {
                id: 3,
                name: 'Entertainment',
                category: 'Entertainment',
                limit: 300,
                spent: 150.25,
                period: 'monthly',
                startDate: '2024-12-01',
                endDate: '2024-12-31',
                isActive: true,
                alertThreshold: 75,
                description: 'Movies, games, subscriptions'
            },
            {
                id: 4,
                name: 'Shopping',
                category: 'Shopping',
                limit: 500,
                spent: 420.75,
                period: 'monthly',
                startDate: '2024-12-01',
                endDate: '2024-12-31',
                isActive: true,
                alertThreshold: 85,
                description: 'Clothing, electronics, and general shopping'
            },
            {
                id: 5,
                name: 'Health & Fitness',
                category: 'Health',
                limit: 200,
                spent: 89.99,
                period: 'monthly',
                startDate: '2024-12-01',
                endDate: '2024-12-31',
                isActive: true,
                alertThreshold: 70,
                description: 'Gym, supplements, medical expenses'
            },
            {
                id: 6,
                name: 'Emergency Fund',
                category: 'Savings',
                limit: 1000,
                spent: 750.00,
                period: 'monthly',
                startDate: '2024-12-01',
                endDate: '2024-12-31',
                isActive: true,
                alertThreshold: 90,
                description: 'Monthly emergency fund contribution'
            }
        ];
        
        this.isLoading = false;
    }

    getLoadingHTML() {
        return `
            <div class="p-6">
                <div class="animate-pulse">
                    <div class="mb-6">
                        <div class="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${Array(6).fill(0).map(() => `
                            <div class="bg-white p-6 rounded-xl border border-gray-200">
                                <div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                                <div class="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                                <div class="h-2 bg-gray-200 rounded mb-2"></div>
                                <div class="h-4 bg-gray-200 rounded w-1/3"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    getHTML() {
        return `
            <div class="p-6 max-w-7xl mx-auto">
                <!-- Header -->
                <div class="mb-8">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 class="text-3xl font-bold text-gray-900">Budgets</h1>
                            <p class="text-gray-600">Track and manage your spending limits</p>
                        </div>
                        <div class="mt-4 sm:mt-0 flex space-x-3">
                            <button id="create-budget-btn" class="btn btn-primary">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                </svg>
                                Create Budget
                            </button>
                            <button id="budget-insights-btn" class="btn btn-secondary">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                                </svg>
                                AI Insights
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Budget Overview Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    ${this.getBudgetStatsHTML()}
                </div>

                <!-- Period Selector -->
                <div class="card mb-6">
                    <div class="card-body">
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">Budget Period</h3>
                                <p class="text-sm text-gray-600">View budgets by time period</p>
                            </div>
                            <div class="mt-4 sm:mt-0">
                                <select id="period-selector" class="input">
                                    <option value="monthly" ${this.currentPeriod === 'monthly' ? 'selected' : ''}>Monthly</option>
                                    <option value="quarterly" ${this.currentPeriod === 'quarterly' ? 'selected' : ''}>Quarterly</option>
                                    <option value="yearly" ${this.currentPeriod === 'yearly' ? 'selected' : ''}>Yearly</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Budget Cards Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    ${this.getBudgetCardsHTML()}
                </div>

                <!-- Budget Performance Table -->
                <div class="card">
                    <div class="card-header">
                        <div class="flex justify-between items-center">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">Budget Performance</h3>
                                <p class="text-sm text-gray-500">Detailed view of all budgets</p>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button id="bulk-edit-btn" class="btn btn-outline btn-sm hidden">
                                    Edit Selected
                                </button>
                                <button id="export-budgets-btn" class="btn btn-secondary btn-sm">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                    </svg>
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-body p-0">
                        ${this.getBudgetTableHTML()}
                    </div>
                </div>
            </div>

            <!-- Budget Modal -->
            <div id="budget-modal" class="hidden fixed inset-0 bg-gray-500 bg-opacity-75 z-50">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-xl shadow-modal max-w-lg w-full max-h-screen overflow-y-auto">
                        ${this.getBudgetModalHTML()}
                    </div>
                </div>
            </div>

            <!-- AI Insights Modal -->
            <div id="insights-modal" class="hidden fixed inset-0 bg-gray-500 bg-opacity-75 z-50">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-xl shadow-modal max-w-2xl w-full max-h-screen overflow-y-auto">
                        ${this.getInsightsModalHTML()}
                    </div>
                </div>
            </div>
        `;
    }

    getBudgetStatsHTML() {
        const totalBudgets = this.budgets.length;
        const activeBudgets = this.budgets.filter(b => b.isActive).length;
        const totalLimit = this.budgets.reduce((sum, b) => sum + b.limit, 0);
        const totalSpent = this.budgets.reduce((sum, b) => sum + b.spent, 0);
        const overBudgetCount = this.budgets.filter(b => (b.spent / b.limit) * 100 > 100).length;
        const avgUtilization = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

        const stats = [
            {
                title: 'Total Budgets',
                value: totalBudgets,
                subtitle: `${activeBudgets} active`,
                icon: 'pie-chart',
                color: 'primary'
            },
            {
                title: 'Total Budget',
                value: this.formatCurrency(totalLimit),
                subtitle: 'Monthly limit',
                icon: 'dollar-sign',
                color: 'success'
            },
            {
                title: 'Total Spent',
                value: this.formatCurrency(totalSpent),
                subtitle: `${avgUtilization.toFixed(1)}% utilized`,
                icon: 'credit-card',
                color: avgUtilization > 80 ? 'warning' : 'primary'
            },
            {
                title: 'Over Budget',
                value: overBudgetCount,
                subtitle: overBudgetCount > 0 ? 'Needs attention' : 'All on track',
                icon: 'alert-triangle',
                color: overBudgetCount > 0 ? 'danger' : 'success'
            }
        ];

        return stats.map(stat => `
            <div class="stat-card">
                <div class="flex items-center justify-between mb-4">
                    <div class="stat-card-icon bg-gradient-${stat.color}">
                        ${this.getIcon(stat.icon)}
                    </div>
                </div>
                <div class="stat-card-value">${stat.value}</div>
                <div class="stat-card-label">${stat.title}</div>
                <div class="text-xs text-gray-500 mt-1">${stat.subtitle}</div>
            </div>
        `).join('');
    }

    getBudgetCardsHTML() {
        return this.budgets.map(budget => {
            const percentage = (budget.spent / budget.limit) * 100;
            const remaining = budget.limit - budget.spent;
            const isOverBudget = percentage > 100;
            const isNearLimit = percentage > budget.alertThreshold;
            
            return `
                <div class="card hover:shadow-lg transition-shadow duration-200 ${isOverBudget ? 'ring-2 ring-danger-200' : ''}">
                    <div class="card-body">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h4 class="font-semibold text-gray-900">${budget.name}</h4>
                                <p class="text-sm text-gray-600">${budget.description}</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="edit-budget-btn text-gray-400 hover:text-gray-600" data-budget-id="${budget.id}">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                    </svg>
                                </button>
                                <button class="delete-budget-btn text-gray-400 hover:text-danger-600" data-budget-id="${budget.id}">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <!-- Amount Display -->
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Spent</span>
                                <span class="font-semibold ${isOverBudget ? 'text-danger-600' : 'text-gray-900'}">
                                    ${this.formatCurrency(budget.spent)}
                                </span>
                            </div>
                            
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Budget</span>
                                <span class="text-gray-700">${this.formatCurrency(budget.limit)}</span>
                            </div>
                            
                            <!-- Progress Bar -->
                            <div class="space-y-2">
                                <div class="w-full bg-gray-200 rounded-full h-3">
                                    <div class="h-3 rounded-full transition-all duration-300 ${this.getBudgetProgressColor(percentage)}" 
                                         style="width: ${Math.min(percentage, 100)}%"></div>
                                </div>
                                <div class="flex justify-between items-center text-sm">
                                    <span class="${isOverBudget ? 'text-danger-600' : isNearLimit ? 'text-warning-600' : 'text-gray-600'}">
                                        ${percentage.toFixed(1)}% used
                                    </span>
                                    <span class="${remaining >= 0 ? 'text-gray-600' : 'text-danger-600'}">
                                        ${remaining >= 0 ? this.formatCurrency(remaining) + ' left' : this.formatCurrency(Math.abs(remaining)) + ' over'}
                                    </span>
                                </div>
                            </div>

                            <!-- Status Badge -->
                            <div class="flex justify-between items-center pt-2">
                                <span class="badge ${this.getBudgetStatusBadgeClass(percentage, budget.alertThreshold)}">
                                    ${this.getBudgetStatus(percentage, budget.alertThreshold)}
                                </span>
                                <span class="text-xs text-gray-500">
                                    ${this.formatDateRange(budget.startDate, budget.endDate)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getBudgetTableHTML() {
        return `
            <div class="overflow-x-auto">
                <table class="table">
                    <thead class="table-header">
                        <tr>
                            <th class="table-header-cell w-12">
                                <input type="checkbox" id="select-all-budgets" class="h-4 w-4 text-primary-600 border-gray-300 rounded">
                            </th>
                            <th class="table-header-cell">Budget Name</th>
                            <th class="table-header-cell">Category</th>
                            <th class="table-header-cell">Period</th>
                            <th class="table-header-cell text-right">Limit</th>
                            <th class="table-header-cell text-right">Spent</th>
                            <th class="table-header-cell">Progress</th>
                            <th class="table-header-cell">Status</th>
                            <th class="table-header-cell">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="table-body">
                        ${this.budgets.map(budget => {
                            const percentage = (budget.spent / budget.limit) * 100;
                            return `
                                <tr class="table-row" data-budget-id="${budget.id}">
                                    <td class="table-cell">
                                        <input type="checkbox" class="budget-checkbox h-4 w-4 text-primary-600 border-gray-300 rounded" value="${budget.id}">
                                    </td>
                                    <td class="table-cell">
                                        <div>
                                            <div class="font-medium text-gray-900">${budget.name}</div>
                                            <div class="text-sm text-gray-500">${budget.description}</div>
                                        </div>
                                    </td>
                                    <td class="table-cell">
                                        <span class="badge ${this.getCategoryBadgeClass(budget.category)}">${budget.category}</span>
                                    </td>
                                    <td class="table-cell">
                                        <div class="text-sm text-gray-900 capitalize">${budget.period}</div>
                                        <div class="text-xs text-gray-500">${this.formatDateRange(budget.startDate, budget.endDate)}</div>
                                    </td>
                                    <td class="table-cell text-right">
                                        <div class="font-medium text-gray-900">${this.formatCurrency(budget.limit)}</div>
                                    </td>
                                    <td class="table-cell text-right">
                                        <div class="font-medium ${percentage > 100 ? 'text-danger-600' : 'text-gray-900'}">
                                            ${this.formatCurrency(budget.spent)}
                                        </div>
                                    </td>
                                    <td class="table-cell">
                                        <div class="w-full bg-gray-200 rounded-full h-2">
                                            <div class="h-2 rounded-full ${this.getBudgetProgressColor(percentage)}" 
                                                 style="width: ${Math.min(percentage, 100)}%"></div>
                                        </div>
                                        <div class="text-xs text-gray-500 mt-1">${percentage.toFixed(1)}%</div>
                                    </td>
                                    <td class="table-cell">
                                        <span class="badge ${this.getBudgetStatusBadgeClass(percentage, budget.alertThreshold)}">
                                            ${this.getBudgetStatus(percentage, budget.alertThreshold)}
                                        </span>
                                    </td>
                                    <td class="table-cell">
                                        <div class="flex space-x-2">
                                            <button class="edit-budget-btn text-primary-600 hover:text-primary-700" data-budget-id="${budget.id}">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                                </svg>
                                            </button>
                                            <button class="delete-budget-btn text-danger-600 hover:text-danger-700" data-budget-id="${budget.id}">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getBudgetModalHTML() {
        return `
            <div class="modal-header">
                <h3 id="budget-modal-title" class="modal-title">Create Budget</h3>
                <button id="close-budget-modal-btn" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            
            <form id="budget-form" class="modal-body">
                <input type="hidden" id="budget-id" value="">
                
                <div class="space-y-4">
                    <div class="form-group">
                        <label for="budget-name" class="form-label">Budget Name</label>
                        <input type="text" id="budget-name" class="input" placeholder="Enter budget name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="budget-description" class="form-label">Description</label>
                        <textarea id="budget-description" class="input" rows="3" placeholder="Optional description"></textarea>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-group">
                            <label for="budget-category" class="form-label">Category</label>
                            <select id="budget-category" class="input" required>
                                <option value="">Select category</option>
                                <option value="Food">Food</option>
                                <option value="Transportation">Transportation</option>
                                <option value="Shopping">Shopping</option>
                                <option value="Utilities">Utilities</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Health">Health</option>
                                <option value="Education">Education</option>
                                <option value="Savings">Savings</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="budget-limit" class="form-label">Budget Limit</label>
                            <input type="number" id="budget-limit" class="input" placeholder="0.00" step="0.01" required>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4">
                        <div class="form-group">
                            <label for="budget-period" class="form-label">Period</label>
                            <select id="budget-period" class="input" required>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="budget-start-date" class="form-label">Start Date</label>
                            <input type="date" id="budget-start-date" class="input" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="budget-end-date" class="form-label">End Date</label>
                            <input type="date" id="budget-end-date" class="input" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="budget-alert-threshold" class="form-label">Alert Threshold (%)</label>
                        <input type="range" id="budget-alert-threshold" class="w-full" min="50" max="100" step="5" value="80">
                        <div class="flex justify-between text-sm text-gray-500 mt-1">
                            <span>50%</span>
                            <span id="threshold-value">80%</span>
                            <span>100%</span>
                        </div>
                        <div class="form-help">Get alerts when spending reaches this percentage of your budget</div>
                    </div>
                    
                    <div class="flex items-center">
                        <input type="checkbox" id="budget-active" class="h-4 w-4 text-primary-600 border-gray-300 rounded" checked>
                        <label for="budget-active" class="ml-2 text-sm text-gray-700">
                            Active budget (track spending against this budget)
                        </label>
                    </div>
                </div>
            </form>
            
            <div class="modal-footer">
                <button id="cancel-budget-btn" class="btn btn-outline">Cancel</button>
                <button id="save-budget-btn" class="btn btn-primary">
                    <span id="save-budget-text">Create Budget</span>
                </button>
            </div>
        `;
    }

    getInsightsModalHTML() {
        return `
            <div class="modal-header">
                <h3 class="modal-title">AI Budget Insights</h3>
                <button id="close-insights-modal-btn" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="space-y-6">
                    <!-- Spending Analysis -->
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <div class="flex items-start space-x-3">
                            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                </svg>
                            </div>
                            <div>
                                <h4 class="font-semibold text-blue-900">Spending Pattern Analysis</h4>
                                <p class="text-blue-800 text-sm mt-1">Your transportation spending has increased by 25% this month. Consider carpooling or using public transport to stay within budget.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Budget Recommendations -->
                    <div class="bg-green-50 p-4 rounded-lg">
                        <div class="flex items-start space-x-3">
                            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                            <div>
                                <h4 class="font-semibold text-green-900">Budget Optimization</h4>
                                <p class="text-green-800 text-sm mt-1">Great job staying under budget in Entertainment! You could reallocate $150 from Entertainment to Emergency Fund for better financial health.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Savings Opportunities -->
                    <div class="bg-yellow-50 p-4 rounded-lg">
                        <div class="flex items-start space-x-3">
                            <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                <svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                                </svg>
                            </div>
                            <div>
                                <h4 class="font-semibold text-yellow-900">Savings Opportunity</h4>
                                <p class="text-yellow-800 text-sm mt-1">Based on your spending patterns, you could save $200/month by meal prepping instead of dining out. Consider creating a "Meal Prep" budget category.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Predicted Spending -->
                    <div class="bg-purple-50 p-4 rounded-lg">
                        <div class="flex items-start space-x-3">
                            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                                </svg>
                            </div>
                            <div>
                                <h4 class="font-semibold text-purple-900">Spending Forecast</h4>
                                <p class="text-purple-800 text-sm mt-1">Based on current trends, you're projected to exceed your Food budget by $120 this month. Consider reducing dining out expenses.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Recommended Actions -->
                    <div class="border-t pt-4">
                        <h4 class="font-semibold text-gray-900 mb-3">Recommended Actions</h4>
                        <div class="space-y-2">
                            <div class="flex items-center space-x-2">
                                <input type="checkbox" class="h-4 w-4 text-primary-600 border-gray-300 rounded">
                                <span class="text-sm text-gray-700">Set up automatic savings transfer of $200/month</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <input type="checkbox" class="h-4 w-4 text-primary-600 border-gray-300 rounded">
                                <span class="text-sm text-gray-700">Reduce food budget to $650 and increase transportation to $450</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <input type="checkbox" class="h-4 w-4 text-primary-600 border-gray-300 rounded">
                                <span class="text-sm text-gray-700">Enable spending alerts at 75% of budget limit</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button id="close-insights-btn" class="btn btn-outline">Close</button>
                <button id="apply-recommendations-btn" class="btn btn-primary">Apply Selected</button>
            </div>
        `;
    }

    getErrorHTML() {
        return `
            <div class="p-6 text-center">
                <div class="w-16 h-16 mx-auto mb-4 text-gray-400">
                    ${this.getIcon('alert-circle')}
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load budgets</h3>
                <p class="text-gray-600 mb-4">There was an error loading your budget data.</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    Try again
                </button>
            </div>
        `;
    }

    attachEventListeners() {
        // Create budget button
        const createBtn = document.getElementById('create-budget-btn');
        if (createBtn) {
            createBtn.addEventListener('click', this.handleCreateBudget);
        }

        // AI Insights button
        const insightsBtn = document.getElementById('budget-insights-btn');
        if (insightsBtn) {
            insightsBtn.addEventListener('click', this.showInsightsModal.bind(this));
        }

        // Period selector
        const periodSelector = document.getElementById('period-selector');
        if (periodSelector) {
            periodSelector.addEventListener('change', this.handlePeriodChange);
        }

        // Budget actions
        const editButtons = document.querySelectorAll('.edit-budget-btn');
        const deleteButtons = document.querySelectorAll('.delete-budget-btn');

        editButtons.forEach(btn => {
            btn.addEventListener('click', this.handleEditBudget);
        });
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', this.handleDeleteBudget);
        });

        // Modal event listeners
        this.attachModalEventListeners();

        // Export button
        const exportBtn = document.getElementById('export-budgets-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', this.handleExport.bind(this));
        }

        // Bulk selection
        const selectAllCheckbox = document.getElementById('select-all-budgets');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', this.handleSelectAll.bind(this));
        }

        const budgetCheckboxes = document.querySelectorAll('.budget-checkbox');
        budgetCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', this.handleBudgetSelect.bind(this));
        });
    }

    attachModalEventListeners() {
        // Budget modal
        const budgetModal = document.getElementById('budget-modal');
        const closeBudgetModalBtn = document.getElementById('close-budget-modal-btn');
        const cancelBudgetBtn = document.getElementById('cancel-budget-btn');
        const saveBudgetBtn = document.getElementById('save-budget-btn');
        const budgetForm = document.getElementById('budget-form');

        if (closeBudgetModalBtn) closeBudgetModalBtn.addEventListener('click', this.hideBudgetModal.bind(this));
        if (cancelBudgetBtn) cancelBudgetBtn.addEventListener('click', this.hideBudgetModal.bind(this));
        if (saveBudgetBtn) saveBudgetBtn.addEventListener('click', this.saveBudget.bind(this));
        if (budgetForm) budgetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBudget();
        });

        // Alert threshold slider
        const thresholdSlider = document.getElementById('budget-alert-threshold');
        const thresholdValue = document.getElementById('threshold-value');
        if (thresholdSlider && thresholdValue) {
            thresholdSlider.addEventListener('input', (e) => {
                thresholdValue.textContent = e.target.value + '%';
            });
        }

        // Insights modal
        const insightsModal = document.getElementById('insights-modal');
        const closeInsightsModalBtn = document.getElementById('close-insights-modal-btn');
        const closeInsightsBtn = document.getElementById('close-insights-btn');
        const applyRecommendationsBtn = document.getElementById('apply-recommendations-btn');

        if (closeInsightsModalBtn) closeInsightsModalBtn.addEventListener('click', this.hideInsightsModal.bind(this));
        if (closeInsightsBtn) closeInsightsBtn.addEventListener('click', this.hideInsightsModal.bind(this));
        if (applyRecommendationsBtn) applyRecommendationsBtn.addEventListener('click', this.applyRecommendations.bind(this));
    }

    handlePeriodChange(event) {
        this.currentPeriod = event.target.value;
        // Filter budgets by period and update display
        this.updateBudgetDisplay();
    }

    handleCreateBudget() {
        this.showBudgetModal('Create Budget');
        this.resetBudgetForm();
        
        // Set default values
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        document.getElementById('budget-start-date').value = firstDay.toISOString().split('T')[0];
        document.getElementById('budget-end-date').value = lastDay.toISOString().split('T')[0];
        document.getElementById('budget-period').value = 'monthly';
        document.getElementById('budget-alert-threshold').value = '80';
        document.getElementById('threshold-value').textContent = '80%';
        document.getElementById('budget-active').checked = true;
    }

    handleEditBudget(event) {
        const budgetId = parseInt(event.currentTarget.dataset.budgetId);
        const budget = this.budgets.find(b => b.id === budgetId);
        
        if (budget) {
            this.selectedBudget = budget;
            this.showBudgetModal('Edit Budget');
            this.populateBudgetForm(budget);
        }
    }

    handleDeleteBudget(event) {
        const budgetId = parseInt(event.currentTarget.dataset.budgetId);
        const budget = this.budgets.find(b => b.id === budgetId);
        
        if (budget) {
            this.confirmDeleteBudget([budgetId], `Are you sure you want to delete the budget "${budget.name}"?`);
        }
    }

    handleBulkAction(action, selectedIds) {
        switch (action) {
            case 'delete':
                this.confirmDeleteBudget(selectedIds, `Are you sure you want to delete ${selectedIds.length} budget(s)?`);
                break;
        }
    }

    // Modal methods
    showBudgetModal(title) {
        const modal = document.getElementById('budget-modal');
        const modalTitle = document.getElementById('budget-modal-title');
        
        if (modal && modalTitle) {
            modalTitle.textContent = title;
            modal.classList.remove('hidden');
        }
    }

    hideBudgetModal() {
        const modal = document.getElementById('budget-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.selectedBudget = null;
    }

    showInsightsModal() {
        const modal = document.getElementById('insights-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideInsightsModal() {
        const modal = document.getElementById('insights-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    resetBudgetForm() {
        const form = document.getElementById('budget-form');
        if (form) {
            form.reset();
            document.getElementById('budget-id').value = '';
        }
    }

    populateBudgetForm(budget) {
        document.getElementById('budget-id').value = budget.id;
        document.getElementById('budget-name').value = budget.name;
        document.getElementById('budget-description').value = budget.description;
        document.getElementById('budget-category').value = budget.category;
        document.getElementById('budget-limit').value = budget.limit;
        document.getElementById('budget-period').value = budget.period;
        document.getElementById('budget-start-date').value = budget.startDate;
        document.getElementById('budget-end-date').value = budget.endDate;
        document.getElementById('budget-alert-threshold').value = budget.alertThreshold;
        document.getElementById('threshold-value').textContent = budget.alertThreshold + '%';
        document.getElementById('budget-active').checked = budget.isActive;
    }

    async saveBudget() {
        const form = document.getElementById('budget-form');
        const formData = new FormData(form);
        
        const budgetData = {
            id: document.getElementById('budget-id').value || Date.now(),
            name: document.getElementById('budget-name').value,
            description: document.getElementById('budget-description').value,
            category: document.getElementById('budget-category').value,
            limit: parseFloat(document.getElementById('budget-limit').value),
            period: document.getElementById('budget-period').value,
            startDate: document.getElementById('budget-start-date').value,
            endDate: document.getElementById('budget-end-date').value,
            alertThreshold: parseInt(document.getElementById('budget-alert-threshold').value),
            isActive: document.getElementById('budget-active').checked,
            spent: 0 // Initialize spent amount for new budgets
        };

        try {
            const isEdit = !!document.getElementById('budget-id').value;
            
            if (isEdit) {
                // Update existing budget
                const index = this.budgets.findIndex(b => b.id == budgetData.id);
                if (index !== -1) {
                    // Preserve spent amount when editing
                    budgetData.spent = this.budgets[index].spent;
                    this.budgets[index] = { ...this.budgets[index], ...budgetData };
                }
                this.notificationService.success('Budget updated successfully');
            } else {
                // Add new budget
                this.budgets.push(budgetData);
                this.notificationService.success('Budget created successfully');
            }
            
            this.updateBudgetDisplay();
            this.hideBudgetModal();
        } catch (error) {
            this.notificationService.error('Failed to save budget');
        }
    }

    confirmDeleteBudget(budgetIds, message) {
        if (confirm(message)) {
            // Remove budgets
            this.budgets = this.budgets.filter(b => !budgetIds.includes(b.id));
            this.updateBudgetDisplay();
            this.notificationService.success(`${budgetIds.length} budget(s) deleted`);
        }
    }

    applyRecommendations() {
        // Simulate applying AI recommendations
        this.notificationService.info('Applying AI recommendations...');
        setTimeout(() => {
            this.notificationService.success('Recommendations applied successfully!');
            this.hideInsightsModal();
        }, 1500);
    }

    updateBudgetDisplay() {
        // Update the entire budget section
        const statsContainer = this.container.querySelector('.grid.grid-cols-1.md\\:grid-cols-4.gap-6.mb-8');
        const cardsContainer = this.container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-6.mb-8');
        const tableContainer = this.container.querySelector('.card-body.p-0');

        if (statsContainer) {
            statsContainer.innerHTML = this.getBudgetStatsHTML();
        }
        if (cardsContainer) {
            cardsContainer.innerHTML = this.getBudgetCardsHTML();
        }
        if (tableContainer) {
            tableContainer.innerHTML = this.getBudgetTableHTML();
        }

        // Re-attach event listeners for new elements
        this.attachBudgetEventListeners();
    }

    attachBudgetEventListeners() {
        // Re-attach listeners for dynamically created elements
        const editButtons = document.querySelectorAll('.edit-budget-btn');
        const deleteButtons = document.querySelectorAll('.delete-budget-btn');
        const checkboxes = document.querySelectorAll('.budget-checkbox');
        const selectAll = document.getElementById('select-all-budgets');

        editButtons.forEach(btn => btn.addEventListener('click', this.handleEditBudget));
        deleteButtons.forEach(btn => btn.addEventListener('click', this.handleDeleteBudget));
        checkboxes.forEach(checkbox => checkbox.addEventListener('change', this.handleBudgetSelect.bind(this)));
        if (selectAll) selectAll.addEventListener('change', this.handleSelectAll.bind(this));
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    }

    formatDateRange(startDate, endDate) {
        const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${start} - ${end}`;
    }

    getBudgetProgressColor(percentage) {
        if (percentage >= 100) return 'bg-danger-500';
        if (percentage >= 85) return 'bg-warning-500';
        if (percentage >= 70) return 'bg-yellow-500';
        return 'bg-success-500';
    }

    getBudgetStatus(percentage, alertThreshold) {
        if (percentage >= 100) return 'Over Budget';
        if (percentage >= alertThreshold) return 'Near Limit';
        if (percentage >= 50) return 'On Track';
        return 'Under Budget';
    }

    getBudgetStatusBadgeClass(percentage, alertThreshold) {
        if (percentage >= 100) return 'badge-danger';
        if (percentage >= alertThreshold) return 'badge-warning';
        if (percentage >= 50) return 'badge-primary';
        return 'badge-success';
    }

    getCategoryBadgeClass(category) {
        const categoryClasses = {
            'Food': 'badge-warning',
            'Transportation': 'badge-primary',
            'Shopping': 'badge-danger',
            'Utilities': 'badge-gray',
            'Entertainment': 'badge-success',
            'Health': 'badge-primary',
            'Education': 'badge-success',
            'Savings': 'badge-primary',
            'Other': 'badge-gray'
        };
        return categoryClasses[category] || 'badge-gray';
    }

    getIcon(name) {
        const icons = {
            'pie-chart': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/></svg>',
            'dollar-sign': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>',
            'credit-card': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>',
            'alert-triangle': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>',
            'alert-circle': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        };
        return icons[name] || '';
    }

    handleSelectAll(event) {
        const checkboxes = document.querySelectorAll('.budget-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = event.target.checked;
        });
        this.updateBulkActions();
    }

    handleBudgetSelect() {
        this.updateBulkActions();
    }

    updateBulkActions() {
        const checkboxes = document.querySelectorAll('.budget-checkbox:checked');
        const bulkEditBtn = document.getElementById('bulk-edit-btn');
        
        if (bulkEditBtn) {
            if (checkboxes.length > 0) {
                bulkEditBtn.classList.remove('hidden');
                bulkEditBtn.textContent = `Edit ${checkboxes.length} Selected`;
            } else {
                bulkEditBtn.classList.add('hidden');
            }
        }
    }

    handleExport() {
        // Simulate export functionality
        this.notificationService.info('Preparing budget export...');
        setTimeout(() => {
            this.notificationService.success('Budgets exported successfully!');
        }, 2000);
    }

    destroy() {
        // Clean up event listeners if needed
    }
}