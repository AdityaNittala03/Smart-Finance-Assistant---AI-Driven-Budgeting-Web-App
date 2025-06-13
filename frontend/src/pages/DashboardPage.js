// Dashboard Page Component

export class DashboardPage {
    constructor(options = {}) {
        this.authService = options.authService;
        this.notificationService = options.notificationService;
        this.router = options.router;
        this.user = options.user;
        this.container = null;
        this.isLoading = true;
        this.dashboardData = null;
        
        // Bind methods
        this.refreshData = this.refreshData.bind(this);
        this.handleQuickAction = this.handleQuickAction.bind(this);
    }

    async render(container) {
        this.container = container;
        
        // Show loading state initially
        this.container.innerHTML = this.getLoadingHTML();
        
        // Load dashboard data
        try {
            await this.loadDashboardData();
            this.container.innerHTML = this.getHTML();
            this.attachEventListeners();
            this.initializeCharts();
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            this.container.innerHTML = this.getErrorHTML();
        }
    }

    async loadDashboardData() {
        // Simulate API calls - replace with actual API service calls
        // In a real implementation, these would be actual API calls
        this.dashboardData = {
            stats: {
                totalBalance: 1234650.00,
                monthlyIncome: 680000.00,
                monthlyExpenses: 259260.00,
                savingsRate: 61.9
            },
            recentTransactions: [
                { id: 1, description: 'Grocery Store', amount: -10040, category: 'Food', date: '2024-12-13', type: 'expense' },
                { id: 2, description: 'Salary Deposit', amount: 340000, category: 'Income', date: '2024-12-12', type: 'income' },
                { id: 3, description: 'Petrol Pump', amount: -3616, category: 'Transportation', date: '2024-12-11', type: 'expense' },
                { id: 4, description: 'Online Shopping', amount: -7199, category: 'Shopping', date: '2024-12-10', type: 'expense' },
                { id: 5, description: 'Cafe Coffee Day', amount: -1020, category: 'Food', date: '2024-12-10', type: 'expense' }
            ],
            budgets: [
                { category: 'Food', spent: 38840, limit: 64000, percentage: 60.7 },
                { category: 'Transportation', spent: 25632, limit: 32000, percentage: 80.1 },
                { category: 'Entertainment', spent: 12020, limit: 24000, percentage: 50.1 },
                { category: 'Shopping', spent: 33660, limit: 40000, percentage: 84.2 }
            ],
            monthlyTrend: [
                { month: 'Jan', income: 620000, expenses: 285000, savings: 335000 },
                { month: 'Feb', income: 635000, expenses: 270000, savings: 365000 },
                { month: 'Mar', income: 650000, expenses: 295000, savings: 355000 },
                { month: 'Apr', income: 645000, expenses: 260000, savings: 385000 },
                { month: 'May', income: 660000, expenses: 275000, savings: 385000 },
                { month: 'Jun', income: 655000, expenses: 250000, savings: 405000 },
                { month: 'Jul', income: 656000, expenses: 248000, savings: 408000 },
                { month: 'Aug', income: 668000, expenses: 260000, savings: 408000 },
                { month: 'Sep', income: 672000, expenses: 254400, savings: 417600 },
                { month: 'Oct', income: 680000, expenses: 264000, savings: 416000 },
                { month: 'Nov', income: 688000, expenses: 252000, savings: 436000 },
                { month: 'Dec', income: 680000, expenses: 259288, savings: 420712 }
            ],
            insights: [
                {
                    type: 'warning',
                    title: 'High Transportation Spending',
                    message: 'Your transportation spending is 80% of your budget this month.',
                    action: 'Review transportation expenses'
                },
                {
                    type: 'success',
                    title: 'Great Savings Rate',
                    message: 'You\'re saving 61.9% of your income this month. Keep it up!',
                    action: null
                },
                {
                    type: 'info',
                    title: 'Budget Recommendation',
                    message: 'Based on your spending patterns, consider increasing your food budget by ₹8000.',
                    action: 'Adjust budget'
                }
            ]
        };
        
        this.isLoading = false;
    }

