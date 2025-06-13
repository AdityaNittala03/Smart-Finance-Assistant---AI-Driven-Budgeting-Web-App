// Transactions Page Component

export class TransactionsPage {
    constructor(options = {}) {
        this.authService = options.authService;
        this.notificationService = options.notificationService;
        this.router = options.router;
        this.user = options.user;
        this.container = null;
        this.isLoading = true;
        this.transactions = [];
        this.filteredTransactions = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
        this.filters = {
            search: '',
            category: '',
            type: '',
            dateFrom: '',
            dateTo: '',
            amountMin: '',
            amountMax: ''
        };
        this.sortBy = 'date';
        this.sortOrder = 'desc';
        
        // Bind methods
        this.handleSearch = this.handleSearch.bind(this);
        this.handleFilter = this.handleFilter.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.handleAddTransaction = this.handleAddTransaction.bind(this);
        this.handleEditTransaction = this.handleEditTransaction.bind(this);
        this.handleDeleteTransaction = this.handleDeleteTransaction.bind(this);
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
            await this.loadTransactions();
            this.container.innerHTML = this.getHTML();
            this.attachEventListeners();
            
            // Handle URL actions
            if (action === 'add') {
                setTimeout(() => this.showAddTransactionModal(), 100);
            }
        } catch (error) {
            console.error('Failed to load transactions:', error);
            this.container.innerHTML = this.getErrorHTML();
        }
    }

    async loadTransactions() {
        // Simulate API call - replace with actual API service call
        this.transactions = [
            { id: 1, date: '2024-12-13', description: 'Grocery Store', category: 'Food', amount: -125.50, type: 'expense', account: 'Checking', tags: ['groceries'] },
            { id: 2, date: '2024-12-12', description: 'Salary Deposit', category: 'Income', amount: 4250.00, type: 'income', account: 'Checking', tags: ['salary'] },
            { id: 3, date: '2024-12-11', description: 'Gas Station', category: 'Transportation', amount: -45.20, type: 'expense', account: 'Credit Card', tags: ['fuel'] },
            { id: 4, date: '2024-12-10', description: 'Online Shopping', category: 'Shopping', amount: -89.99, type: 'expense', account: 'Credit Card', tags: ['online', 'clothes'] },
            { id: 5, date: '2024-12-10', description: 'Coffee Shop', category: 'Food', amount: -12.75, type: 'expense', account: 'Checking', tags: ['coffee'] },
            { id: 6, date: '2024-12-09', description: 'Freelance Work', category: 'Income', amount: 750.00, type: 'income', account: 'Checking', tags: ['freelance'] },
            { id: 7, date: '2024-12-08', description: 'Electric Bill', category: 'Utilities', amount: -85.30, type: 'expense', account: 'Checking', tags: ['bills'] },
            { id: 8, date: '2024-12-07', description: 'Restaurant', category: 'Food', amount: -45.60, type: 'expense', account: 'Credit Card', tags: ['dining'] },
            { id: 9, date: '2024-12-06', description: 'Book Purchase', category: 'Education', amount: -29.99, type: 'expense', account: 'Credit Card', tags: ['books'] },
            { id: 10, date: '2024-12-05', description: 'Investment Dividend', category: 'Income', amount: 125.40, type: 'income', account: 'Investment', tags: ['dividends'] },
            { id: 11, date: '2024-12-04', description: 'Gym Membership', category: 'Health', amount: -49.99, type: 'expense', account: 'Checking', tags: ['fitness'] },
            { id: 12, date: '2024-12-03', description: 'Movie Tickets', category: 'Entertainment', amount: -24.50, type: 'expense', account: 'Credit Card', tags: ['movies'] }
        ];
        
        this.applyFiltersAndSort();
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
                    
                    <div class="bg-white rounded-xl border border-gray-200 p-6">
                        <div class="space-y-4">
                            ${Array(8).fill(0).map(() => `
                                <div class="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                                    <div class="flex items-center space-x-4">
                                        <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
                                        <div>
                                            <div class="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                                            <div class="h-3 bg-gray-200 rounded w-24"></div>
                                        </div>
                                    </div>
                                    <div class="h-4 bg-gray-200 rounded w-20"></div>
                                </div>
                            `).join('')}
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
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 class="text-3xl font-bold text-gray-900">Transactions</h1>
                            <p class="text-gray-600">Manage and track your financial transactions</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <button id="add-transaction-btn" class="btn btn-primary">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                </svg>
                                Add Transaction
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Filters and Search -->
                <div class="card mb-6">
                    <div class="card-body">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <!-- Search -->
                            <div class="form-group">
                                <label class="form-label">Search</label>
                                <input id="search-input" type="text" class="input" placeholder="Search transactions..." value="${this.filters.search}">
                            </div>

                            <!-- Category Filter -->
                            <div class="form-group">
                                <label class="form-label">Category</label>
                                <select id="category-filter" class="input">
                                    <option value="">All Categories</option>
                                    <option value="Food" ${this.filters.category === 'Food' ? 'selected' : ''}>Food</option>
                                    <option value="Transportation" ${this.filters.category === 'Transportation' ? 'selected' : ''}>Transportation</option>
                                    <option value="Shopping" ${this.filters.category === 'Shopping' ? 'selected' : ''}>Shopping</option>
                                    <option value="Utilities" ${this.filters.category === 'Utilities' ? 'selected' : ''}>Utilities</option>
                                    <option value="Entertainment" ${this.filters.category === 'Entertainment' ? 'selected' : ''}>Entertainment</option>
                                    <option value="Health" ${this.filters.category === 'Health' ? 'selected' : ''}>Health</option>
                                    <option value="Education" ${this.filters.category === 'Education' ? 'selected' : ''}>Education</option>
                                    <option value="Income" ${this.filters.category === 'Income' ? 'selected' : ''}>Income</option>
                                </select>
                            </div>

                            <!-- Type Filter -->
                            <div class="form-group">
                                <label class="form-label">Type</label>
                                <select id="type-filter" class="input">
                                    <option value="">All Types</option>
                                    <option value="income" ${this.filters.type === 'income' ? 'selected' : ''}>Income</option>
                                    <option value="expense" ${this.filters.type === 'expense' ? 'selected' : ''}>Expense</option>
                                </select>
                            </div>

                            <!-- Date Range -->
                            <div class="form-group">
                                <label class="form-label">Date Range</label>
                                <div class="flex space-x-2">
                                    <input id="date-from" type="date" class="input" value="${this.filters.dateFrom}">
                                    <input id="date-to" type="date" class="input" value="${this.filters.dateTo}">
                                </div>
                            </div>
                        </div>

                        <!-- Advanced Filters Toggle -->
                        <div class="border-t pt-4">
                            <button id="toggle-advanced-filters" class="text-sm text-primary-600 hover:text-primary-700">
                                Show Advanced Filters
                            </button>
                            
                            <div id="advanced-filters" class="hidden mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="form-group">
                                    <label class="form-label">Amount Range</label>
                                    <div class="flex space-x-2">
                                        <input id="amount-min" type="number" class="input" placeholder="Min" value="${this.filters.amountMin}">
                                        <input id="amount-max" type="number" class="input" placeholder="Max" value="${this.filters.amountMax}">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Filter Actions -->
                        <div class="flex justify-between items-center mt-4 pt-4 border-t">
                            <div class="text-sm text-gray-600">
                                Showing ${this.filteredTransactions.length} of ${this.transactions.length} transactions
                            </div>
                            <div class="space-x-2">
                                <button id="clear-filters-btn" class="btn btn-outline btn-sm">Clear Filters</button>
                                <button id="export-transactions-btn" class="btn btn-secondary btn-sm">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                    </svg>
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Transactions Table -->
                <div class="card">
                    <div class="card-header">
                        <div class="flex justify-between items-center">
                            <h3 class="text-lg font-semibold text-gray-900">Transaction History</h3>
                            <div class="flex items-center space-x-2">
                                <!-- Bulk Actions -->
                                <div id="bulk-actions" class="hidden flex items-center space-x-2">
                                    <span class="text-sm text-gray-600" id="selected-count">0 selected</span>
                                    <button id="bulk-delete-btn" class="btn btn-danger btn-sm">Delete Selected</button>
                                </div>
                                
                                <!-- Sort -->
                                <select id="sort-select" class="input input-sm">
                                    <option value="date-desc" ${this.sortBy === 'date' && this.sortOrder === 'desc' ? 'selected' : ''}>Date (Newest)</option>
                                    <option value="date-asc" ${this.sortBy === 'date' && this.sortOrder === 'asc' ? 'selected' : ''}>Date (Oldest)</option>
                                    <option value="amount-desc" ${this.sortBy === 'amount' && this.sortOrder === 'desc' ? 'selected' : ''}>Amount (High to Low)</option>
                                    <option value="amount-asc" ${this.sortBy === 'amount' && this.sortOrder === 'asc' ? 'selected' : ''}>Amount (Low to High)</option>
                                    <option value="description-asc" ${this.sortBy === 'description' && this.sortOrder === 'asc' ? 'selected' : ''}>Description (A-Z)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-body p-0">
                        ${this.getTransactionsTableHTML()}
                    </div>
                </div>

                <!-- Pagination -->
                ${this.getPaginationHTML()}
            </div>

            <!-- Add/Edit Transaction Modal -->
            <div id="transaction-modal" class="hidden fixed inset-0 bg-gray-500 bg-opacity-75 z-50">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-xl shadow-modal max-w-md w-full">
                        ${this.getTransactionModalHTML()}
                    </div>
                </div>
            </div>
        `;
    }

    getTransactionsTableHTML() {
        if (this.filteredTransactions.length === 0) {
            return `
                <div class="text-center py-12">
                    <div class="w-16 h-16 mx-auto mb-4 text-gray-400">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                    <p class="text-gray-600 mb-4">Try adjusting your filters or add your first transaction.</p>
                    <button onclick="document.getElementById('add-transaction-btn').click()" class="btn btn-primary">
                        Add Transaction
                    </button>
                </div>
            `;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageTransactions = this.filteredTransactions.slice(startIndex, endIndex);

        return `
            <div class="overflow-x-auto">
                <table class="table">
                    <thead class="table-header">
                        <tr>
                            <th class="table-header-cell w-12">
                                <input type="checkbox" id="select-all" class="h-4 w-4 text-primary-600 border-gray-300 rounded">
                            </th>
                            <th class="table-header-cell">Date</th>
                            <th class="table-header-cell">Description</th>
                            <th class="table-header-cell">Category</th>
                            <th class="table-header-cell">Account</th>
                            <th class="table-header-cell text-right">Amount</th>
                            <th class="table-header-cell">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="table-body">
                        ${pageTransactions.map(transaction => `
                            <tr class="table-row" data-transaction-id="${transaction.id}">
                                <td class="table-cell">
                                    <input type="checkbox" class="transaction-checkbox h-4 w-4 text-primary-600 border-gray-300 rounded" value="${transaction.id}">
                                </td>
                                <td class="table-cell">
                                    <div class="text-sm text-gray-900">${this.formatDate(transaction.date)}</div>
                                </td>
                                <td class="table-cell">
                                    <div class="flex items-center">
                                        <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                            transaction.type === 'income' ? 'bg-success-100 text-success-600' : 'bg-gray-100 text-gray-600'
                                        }">
                                            ${transaction.type === 'income' ? this.getIcon('arrow-down') : this.getIcon('arrow-up')}
                                        </div>
                                        <div>
                                            <div class="text-sm font-medium text-gray-900">${transaction.description}</div>
                                            ${transaction.tags.length > 0 ? `
                                                <div class="flex space-x-1 mt-1">
                                                    ${transaction.tags.slice(0, 2).map(tag => `
                                                        <span class="badge badge-gray text-xs">${tag}</span>
                                                    `).join('')}
                                                    ${transaction.tags.length > 2 ? `<span class="text-xs text-gray-500">+${transaction.tags.length - 2}</span>` : ''}
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </td>
                                <td class="table-cell">
                                    <span class="badge ${this.getCategoryBadgeClass(transaction.category)}">${transaction.category}</span>
                                </td>
                                <td class="table-cell">
                                    <div class="text-sm text-gray-900">${transaction.account}</div>
                                </td>
                                <td class="table-cell text-right">
                                    <div class="text-sm font-semibold ${transaction.type === 'income' ? 'text-success-600' : 'text-gray-900'}">
                                        ${transaction.type === 'income' ? '+' : ''}${this.formatCurrency(transaction.amount)}
                                    </div>
                                </td>
                                <td class="table-cell">
                                    <div class="flex space-x-2">
                                        <button class="edit-transaction-btn text-primary-600 hover:text-primary-700" data-transaction-id="${transaction.id}">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                            </svg>
                                        </button>
                                        <button class="delete-transaction-btn text-danger-600 hover:text-danger-700" data-transaction-id="${transaction.id}">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getPaginationHTML() {
        if (this.totalPages <= 1) return '';

        return `
            <div class="mt-6 flex items-center justify-between">
                <div class="text-sm text-gray-600">
                    Showing ${((this.currentPage - 1) * this.itemsPerPage) + 1} to ${Math.min(this.currentPage * this.itemsPerPage, this.filteredTransactions.length)} of ${this.filteredTransactions.length} results
                </div>
                <div class="flex space-x-2">
                    <button id="prev-page" class="btn btn-outline btn-sm" ${this.currentPage === 1 ? 'disabled' : ''}>
                        Previous
                    </button>
                    ${this.getPaginationButtons()}
                    <button id="next-page" class="btn btn-outline btn-sm" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                        Next
                    </button>
                </div>
            </div>
        `;
    }

    getPaginationButtons() {
        const buttons = [];
        const maxButtons = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(this.totalPages, startPage + maxButtons - 1);

        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(`
                <button class="pagination-btn btn ${i === this.currentPage ? 'btn-primary' : 'btn-outline'} btn-sm" data-page="${i}">
                    ${i}
                </button>
            `);
        }

        return buttons.join('');
    }

    getTransactionModalHTML() {
        return `
            <div class="modal-header">
                <h3 id="modal-title" class="modal-title">Add Transaction</h3>
                <button id="close-modal-btn" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            
            <form id="transaction-form" class="modal-body">
                <input type="hidden" id="transaction-id" value="">
                
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-group">
                            <label for="transaction-type" class="form-label">Type</label>
                            <select id="transaction-type" class="input" required>
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="transaction-amount" class="form-label">Amount</label>
                            <input type="number" id="transaction-amount" class="input" placeholder="0.00" step="0.01" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="transaction-description" class="form-label">Description</label>
                        <input type="text" id="transaction-description" class="input" placeholder="Enter description" required>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-group">
                            <label for="transaction-category" class="form-label">Category</label>
                            <select id="transaction-category" class="input" required>
                                <option value="">Select category</option>
                                <option value="Food">Food</option>
                                <option value="Transportation">Transportation</option>
                                <option value="Shopping">Shopping</option>
                                <option value="Utilities">Utilities</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Health">Health</option>
                                <option value="Education">Education</option>
                                <option value="Income">Income</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="transaction-account" class="form-label">Account</label>
                            <select id="transaction-account" class="input" required>
                                <option value="">Select account</option>
                                <option value="Checking">Checking</option>
                                <option value="Savings">Savings</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Investment">Investment</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="transaction-date" class="form-label">Date</label>
                        <input type="date" id="transaction-date" class="input" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="transaction-tags" class="form-label">Tags (optional)</label>
                        <input type="text" id="transaction-tags" class="input" placeholder="Enter tags separated by commas">
                        <div class="form-help">Add tags to categorize your transaction (e.g., groceries, fuel, coffee)</div>
                    </div>
                </div>
            </form>
            
            <div class="modal-footer">
                <button id="cancel-transaction-btn" class="btn btn-outline">Cancel</button>
                <button id="save-transaction-btn" class="btn btn-primary">
                    <span id="save-transaction-text">Save Transaction</span>
                </button>
            </div>
        `;
    }

    getErrorHTML() {
        return `
            <div class="p-6 text-center">
                <div class="w-16 h-16 mx-auto mb-4 text-gray-400">
                    ${this.getIcon('alert-circle')}
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load transactions</h3>
                <p class="text-gray-600 mb-4">There was an error loading your transaction data.</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    Try again
                </button>
            </div>
        `;
    }

    attachEventListeners() {
        // Add transaction button
        const addBtn = document.getElementById('add-transaction-btn');
        if (addBtn) {
            addBtn.addEventListener('click', this.handleAddTransaction);
        }

        // Search and filters
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearch);
        }

        const filterElements = ['category-filter', 'type-filter', 'date-from', 'date-to', 'amount-min', 'amount-max'];
        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', this.handleFilter);
            }
        });

        // Advanced filters toggle
        const toggleAdvanced = document.getElementById('toggle-advanced-filters');
        const advancedFilters = document.getElementById('advanced-filters');
        if (toggleAdvanced && advancedFilters) {
            toggleAdvanced.addEventListener('click', () => {
                const isHidden = advancedFilters.classList.contains('hidden');
                advancedFilters.classList.toggle('hidden');
                toggleAdvanced.textContent = isHidden ? 'Hide Advanced Filters' : 'Show Advanced Filters';
            });
        }

        // Clear filters
        const clearFiltersBtn = document.getElementById('clear-filters-btn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', this.clearFilters.bind(this));
        }

        // Sort
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', this.handleSort);
        }

        // Pagination
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageButtons = document.querySelectorAll('.pagination-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.handlePageChange(this.currentPage - 1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.handlePageChange(this.currentPage + 1));
        }
        pageButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePageChange(parseInt(e.target.dataset.page)));
        });

        // Bulk selection
        const selectAllCheckbox = document.getElementById('select-all');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', this.handleSelectAll.bind(this));
        }

        const transactionCheckboxes = document.querySelectorAll('.transaction-checkbox');
        transactionCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', this.handleTransactionSelect.bind(this));
        });

        // Transaction actions
        const editButtons = document.querySelectorAll('.edit-transaction-btn');
        const deleteButtons = document.querySelectorAll('.delete-transaction-btn');

        editButtons.forEach(btn => {
            btn.addEventListener('click', this.handleEditTransaction);
        });
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', this.handleDeleteTransaction);
        });

        // Modal
        const modal = document.getElementById('transaction-modal');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const cancelBtn = document.getElementById('cancel-transaction-btn');
        const saveBtn = document.getElementById('save-transaction-btn');
        const form = document.getElementById('transaction-form');

        if (closeModalBtn) closeModalBtn.addEventListener('click', this.hideModal.bind(this));
        if (cancelBtn) cancelBtn.addEventListener('click', this.hideModal.bind(this));
        if (saveBtn) saveBtn.addEventListener('click', this.saveTransaction.bind(this));
        if (form) form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });

        // Export button
        const exportBtn = document.getElementById('export-transactions-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', this.handleExport.bind(this));
        }
    }

    handleSearch(event) {
        this.filters.search = event.target.value.toLowerCase();
        this.applyFiltersAndSort();
        this.updateTable();
    }

    handleFilter() {
        this.filters.category = document.getElementById('category-filter')?.value || '';
        this.filters.type = document.getElementById('type-filter')?.value || '';
        this.filters.dateFrom = document.getElementById('date-from')?.value || '';
        this.filters.dateTo = document.getElementById('date-to')?.value || '';
        this.filters.amountMin = document.getElementById('amount-min')?.value || '';
        this.filters.amountMax = document.getElementById('amount-max')?.value || '';
        
        this.applyFiltersAndSort();
        this.updateTable();
    }

    handleSort(event) {
        const [field, order] = event.target.value.split('-');
        this.sortBy = field;
        this.sortOrder = order;
        this.applyFiltersAndSort();
        this.updateTable();
    }

    handlePageChange(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updateTable();
        }
    }

    handleAddTransaction() {
        this.showModal('Add Transaction');
        this.resetForm();
        
        // Set default values
        document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('transaction-type').value = 'expense';
    }

    handleEditTransaction(event) {
        const transactionId = parseInt(event.currentTarget.dataset.transactionId);
        const transaction = this.transactions.find(t => t.id === transactionId);
        
        if (transaction) {
            this.showModal('Edit Transaction', transaction);
            this.populateForm(transaction);
        }
    }

    handleDeleteTransaction(event) {
        const transactionId = parseInt(event.currentTarget.dataset.transactionId);
        const transaction = this.transactions.find(t => t.id === transactionId);
        
        if (transaction) {
            this.confirmDelete([transactionId], `Are you sure you want to delete "${transaction.description}"?`);
        }
    }

    handleBulkAction(action, selectedIds) {
        switch (action) {
            case 'delete':
                this.confirmDelete(selectedIds, `Are you sure you want to delete ${selectedIds.length} transaction(s)?`);
                break;
        }
    }

    applyFiltersAndSort() {
        // Apply filters
        this.filteredTransactions = this.transactions.filter(transaction => {
            // Search filter
            if (this.filters.search && !transaction.description.toLowerCase().includes(this.filters.search) &&
                !transaction.category.toLowerCase().includes(this.filters.search)) {
                return false;
            }
            
            // Category filter
            if (this.filters.category && transaction.category !== this.filters.category) {
                return false;
            }
            
            // Type filter
            if (this.filters.type && transaction.type !== this.filters.type) {
                return false;
            }
            
            // Date range filter
            if (this.filters.dateFrom && transaction.date < this.filters.dateFrom) {
                return false;
            }
            if (this.filters.dateTo && transaction.date > this.filters.dateTo) {
                return false;
            }
            
            // Amount range filter
            const absAmount = Math.abs(transaction.amount);
            if (this.filters.amountMin && absAmount < parseFloat(this.filters.amountMin)) {
                return false;
            }
            if (this.filters.amountMax && absAmount > parseFloat(this.filters.amountMax)) {
                return false;
            }
            
            return true;
        });

        // Apply sorting
        this.filteredTransactions.sort((a, b) => {
            let aValue = a[this.sortBy];
            let bValue = b[this.sortBy];
            
            if (this.sortBy === 'amount') {
                aValue = Math.abs(aValue);
                bValue = Math.abs(bValue);
            }
            
            if (this.sortBy === 'description') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            
            if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        // Calculate pagination
        this.totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
        this.currentPage = Math.min(this.currentPage, Math.max(1, this.totalPages));
    }

    updateTable() {
        const tableContainer = this.container.querySelector('.card-body.p-0');
        if (tableContainer) {
            tableContainer.innerHTML = this.getTransactionsTableHTML();
        }

        const paginationContainer = this.container.querySelector('.mt-6.flex.items-center.justify-between');
        if (paginationContainer) {
            paginationContainer.outerHTML = this.getPaginationHTML();
        }

        // Update result count
        const resultCount = this.container.querySelector('.text-sm.text-gray-600');
        if (resultCount) {
            resultCount.textContent = `Showing ${this.filteredTransactions.length} of ${this.transactions.length} transactions`;
        }

        // Re-attach event listeners for new elements
        this.attachTableEventListeners();
    }

    attachTableEventListeners() {
        // Re-attach listeners for dynamically created elements
        const editButtons = document.querySelectorAll('.edit-transaction-btn');
        const deleteButtons = document.querySelectorAll('.delete-transaction-btn');
        const checkboxes = document.querySelectorAll('.transaction-checkbox');
        const pageButtons = document.querySelectorAll('.pagination-btn');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const selectAll = document.getElementById('select-all');

        editButtons.forEach(btn => btn.addEventListener('click', this.handleEditTransaction));
        deleteButtons.forEach(btn => btn.addEventListener('click', this.handleDeleteTransaction));
        checkboxes.forEach(checkbox => checkbox.addEventListener('change', this.handleTransactionSelect.bind(this)));
        pageButtons.forEach(btn => btn.addEventListener('click', (e) => this.handlePageChange(parseInt(e.target.dataset.page))));
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.handlePageChange(this.currentPage - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.handlePageChange(this.currentPage + 1));
        if (selectAll) selectAll.addEventListener('change', this.handleSelectAll.bind(this));
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
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
            'Income': 'badge-success'
        };
        return categoryClasses[category] || 'badge-gray';
    }

    getIcon(name) {
        const icons = {
            'arrow-up': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>',
            'arrow-down': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>',
            'alert-circle': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        };
        return icons[name] || '';
    }

    clearFilters() {
        this.filters = {
            search: '',
            category: '',
            type: '',
            dateFrom: '',
            dateTo: '',
            amountMin: '',
            amountMax: ''
        };
        
        // Reset form inputs
        document.getElementById('search-input').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('type-filter').value = '';
        document.getElementById('date-from').value = '';
        document.getElementById('date-to').value = '';
        document.getElementById('amount-min').value = '';
        document.getElementById('amount-max').value = '';
        
        this.applyFiltersAndSort();
        this.updateTable();
    }

    showModal(title, transaction = null) {
        const modal = document.getElementById('transaction-modal');
        const modalTitle = document.getElementById('modal-title');
        
        if (modal && modalTitle) {
            modalTitle.textContent = title;
            modal.classList.remove('hidden');
        }
    }

    hideModal() {
        const modal = document.getElementById('transaction-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    resetForm() {
        const form = document.getElementById('transaction-form');
        if (form) {
            form.reset();
            document.getElementById('transaction-id').value = '';
        }
    }

    populateForm(transaction) {
        document.getElementById('transaction-id').value = transaction.id;
        document.getElementById('transaction-type').value = transaction.type;
        document.getElementById('transaction-amount').value = Math.abs(transaction.amount);
        document.getElementById('transaction-description').value = transaction.description;
        document.getElementById('transaction-category').value = transaction.category;
        document.getElementById('transaction-account').value = transaction.account;
        document.getElementById('transaction-date').value = transaction.date;
        document.getElementById('transaction-tags').value = transaction.tags.join(', ');
    }

    async saveTransaction() {
        const form = document.getElementById('transaction-form');
        const formData = new FormData(form);
        
        const transactionData = {
            id: document.getElementById('transaction-id').value || Date.now(),
            type: document.getElementById('transaction-type').value,
            amount: parseFloat(document.getElementById('transaction-amount').value) * (document.getElementById('transaction-type').value === 'expense' ? -1 : 1),
            description: document.getElementById('transaction-description').value,
            category: document.getElementById('transaction-category').value,
            account: document.getElementById('transaction-account').value,
            date: document.getElementById('transaction-date').value,
            tags: document.getElementById('transaction-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
        };

        try {
            // Simulate API call
            const isEdit = !!document.getElementById('transaction-id').value;
            
            if (isEdit) {
                // Update existing transaction
                const index = this.transactions.findIndex(t => t.id == transactionData.id);
                if (index !== -1) {
                    this.transactions[index] = { ...this.transactions[index], ...transactionData };
                }
                this.notificationService.success('Transaction updated successfully');
            } else {
                // Add new transaction
                this.transactions.unshift(transactionData);
                this.notificationService.success('Transaction added successfully');
            }
            
            this.applyFiltersAndSort();
            this.updateTable();
            this.hideModal();
        } catch (error) {
            this.notificationService.error('Failed to save transaction');
        }
    }

    confirmDelete(transactionIds, message) {
        if (confirm(message)) {
            // Remove transactions
            this.transactions = this.transactions.filter(t => !transactionIds.includes(t.id));
            this.applyFiltersAndSort();
            this.updateTable();
            this.notificationService.success(`${transactionIds.length} transaction(s) deleted`);
        }
    }

    handleSelectAll(event) {
        const checkboxes = document.querySelectorAll('.transaction-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = event.target.checked;
        });
        this.updateBulkActions();
    }

    handleTransactionSelect() {
        this.updateBulkActions();
    }

    updateBulkActions() {
        const checkboxes = document.querySelectorAll('.transaction-checkbox:checked');
        const bulkActions = document.getElementById('bulk-actions');
        const selectedCount = document.getElementById('selected-count');
        
        if (bulkActions && selectedCount) {
            if (checkboxes.length > 0) {
                bulkActions.classList.remove('hidden');
                selectedCount.textContent = `${checkboxes.length} selected`;
            } else {
                bulkActions.classList.add('hidden');
            }
        }
    }

    handleExport() {
        // Simulate export functionality
        this.notificationService.info('Preparing transaction export...');
        setTimeout(() => {
            this.notificationService.success('Transactions exported successfully!');
        }, 2000);
    }

    destroy() {
        // Clean up event listeners if needed
    }
}