// Analytics Page Component

export class AnalyticsPage {
    constructor(options = {}) {
        this.authService = options.authService;
        this.notificationService = options.notificationService;
        this.router = options.router;
        this.user = options.user;
        this.container = null;
        this.isLoading = true;
        this.analyticsData = null;
        this.selectedPeriod = '6months';
        this.selectedMetric = 'spending';
        this.currentView = 'overview';
        
        // Chart instances (for cleanup)
        this.charts = {};
        
        // Bind methods
        this.handlePeriodChange = this.handlePeriodChange.bind(this);
        this.handleMetricChange = this.handleMetricChange.bind(this);
        this.handleViewChange = this.handleViewChange.bind(this);
        this.handleExportReport = this.handleExportReport.bind(this);
        this.handleRefreshData = this.handleRefreshData.bind(this);
    }

    async render(container) {
        this.container = container;
        
        // Show loading state initially
        this.container.innerHTML = this.getLoadingHTML();
        
        try {
            await this.loadAnalyticsData();
            this.container.innerHTML = this.getHTML();
            this.attachEventListeners();
            this.initializeCharts();
        } catch (error) {
            console.error('Failed to load analytics:', error);
            this.container.innerHTML = this.getErrorHTML();
        }
    }

    async loadAnalyticsData() {
        // Simulate API call - replace with actual API service call
        this.analyticsData = {
            overview: {
                totalSpending: 996060,
                totalIncome: 1984000,
                netSavings: 987940,
                savingsRate: 49.8,
                avgMonthlySpending: 166010,
                topCategory: 'Food',
                spendingTrend: 'increasing',
                budgetAdherence: 78.5
            },
            monthlyTrends: [
                { month: 'Jul 2024', income: 8200, expenses: 3100, savings: 5100, categories: { Food: 850, Transportation: 320, Shopping: 420, Utilities: 380, Entertainment: 180, Health: 150, Education: 100, Other: 700 } },
                { month: 'Aug 2024', income: 8350, expenses: 3250, savings: 5100, categories: { Food: 880, Transportation: 340, Shopping: 450, Utilities: 390, Entertainment: 220, Health: 160, Education: 120, Other: 690 } },
                { month: 'Sep 2024', income: 8400, expenses: 3180, savings: 5220, categories: { Food: 820, Transportation: 310, Shopping: 480, Utilities: 400, Entertainment: 200, Health: 140, Education: 130, Other: 700 } },
                { month: 'Oct 2024', income: 8500, expenses: 3300, savings: 5200, categories: { Food: 900, Transportation: 380, Shopping: 520, Utilities: 420, Entertainment: 250, Health: 180, Education: 150, Other: 500 } },
                { month: 'Nov 2024', income: 8600, expenses: 3150, savings: 5450, categories: { Food: 860, Transportation: 320, Shopping: 440, Utilities: 390, Entertainment: 190, Health: 160, Education: 140, Other: 650 } },
                { month: 'Dec 2024', income: 8500, expenses: 3241, savings: 5259, categories: { Food: 890, Transportation: 350, Shopping: 470, Utilities: 410, Entertainment: 210, Health: 170, Education: 160, Other: 581 } }
            ],
            categoryBreakdown: [
                { category: 'Food', amount: 5200, percentage: 28.5, trend: '+5.2%', avgMonthly: 866.67 },
                { category: 'Transportation', amount: 2020, percentage: 11.1, trend: '+2.1%', avgMonthly: 336.67 },
                { category: 'Shopping', amount: 2780, percentage: 15.2, trend: '+8.3%', avgMonthly: 463.33 },
                { category: 'Utilities', amount: 2390, percentage: 13.1, trend: '+1.5%', avgMonthly: 398.33 },
                { category: 'Entertainment', amount: 1250, percentage: 6.9, trend: '+12.1%', avgMonthly: 208.33 },
                { category: 'Health', amount: 960, percentage: 5.3, trend: '+3.2%', avgMonthly: 160.00 },
                { category: 'Education', amount: 800, percentage: 4.4, trend: '+15.6%', avgMonthly: 133.33 },
                { category: 'Other', amount: 2851, percentage: 15.6, trend: '-8.9%', avgMonthly: 475.17 }
            ],
            budgetPerformance: [
                { category: 'Food', budgeted: 800, spent: 890, variance: -90, performance: 111.3 },
                { category: 'Transportation', budgeted: 400, spent: 350, variance: 50, performance: 87.5 },
                { category: 'Shopping', budgeted: 500, spent: 470, variance: 30, performance: 94.0 },
                { category: 'Entertainment', budgeted: 300, spent: 210, variance: 90, performance: 70.0 },
                { category: 'Health', budgeted: 200, spent: 170, variance: 30, performance: 85.0 },
                { category: 'Utilities', budgeted: 450, spent: 410, variance: 40, performance: 91.1 }
            ],
            insights: [
                {
                    type: 'warning',
                    title: 'Food Spending Over Budget',
                    description: 'You\'ve spent $90 more than budgeted on food this month. Consider meal planning to reduce costs.',
                    impact: 'high',
                    action: 'Review food expenses'
                },
                {
                    type: 'success',
                    title: 'Great Transportation Savings',
                    description: 'You\'re under budget by $50 in transportation. Great job using alternative transport!',
                    impact: 'medium',
                    action: 'Maintain current habits'
                },
                {
                    type: 'info',
                    title: 'Entertainment Spending Down',
                    description: 'Entertainment spending decreased by 30% this month. You have $90 leftover budget.',
                    impact: 'low',
                    action: 'Consider reallocating to savings'
                },
                {
                    type: 'warning',
                    title: 'Shopping Trend Increasing',
                    description: 'Shopping expenses have increased 8.3% over the last 3 months.',
                    impact: 'medium',
                    action: 'Set stricter shopping limits'
                }
            ],
            comparisons: {
                lastMonth: {
                    spending: { current: 3241, previous: 3150, change: 2.9 },
                    income: { current: 8500, previous: 8600, change: -1.2 },
                    savings: { current: 5259, previous: 5450, change: -3.5 }
                },
                lastYear: {
                    spending: { current: 18251, previous: 16890, change: 8.1 },
                    income: { current: 50850, previous: 48200, change: 5.5 },
                    savings: { current: 32599, previous: 31310, change: 4.1 }
                }
            },
            goals: [
                { name: 'Emergency Fund', target: 10000, current: 7500, progress: 75.0, deadline: '2025-06-01' },
                { name: 'Vacation Fund', target: 3000, current: 1200, progress: 40.0, deadline: '2025-08-01' },
                { name: 'New Car', target: 15000, current: 4500, progress: 30.0, deadline: '2026-01-01' },
                { name: 'Reduce Food Budget', target: 750, current: 890, progress: 84.3, deadline: '2025-01-31' }
            ]
        };
        
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
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div class="bg-white p-6 rounded-xl border border-gray-200">
                            <div class="h-64 bg-gray-200 rounded"></div>
                        </div>
                        <div class="bg-white p-6 rounded-xl border border-gray-200">
                            <div class="h-64 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        ${Array(4).fill(0).map(() => `
                            <div class="bg-white p-6 rounded-xl border border-gray-200">
                                <div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                                <div class="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
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
                            <h1 class="text-3xl font-bold text-gray-900">Analytics</h1>
                            <p class="text-gray-600">Analyze your financial patterns and trends</p>
                        </div>
                        <div class="mt-4 sm:mt-0 flex space-x-3">
                            <button id="refresh-data-btn" class="btn btn-outline">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                </svg>
                                Refresh
                            </button>
                            <button id="export-report-btn" class="btn btn-primary">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                                Export Report
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Controls -->
                <div class="card mb-6">
                    <div class="card-body">
                        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                            <!-- View Tabs -->
                            <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                                <button class="view-tab px-4 py-2 text-sm font-medium rounded-md transition-colors ${this.currentView === 'overview' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}" data-view="overview">
                                    Overview
                                </button>
                                <button class="view-tab px-4 py-2 text-sm font-medium rounded-md transition-colors ${this.currentView === 'trends' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}" data-view="trends">
                                    Trends
                                </button>
                                <button class="view-tab px-4 py-2 text-sm font-medium rounded-md transition-colors ${this.currentView === 'categories' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}" data-view="categories">
                                    Categories
                                </button>
                                <button class="view-tab px-4 py-2 text-sm font-medium rounded-md transition-colors ${this.currentView === 'goals' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}" data-view="goals">
                                    Goals
                                </button>
                            </div>

                            <!-- Filters -->
                            <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                                <select id="period-selector" class="input">
                                    <option value="1month" ${this.selectedPeriod === '1month' ? 'selected' : ''}>Last Month</option>
                                    <option value="3months" ${this.selectedPeriod === '3months' ? 'selected' : ''}>Last 3 Months</option>
                                    <option value="6months" ${this.selectedPeriod === '6months' ? 'selected' : ''}>Last 6 Months</option>
                                    <option value="1year" ${this.selectedPeriod === '1year' ? 'selected' : ''}>Last Year</option>
                                    <option value="all" ${this.selectedPeriod === 'all' ? 'selected' : ''}>All Time</option>
                                </select>

                                <select id="metric-selector" class="input">
                                    <option value="spending" ${this.selectedMetric === 'spending' ? 'selected' : ''}>Spending</option>
                                    <option value="income" ${this.selectedMetric === 'income' ? 'selected' : ''}>Income</option>
                                    <option value="savings" ${this.selectedMetric === 'savings' ? 'selected' : ''}>Savings</option>
                                    <option value="net_worth" ${this.selectedMetric === 'net_worth' ? 'selected' : ''}>Net Worth</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Dynamic Content Based on View -->
                <div id="analytics-content">
                    ${this.getViewContent()}
                </div>
            </div>
        `;
    }

    getViewContent() {
        switch (this.currentView) {
            case 'overview':
                return this.getOverviewContent();
            case 'trends':
                return this.getTrendsContent();
            case 'categories':
                return this.getCategoriesContent();
            case 'goals':
                return this.getGoalsContent();
            default:
                return this.getOverviewContent();
        }
    }

    getOverviewContent() {
        return `
            <!-- Key Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                ${this.getKeyMetricsHTML()}
            </div>

            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <!-- Income vs Expenses Chart -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-semibold text-gray-900">Income vs Expenses</h3>
                        <p class="text-sm text-gray-500">Monthly comparison over time</p>
                    </div>
                    <div class="card-body">
                        <div id="income-expenses-chart" class="h-64"></div>
                    </div>
                </div>

                <!-- Spending by Category Chart -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-semibold text-gray-900">Spending by Category</h3>
                        <p class="text-sm text-gray-500">Current month breakdown</p>
                    </div>
                    <div class="card-body">
                        <div id="category-pie-chart" class="h-64"></div>
                    </div>
                </div>
            </div>

            <!-- Insights and Comparisons -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- AI Insights -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-semibold text-gray-900">AI Insights</h3>
                        <p class="text-sm text-gray-500">Personalized financial insights</p>
                    </div>
                    <div class="card-body space-y-4">
                        ${this.getInsightsHTML()}
                    </div>
                </div>

                <!-- Period Comparisons -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-semibold text-gray-900">Period Comparisons</h3>
                        <p class="text-sm text-gray-500">Compare with previous periods</p>
                    </div>
                    <div class="card-body space-y-4">
                        ${this.getComparisonsHTML()}
                    </div>
                </div>
            </div>
        `;
    }

    getTrendsContent() {
        return `
            <!-- Trend Charts -->
            <div class="grid grid-cols-1 gap-6 mb-8">
                <!-- Monthly Trends Chart -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-semibold text-gray-900">Monthly Trends</h3>
                        <p class="text-sm text-gray-500">Track your financial trends over time</p>
                    </div>
                    <div class="card-body">
                        <div id="monthly-trends-chart" class="h-80"></div>
                    </div>
                </div>
            </div>

            <!-- Trend Analysis -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="card">
                    <div class="card-body text-center">
                        <div class="w-12 h-12 mx-auto mb-4 bg-success-100 rounded-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                            </svg>
                        </div>
                        <h4 class="font-semibold text-gray-900 mb-2">Income Trend</h4>
                        <p class="text-2xl font-bold text-success-600 mb-1">+5.5%</p>
                        <p class="text-sm text-gray-600">Compared to last year</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-body text-center">
                        <div class="w-12 h-12 mx-auto mb-4 bg-warning-100 rounded-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
                            </svg>
                        </div>
                        <h4 class="font-semibold text-gray-900 mb-2">Expense Trend</h4>
                        <p class="text-2xl font-bold text-warning-600 mb-1">+8.1%</p>
                        <p class="text-sm text-gray-600">Compared to last year</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-body text-center">
                        <div class="w-12 h-12 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                            </svg>
                        </div>
                        <h4 class="font-semibold text-gray-900 mb-2">Savings Rate</h4>
                        <p class="text-2xl font-bold text-primary-600 mb-1">49.8%</p>
                        <p class="text-sm text-gray-600">Of total income</p>
                    </div>
                </div>
            </div>
        `;
    }

    getCategoriesContent() {
        return `
            <!-- Category Analysis -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <!-- Category Breakdown Chart -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-semibold text-gray-900">Category Breakdown</h3>
                        <p class="text-sm text-gray-500">Spending distribution by category</p>
                    </div>
                    <div class="card-body">
                        <div id="category-breakdown-chart" class="h-80"></div>
                    </div>
                </div>

                <!-- Budget Performance -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-semibold text-gray-900">Budget Performance</h3>
                        <p class="text-sm text-gray-500">Actual vs budgeted spending</p>
                    </div>
                    <div class="card-body">
                        <div id="budget-performance-chart" class="h-80"></div>
                    </div>
                </div>
            </div>

            <!-- Category Details Table -->
            <div class="card">
                <div class="card-header">
                    <h3 class="text-lg font-semibold text-gray-900">Category Details</h3>
                    <p class="text-sm text-gray-500">Detailed breakdown by category</p>
                </div>
                <div class="card-body p-0">
                    ${this.getCategoryTableHTML()}
                </div>
            </div>
        `;
    }

    getGoalsContent() {
        return `
            <!-- Goals Overview -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                ${this.getGoalsHTML()}
            </div>

            <!-- Goals Progress Chart -->
            <div class="card mb-6">
                <div class="card-header">
                    <h3 class="text-lg font-semibold text-gray-900">Goals Progress</h3>
                    <p class="text-sm text-gray-500">Track your financial goals over time</p>
                </div>
                <div class="card-body">
                    <div id="goals-progress-chart" class="h-64"></div>
                </div>
            </div>

            <!-- Goal Recommendations -->
            <div class="card">
                <div class="card-header">
                    <h3 class="text-lg font-semibold text-gray-900">Goal Recommendations</h3>
                    <p class="text-sm text-gray-500">AI-powered suggestions to achieve your goals</p>
                </div>
                <div class="card-body space-y-4">
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <div class="flex items-start space-x-3">
                            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                                </svg>
                            </div>
                            <div>
                                <h4 class="font-semibold text-blue-900">Emergency Fund Goal</h4>
                                <p class="text-blue-800 text-sm mt-1">Increase your monthly contribution by $200 to reach your emergency fund goal 3 months earlier.</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-green-50 p-4 rounded-lg">
                        <div class="flex items-start space-x-3">
                            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                                </svg>
                            </div>
                            <div>
                                <h4 class="font-semibold text-green-900">Vacation Fund</h4>
                                <p class="text-green-800 text-sm mt-1">You're on track! Continue saving $300/month to reach your vacation goal by August 2025.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getKeyMetricsHTML() {
        const metrics = [
            {
                title: 'Total Spending',
                value: this.formatCurrency(this.analyticsData.overview.totalSpending),
                change: '+2.9%',
                changeType: 'negative',
                icon: 'credit-card',
                color: 'primary'
            },
            {
                title: 'Total Income',
                value: this.formatCurrency(this.analyticsData.overview.totalIncome),
                change: '+5.5%',
                changeType: 'positive',
                icon: 'trending-up',
                color: 'success'
            },
            {
                title: 'Net Savings',
                value: this.formatCurrency(this.analyticsData.overview.netSavings),
                change: '+4.1%',
                changeType: 'positive',
                icon: 'piggy-bank',
                color: 'success'
            },
            {
                title: 'Savings Rate',
                value: `${this.analyticsData.overview.savingsRate}%`,
                change: '-1.2%',
                changeType: 'negative',
                icon: 'percent',
                color: 'warning'
            }
        ];

        return metrics.map(metric => `
            <div class="stat-card">
                <div class="flex items-center justify-between mb-4">
                    <div class="stat-card-icon bg-gradient-${metric.color}">
                        ${this.getIcon(metric.icon)}
                    </div>
                    <div class="stat-card-change ${metric.changeType === 'positive' ? 'text-success-600' : 'text-danger-600'}">
                        ${metric.change}
                    </div>
                </div>
                <div class="stat-card-value">${metric.value}</div>
                <div class="stat-card-label">${metric.title}</div>
            </div>
        `).join('');
    }