    getLoadingHTML() {
        return `
            <div class="p-6">
                <div class="animate-pulse">
                    <div class="mb-6">
                        <div class="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        ${Array(4).fill(0).map(() => `
                            <div class="bg-white p-6 rounded-xl border border-gray-200">
                                <div class="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                                <div class="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-white p-6 rounded-xl border border-gray-200">
                            <div class="h-64 bg-gray-200 rounded"></div>
                        </div>
                        <div class="bg-white p-6 rounded-xl border border-gray-200">
                            <div class="h-64 bg-gray-200 rounded"></div>
                        </div>
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
                    <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p class="text-gray-600">Welcome back, ${this.user?.first_name || 'User'}! Here's your financial overview.</p>
                </div>

                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    ${this.getStatsCardsHTML()}
                </div>

                <!-- Main Content -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <!-- Monthly Trend Chart -->
                    <div class="lg:col-span-2">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="text-lg font-semibold text-gray-900">Monthly Trend</h3>
                                <p class="text-sm text-gray-500">Income vs Expenses over time</p>
                            </div>
                            <div class="card-body">
                                <div id="monthly-trend-chart" class="h-64"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Budget Overview -->
                    <div>
                        <div class="card">
                            <div class="card-header">
                                <h3 class="text-lg font-semibold text-gray-900">Budget Overview</h3>
                                <p class="text-sm text-gray-500">This month's spending</p>
                            </div>
                            <div class="card-body space-y-4">
                                ${this.getBudgetOverviewHTML()}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bottom Section -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Recent Transactions -->
                    <div class="card">
                        <div class="card-header flex justify-between items-center">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                                <p class="text-sm text-gray-500">Latest 5 transactions</p>
                            </div>
                            <a href="/transactions" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                View all
                            </a>
                        </div>
                        <div class="card-body">
                            ${this.getRecentTransactionsHTML()}
                        </div>
                    </div>

                    <!-- AI Insights -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-semibold text-gray-900">AI Insights</h3>
                            <p class="text-sm text-gray-500">Personalized recommendations</p>
                        </div>
                        <div class="card-body space-y-4">
                            ${this.getInsightsHTML()}
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="mt-8">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-semibold text-gray-900">Quick Actions</h3>
                        </div>
                        <div class="card-body">
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                ${this.getQuickActionsHTML()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStatsCardsHTML() {
        const stats = this.dashboardData.stats;
        
        const cards = [
            {
                title: 'Total Balance',
                value: this.formatCurrency(stats.totalBalance),
                change: '+2.5%',
                changeType: 'positive',
                icon: 'wallet',
                color: 'primary'
            },
            {
                title: 'Monthly Income',
                value: this.formatCurrency(stats.monthlyIncome),
                change: '+1.2%',
                changeType: 'positive',
                icon: 'trending-up',
                color: 'success'
            },
            {
                title: 'Monthly Expenses',
                value: this.formatCurrency(stats.monthlyExpenses),
                change: '-5.1%',
                changeType: 'negative',
                icon: 'credit-card',
                color: 'warning'
            },
            {
                title: 'Savings Rate',
                value: `${stats.savingsRate}%`,
                change: '+8.3%',
                changeType: 'positive',
                icon: 'piggy-bank',
                color: 'success'
            }
        ];

        return cards.map(card => `
            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div class="stat-card-icon bg-gradient-${card.color}">
                        ${this.getIcon(card.icon)}
                    </div>
                    <div class="stat-card-change ${card.changeType === 'positive' ? 'text-success-600' : 'text-danger-600'}">
                        ${card.change}
                    </div>
                </div>
                <div class="stat-card-value">${card.value}</div>
                <div class="stat-card-label">${card.title}</div>
            </div>
        `).join('');
    }

    getBudgetOverviewHTML() {
        return this.dashboardData.budgets.map(budget => `
            <div class="space-y-2">
                <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-700">${budget.category}</span>
                    <span class="text-sm text-gray-500">
                        ${this.formatCurrency(budget.spent)} / ${this.formatCurrency(budget.limit)}
                    </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="h-2 rounded-full transition-all duration-300 ${this.getBudgetProgressColor(budget.percentage)}" 
                         style="width: ${Math.min(budget.percentage, 100)}%"></div>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">${budget.percentage.toFixed(1)}% used</span>
                    <span class="text-xs ${budget.percentage > 90 ? 'text-danger-600' : 'text-gray-500'}">
                        ${this.formatCurrency(budget.limit - budget.spent)} left
                    </span>
                </div>
            </div>
        `).join('');
    }

    getRecentTransactionsHTML() {
        return `
            <div class="space-y-3">
                ${this.dashboardData.recentTransactions.map(transaction => `
                    <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center ${
                                transaction.type === 'income' ? 'bg-success-100 text-success-600' : 'bg-gray-100 text-gray-600'
                            }">
                                ${transaction.type === 'income' ? this.getIcon('arrow-down') : this.getIcon('arrow-up')}
                            </div>
                            <div>
                                <p class="font-medium text-gray-900">${transaction.description}</p>
                                <p class="text-sm text-gray-500">${transaction.category} • ${this.formatDate(transaction.date)}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="font-semibold ${transaction.type === 'income' ? 'text-success-600' : 'text-gray-900'}">
                                ${transaction.type === 'income' ? '+' : ''}${this.formatCurrency(transaction.amount)}
                            </p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getInsightsHTML() {
        return this.dashboardData.insights.map(insight => `
            <div class="p-4 rounded-lg border ${this.getInsightBorderColor(insight.type)}">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        ${this.getInsightIcon(insight.type)}
                    </div>
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-900">${insight.title}</h4>
                        <p class="text-sm text-gray-600 mt-1">${insight.message}</p>
                        ${insight.action ? `
                            <button class="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700">
                                ${insight.action}
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    getQuickActionsHTML() {
        const actions = [
            { label: 'Add Transaction', icon: 'plus', action: 'add-transaction', color: 'primary' },
            { label: 'Create Budget', icon: 'pie-chart', action: 'create-budget', color: 'success' },
            { label: 'View Analytics', icon: 'bar-chart', action: 'view-analytics', color: 'info' },
            { label: 'Export Data', icon: 'download', action: 'export-data', color: 'secondary' }
        ];

        return actions.map(action => `
            <button data-action="${action.action}" 
                    class="quick-action-btn p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-${action.color}-300 transition-colors group">
                <div class="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-${action.color}-600">
                    ${this.getIcon(action.icon)}
                </div>
                <span class="text-sm font-medium text-gray-700 group-hover:text-${action.color}-700">
                    ${action.label}
                </span>
            </button>
        `).join('');
    }

    getErrorHTML() {
        return `
            <div class="p-6 text-center">
                <div class="w-16 h-16 mx-auto mb-4 text-gray-400">
                    ${this.getIcon('alert-circle')}
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard</h3>
                <p class="text-gray-600 mb-4">There was an error loading your dashboard data.</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    Try again
                </button>
            </div>
        `;
    }

    attachEventListeners() {
        // Quick action buttons
        const quickActionBtns = this.container.querySelectorAll('.quick-action-btn');
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', this.handleQuickAction);
        });

        // Refresh data periodically (every 5 minutes)
        this.refreshInterval = setInterval(this.refreshData, 5 * 60 * 1000);
    }

    handleQuickAction(event) {
        const action = event.currentTarget.dataset.action;
        
        switch (action) {
            case 'add-transaction':
                this.router.navigate('/transactions?action=add');
                break;
            case 'create-budget':
                this.router.navigate('/budgets?action=create');
                break;
            case 'view-analytics':
                this.router.navigate('/analytics');
                break;
            case 'export-data':
                this.handleExportData();
                break;
        }
    }

    async handleExportData() {
        try {
            this.notificationService.info('Preparing data export...');
            // Simulate export functionality
            setTimeout(() => {
                this.notificationService.success('Data export completed!');
            }, 2000);
        } catch (error) {
            this.notificationService.error('Failed to export data');
        }
    }

    async refreshData() {
        try {
            await this.loadDashboardData();
            // Update only the dynamic content without full re-render
            this.updateDynamicContent();
        } catch (error) {
            console.error('Failed to refresh dashboard data:', error);
        }
    }

    updateDynamicContent() {
        // Update stats cards
        const statsContainer = this.container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
        if (statsContainer) {
            statsContainer.innerHTML = this.getStatsCardsHTML();
        }
    }

    initializeCharts() {
        // Initialize the monthly trend chart
        this.initializeMonthlyTrendChart();
    }

    async initializeMonthlyTrendChart() {
        try {
            // Dynamically import ChartService
            const { ChartService } = await import('../charts/ChartService');
            const chartService = new ChartService();
            
            const chartContainer = document.getElementById('monthly-trend-chart');
            if (chartContainer && this.dashboardData?.monthlyTrend) {
                chartService.createLineChart('monthly-trend-chart', this.dashboardData.monthlyTrend);
            }
        } catch (error) {
            console.error('Failed to load chart:', error);
            // Fallback to placeholder
            const chartContainer = document.getElementById('monthly-trend-chart');
            if (chartContainer) {
                chartContainer.innerHTML = `
                    <div class="flex items-center justify-center h-full text-gray-500">
                        <div class="text-center">
                            <div class="w-16 h-16 mx-auto mb-4 text-gray-300">
                                ${this.getIcon('bar-chart')}
                            </div>
                            <p class="text-sm">Chart will be implemented with D3.js</p>
                            <p class="text-xs mt-1">Monthly trend: Income vs Expenses</p>
                        </div>
                    </div>
                `;
            }
        }
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(Math.abs(amount));
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    getBudgetProgressColor(percentage) {
        if (percentage >= 90) return 'bg-danger-500';
        if (percentage >= 75) return 'bg-warning-500';
        return 'bg-success-500';
    }

    getInsightBorderColor(type) {
        switch (type) {
            case 'warning': return 'border-warning-200 bg-warning-50';
            case 'success': return 'border-success-200 bg-success-50';
            case 'info': return 'border-primary-200 bg-primary-50';
            default: return 'border-gray-200 bg-gray-50';
        }
    }

    getInsightIcon(type) {
        const iconClass = type === 'warning' ? 'text-warning-600' : 
                         type === 'success' ? 'text-success-600' : 'text-primary-600';
        
        const iconName = type === 'warning' ? 'alert-triangle' : 
                        type === 'success' ? 'check-circle' : 'info';
        
        return `<div class="w-5 h-5 ${iconClass}">${this.getIcon(iconName)}</div>`;
    }

    getIcon(name) {
        const icons = {
            'wallet': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>',
            'trending-up': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>',
            'credit-card': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>',
            'piggy-bank': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>',
            'plus': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>',
            'pie-chart': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/></svg>',
            'bar-chart': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>',
            'download': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>',
            'arrow-up': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>',
            'arrow-down': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>',
            'alert-triangle': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>',
            'check-circle': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            'info': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            'alert-circle': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        };
        return icons[name] || '';
    }

    destroy() {
        // Clear refresh interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Clean up event listeners
        const quickActionBtns = this.container?.querySelectorAll('.quick-action-btn');
        quickActionBtns?.forEach(btn => {
            btn.removeEventListener('click', this.handleQuickAction);
        });
    }
}