    getInsightsHTML() {
        return this.analyticsData.insights.map(insight => `
            <div class="p-4 rounded-lg border ${this.getInsightBorderColor(insight.type)}">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        ${this.getInsightIcon(insight.type)}
                    </div>
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-900">${insight.title}</h4>
                        <p class="text-sm text-gray-600 mt-1">${insight.description}</p>
                        <div class="flex items-center justify-between mt-3">
                            <span class="badge ${this.getImpactBadgeClass(insight.impact)}">${insight.impact} impact</span>
                            <button class="text-sm font-medium text-primary-600 hover:text-primary-700">
                                ${insight.action}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getComparisonsHTML() {
        const { lastMonth, lastYear } = this.analyticsData.comparisons;
        
        return `
            <div class="space-y-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-medium text-gray-900 mb-3">vs Last Month</h4>
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600">Spending</span>
                            <div class="flex items-center space-x-2">
                                <span class="font-medium">${this.formatCurrency(lastMonth.spending.current)}</span>
                                <span class="text-sm ${lastMonth.spending.change > 0 ? 'text-danger-600' : 'text-success-600'}">
                                    ${lastMonth.spending.change > 0 ? '+' : ''}${lastMonth.spending.change}%
                                </span>
                            </div>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600">Income</span>
                            <div class="flex items-center space-x-2">
                                <span class="font-medium">${this.formatCurrency(lastMonth.income.current)}</span>
                                <span class="text-sm ${lastMonth.income.change > 0 ? 'text-success-600' : 'text-danger-600'}">
                                    ${lastMonth.income.change > 0 ? '+' : ''}${lastMonth.income.change}%
                                </span>
                            </div>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600">Savings</span>
                            <div class="flex items-center space-x-2">
                                <span class="font-medium">${this.formatCurrency(lastMonth.savings.current)}</span>
                                <span class="text-sm ${lastMonth.savings.change > 0 ? 'text-success-600' : 'text-danger-600'}">
                                    ${lastMonth.savings.change > 0 ? '+' : ''}${lastMonth.savings.change}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-medium text-gray-900 mb-3">vs Last Year</h4>
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600">Spending</span>
                            <div class="flex items-center space-x-2">
                                <span class="font-medium">${this.formatCurrency(lastYear.spending.current)}</span>
                                <span class="text-sm ${lastYear.spending.change > 0 ? 'text-danger-600' : 'text-success-600'}">
                                    ${lastYear.spending.change > 0 ? '+' : ''}${lastYear.spending.change}%
                                </span>
                            </div>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600">Income</span>
                            <div class="flex items-center space-x-2">
                                <span class="font-medium">${this.formatCurrency(lastYear.income.current)}</span>
                                <span class="text-sm ${lastYear.income.change > 0 ? 'text-success-600' : 'text-danger-600'}">
                                    ${lastYear.income.change > 0 ? '+' : ''}${lastYear.income.change}%
                                </span>
                            </div>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600">Savings</span>
                            <div class="flex items-center space-x-2">
                                <span class="font-medium">${this.formatCurrency(lastYear.savings.current)}</span>
                                <span class="text-sm ${lastYear.savings.change > 0 ? 'text-success-600' : 'text-danger-600'}">
                                    ${lastYear.savings.change > 0 ? '+' : ''}${lastYear.savings.change}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getCategoryTableHTML() {
        return `
            <div class="overflow-x-auto">
                <table class="table">
                    <thead class="table-header">
                        <tr>
                            <th class="table-header-cell">Category</th>
                            <th class="table-header-cell text-right">Amount</th>
                            <th class="table-header-cell text-right">Percentage</th>
                            <th class="table-header-cell text-right">Avg Monthly</th>
                            <th class="table-header-cell">Trend</th>
                        </tr>
                    </thead>
                    <tbody class="table-body">
                        ${this.analyticsData.categoryBreakdown.map(category => `
                            <tr class="table-row">
                                <td class="table-cell">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-3 h-3 rounded-full bg-primary-500"></div>
                                        <span class="font-medium text-gray-900">${category.category}</span>
                                    </div>
                                </td>
                                <td class="table-cell text-right font-medium">${this.formatCurrency(category.amount)}</td>
                                <td class="table-cell text-right">${category.percentage}%</td>
                                <td class="table-cell text-right">${this.formatCurrency(category.avgMonthly)}</td>
                                <td class="table-cell">
                                    <span class="text-sm ${category.trend.startsWith('+') ? 'text-danger-600' : 'text-success-600'}">
                                        ${category.trend}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getGoalsHTML() {
        return this.analyticsData.goals.map(goal => `
            <div class="card">
                <div class="card-body">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h4 class="font-semibold text-gray-900">${goal.name}</h4>
                            <p class="text-sm text-gray-600">Target by ${this.formatDate(goal.deadline)}</p>
                        </div>
                        <span class="badge ${goal.progress >= 75 ? 'badge-success' : goal.progress >= 50 ? 'badge-warning' : 'badge-gray'}">
                            ${goal.progress.toFixed(1)}%
                        </span>
                    </div>

                    <div class="space-y-3">
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-600">Progress</span>
                            <span class="font-medium">${this.formatCurrency(goal.current)} / ${this.formatCurrency(goal.target)}</span>
                        </div>
                        
                        <div class="w-full bg-gray-200 rounded-full h-3">
                            <div class="h-3 rounded-full transition-all duration-300 ${this.getGoalProgressColor(goal.progress)}" 
                                 style="width: ${Math.min(goal.progress, 100)}%"></div>
                        </div>
                        
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-600">Remaining</span>
                            <span class="font-medium text-gray-900">${this.formatCurrency(goal.target - goal.current)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getErrorHTML() {
        return `
            <div class="p-6 text-center">
                <div class="w-16 h-16 mx-auto mb-4 text-gray-400">
                    ${this.getIcon('alert-circle')}
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load analytics</h3>
                <p class="text-gray-600 mb-4">There was an error loading your analytics data.</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    Try again
                </button>
            </div>
        `;
    }

    attachEventListeners() {
        // View tabs
        const viewTabs = document.querySelectorAll('.view-tab');
        viewTabs.forEach(tab => {
            tab.addEventListener('click', this.handleViewChange);
        });

        // Period and metric selectors
        const periodSelector = document.getElementById('period-selector');
        const metricSelector = document.getElementById('metric-selector');
        
        if (periodSelector) {
            periodSelector.addEventListener('change', this.handlePeriodChange);
        }
        
        if (metricSelector) {
            metricSelector.addEventListener('change', this.handleMetricChange);
        }

        // Action buttons
        const refreshBtn = document.getElementById('refresh-data-btn');
        const exportBtn = document.getElementById('export-report-btn');
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.handleRefreshData);
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', this.handleExportReport);
        }
    }

    handleViewChange(event) {
        const newView = event.target.dataset.view;
        if (newView !== this.currentView) {
            this.currentView = newView;
            this.updateViewTabs();
            this.updateContent();
        }
    }

    handlePeriodChange(event) {
        this.selectedPeriod = event.target.value;
        this.refreshAnalytics();
    }

    handleMetricChange(event) {
        this.selectedMetric = event.target.value;
        this.refreshAnalytics();
    }

    async handleRefreshData() {
        try {
            this.notificationService.info('Refreshing analytics data...');
            await this.loadAnalyticsData();
            this.updateContent();
            this.initializeCharts();
            this.notificationService.success('Analytics data refreshed');
        } catch (error) {
            this.notificationService.error('Failed to refresh data');
        }
    }

    handleExportReport() {
        this.notificationService.info('Preparing analytics report...');
        setTimeout(() => {
            this.notificationService.success('Analytics report exported successfully!');
        }, 2000);
    }

    updateViewTabs() {
        const viewTabs = document.querySelectorAll('.view-tab');
        viewTabs.forEach(tab => {
            const view = tab.dataset.view;
            if (view === this.currentView) {
                tab.className = 'view-tab px-4 py-2 text-sm font-medium rounded-md transition-colors bg-white text-primary-700 shadow-sm';
            } else {
                tab.className = 'view-tab px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:text-gray-900';
            }
        });
    }

    updateContent() {
        const contentContainer = document.getElementById('analytics-content');
        if (contentContainer) {
            contentContainer.innerHTML = this.getViewContent();
            // Use setTimeout to ensure DOM is updated before initializing charts
            setTimeout(() => this.initializeCharts(), 100);
        }
    }

    async refreshAnalytics() {
        // In a real implementation, this would make an API call with the new filters
        this.updateContent();
        this.initializeCharts();
    }

    async initializeCharts() {
        try {
            // Dynamically import ChartService
            const { ChartService } = await import('../charts/ChartService');
            this.chartService = new ChartService();
            
            // Initialize charts based on current view
            this.initializeSpecificCharts();
        } catch (error) {
            console.error('Failed to load ChartService:', error);
            // Fallback to placeholders
            this.initializePlaceholderChart('income-expenses-chart', 'Income vs Expenses Chart');
            this.initializePlaceholderChart('category-pie-chart', 'Category Pie Chart');
            this.initializePlaceholderChart('monthly-trends-chart', 'Monthly Trends Chart');
            this.initializePlaceholderChart('category-breakdown-chart', 'Category Breakdown Chart');
            this.initializePlaceholderChart('budget-performance-chart', 'Budget Performance Chart');
            this.initializePlaceholderChart('goals-progress-chart', 'Goals Progress Chart');
        }
    }

    initializeSpecificCharts() {
        if (!this.chartService || !this.analyticsData) return;

        // Income vs Expenses Line Chart
        if (document.getElementById('income-expenses-chart')) {
            this.chartService.createLineChart('income-expenses-chart', this.analyticsData.monthlyTrends);
        }

        // Category Pie Chart
        if (document.getElementById('category-pie-chart')) {
            const currentMonth = this.analyticsData.monthlyTrends[this.analyticsData.monthlyTrends.length - 1];
            const categoryData = Object.keys(currentMonth.categories).map(category => ({
                category,
                amount: currentMonth.categories[category],
                percentage: (currentMonth.categories[category] / currentMonth.expenses) * 100
            }));
            this.chartService.createPieChart('category-pie-chart', categoryData);
        }

        // Monthly Trends Area Chart
        if (document.getElementById('monthly-trends-chart')) {
            this.chartService.createAreaChart('monthly-trends-chart', this.analyticsData.monthlyTrends);
        }

        // Category Breakdown Bar Chart
        if (document.getElementById('category-breakdown-chart')) {
            this.chartService.createBarChart('category-breakdown-chart', this.analyticsData.categoryBreakdown.map(cat => ({
                category: cat.category,
                budgeted: cat.amount,
                spent: cat.amount
            })));
        }

        // Budget Performance Chart
        if (document.getElementById('budget-performance-chart')) {
            this.chartService.createBarChart('budget-performance-chart', this.analyticsData.budgetPerformance);
        }

        // Goals Progress Donut Chart
        if (document.getElementById('goals-progress-chart')) {
            this.chartService.createDonutChart('goals-progress-chart', this.analyticsData.goals);
        }
    }

    initializePlaceholderChart(containerId, title) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="flex items-center justify-center h-full text-gray-500">
                    <div class="text-center">
                        <div class="w-16 h-16 mx-auto mb-4 text-gray-300">
                            ${this.getIcon('bar-chart')}
                        </div>
                        <p class="text-sm">${title}</p>
                        <p class="text-xs mt-1">Chart will be implemented with D3.js</p>
                    </div>
                </div>
            `;
        }
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        });
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

    getImpactBadgeClass(impact) {
        switch (impact) {
            case 'high': return 'badge-danger';
            case 'medium': return 'badge-warning';
            case 'low': return 'badge-success';
            default: return 'badge-gray';
        }
    }

    getGoalProgressColor(progress) {
        if (progress >= 75) return 'bg-success-500';
        if (progress >= 50) return 'bg-warning-500';
        if (progress >= 25) return 'bg-primary-500';
        return 'bg-gray-400';
    }

    getIcon(name) {
        const icons = {
            'credit-card': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>',
            'trending-up': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>',
            'piggy-bank': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>',
            'percent': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>',
            'bar-chart': '<svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>',
            'alert-triangle': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>',
            'check-circle': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            'info': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            'alert-circle': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        };
        return icons[name] || '';
    }

    destroy() {
        // Clean up chart instances
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts = {};
        
        // Clean up event listeners if needed
    }
}