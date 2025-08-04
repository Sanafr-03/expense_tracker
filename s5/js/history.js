// Load data from localStorage with proper error handling
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let incomeCategories = [];
let expenseCategories = [];

try {
    transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    incomeCategories = JSON.parse(localStorage.getItem('incomeCategories')) || ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'];
    expenseCategories = JSON.parse(localStorage.getItem('expenseCategories')) || ['Housing', 'Food', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Other Expenses'];
} catch (e) {
    console.error("Error loading data from localStorage:", e);
    // Initialize with default values if parsing fails
    transactions = [];
    incomeCategories = ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'];
    expenseCategories = ['Housing', 'Food', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Other Expenses'];
}

function updateCategoryFilterOptions() {
    const categoryFilter = document.getElementById('category-filter');
    const typeFilter = document.getElementById('type-filter');
    
    if (!categoryFilter || !typeFilter) return;
    
    const selectedType = typeFilter.value;

    // Clear options except first (usually 'All Categories')
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }

    let cats;
    if (selectedType === 'income') {
        cats = incomeCategories;
    } else if (selectedType === 'expense') {
        cats = expenseCategories;
    } else {
        cats = [...new Set([...incomeCategories, ...expenseCategories])];
    }

    cats.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements with null checks
    const addBtn = document.querySelector('.add-btn');
    const typeFilter = document.getElementById('type-filter');
    const categoryFilter = document.getElementById('category-filter');
    const monthFilter = document.getElementById('month-filter');
    const currentMonthElem = document.getElementById('current-month');

    const dateFilter = document.getElementById('date-filter');
    if (dateFilter) {
        dateFilter.addEventListener('change', function() {
            // Clear month filter when date is selected
            const monthFilter = document.getElementById('month-filter');
            if (monthFilter) monthFilter.value = 'all';
            applyFilters();
        });
    }
    
    const clearDateBtn = document.getElementById('clear-date-filter');
    if (clearDateBtn) {
        clearDateBtn.addEventListener('click', function() {
            const dateFilter = document.getElementById('date-filter');
            if (dateFilter) {
                dateFilter.value = '';
                applyFilters();
            }
        });
    }

    // Set current month
    if (currentMonthElem) {
        const now = new Date();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        currentMonthElem.textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }

    // Event listeners with null checks
    if (addBtn) {
        addBtn.addEventListener('click', () => window.location.href = 'add.html');
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', function() {
            updateCategoryFilterOptions();
            applyFilters();
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }

    if (monthFilter) {
        monthFilter.addEventListener('change', applyFilters);
    }

    // Load data
    updateCategoryFilterOptions();
    updateAllTransactions();
    updateTimelineStats();

    // Delete modal event handling
    const modal = document.getElementById('deleteModal');
    const cancelBtn = document.getElementById('cancelDelete');
    const confirmBtn = document.getElementById('confirmDelete');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (!modal) return;
            
            const transactionId = parseInt(modal.dataset.transactionId);
            transactions = transactions.filter(t => t.id !== transactionId);
            saveTransactions();
            updateAllTransactions();
            updateTimelineStats();
            modal.style.display = 'none';
            showNotification('Transaction deleted successfully', 'success');
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Set active nav item
    highlightNavItem();
    
    // Apply global settings
    AppSettings.applyGlobalSettings();
});

function highlightNavItem() {
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('href') === currentPage) {
            item.classList.add('active');
        }
    });

    if (currentPage === 'reports.html') {
        document.querySelector('.nav-item.reports')?.classList.add('active');
    }
}

function updateAllTransactions() {
    // Reset all filters to default and apply them
    const typeFilter = document.getElementById('type-filter');
    const categoryFilter = document.getElementById('category-filter');
    const monthFilter = document.getElementById('month-filter');
    const dateFilter = document.getElementById('date-filter');
    
    if (typeFilter) typeFilter.value = 'all';
    if (categoryFilter) categoryFilter.value = 'all';
    if (monthFilter) monthFilter.value = 'all';
    if (dateFilter) dateFilter.value = ''; // Clear date filter
    
    applyFilters();
}

function applyFilters() {
    const typeFilter = document.getElementById('type-filter');
    const categoryFilter = document.getElementById('category-filter');
    const monthFilter = document.getElementById('month-filter');
    const dateFilter = document.getElementById('date-filter');
    
    if (!typeFilter || !categoryFilter || !monthFilter || !dateFilter) return;
    
    const type = typeFilter.value;
    const category = categoryFilter.value;
    const month = monthFilter.value;
    const selectedDate = dateFilter.value; // Get the selected date

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let filtered = transactions;

    // Filter by type if not 'all'
    if (type !== 'all') {
        filtered = filtered.filter(transaction => {
            const transactionType = transaction.amount > 0 ? 'income' : 'expense';
            return transactionType === type;
        });
    }

    // Filter by category if not 'all'
    if (category !== 'all') {
        filtered = filtered.filter(transaction => transaction.category === category);
    }

    // Filter by specific date if provided
    if (selectedDate) {
        filtered = filtered.filter(transaction => {
            const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
            return transactionDate === selectedDate;
        });
    }
    // Only apply month filter if no specific date is selected
    else if (month !== 'all') {
        filtered = filtered.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            const transactionMonth = transactionDate.getMonth();
            const transactionYear = transactionDate.getFullYear();
            
            switch (month) {
                case 'current':
                    return transactionMonth === currentMonth && transactionYear === currentYear;
                case 'last': {
                    let lastMonth = currentMonth - 1;
                    let lastYear = currentYear;
                    if (lastMonth < 0) {
                        lastMonth = 11;
                        lastYear--;
                    }
                    return transactionMonth === lastMonth && transactionYear === lastYear;
                }
                case 'last3':
                    const threeMonthsAgo = new Date(now);
                    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                    return new Date(transaction.date) >= threeMonthsAgo;
                default:
                    return true;
            }
        });
    }

    displayFilteredTransactions(filtered);
    updateTimelineStats(filtered);
}


function displayFilteredTransactions(filteredTransactions) {
    const allTransactionsList = document.getElementById('all-transactions');
    if (!allTransactionsList) return;

    if (filteredTransactions.length === 0) {
        allTransactionsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-search"></i></div>
                <div class="empty-text">No transactions found</div>
                <button class="btn btn-primary" id="clear-filters"><i class="fas fa-times"></i> Clear Filters</button>
            </div>
        `;
        
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', updateAllTransactions);
        }
        return;
    }

    displayTimelineTransactions(filteredTransactions);
}

function displayTimelineTransactions(transactions) {
    const allTransactionsList = document.getElementById('all-transactions');
    if (!allTransactionsList) return;

    // Clear existing content but keep the timeline line
    const timelineLine = allTransactionsList.querySelector('.timeline-line');
    allTransactionsList.innerHTML = '';
    if (timelineLine) {
        allTransactionsList.appendChild(timelineLine);
    }

    // Sort transactions by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Group transactions by date
    const groupedTransactions = {};
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const dateStr = date.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        if (!groupedTransactions[dateStr]) {
            groupedTransactions[dateStr] = [];
        }
        groupedTransactions[dateStr].push(transaction);
    });

    // Display transactions
    Object.entries(groupedTransactions).forEach(([date, transArray]) => {
        // Add date header
        const dateHeader = document.createElement('div');
        dateHeader.className = 'timeline-date-header';
        dateHeader.textContent = date;
        allTransactionsList.appendChild(dateHeader);
        
        // Add transactions for this date
        transArray.forEach(transaction => {
            allTransactionsList.appendChild(createTimelineItem(transaction));
        });
    });
}
function createTimelineItem(transaction) {
    const isIncome = transaction.amount > 0;
    const amount = Math.abs(transaction.amount);
    const formattedAmount = formatCurrency(amount);
    const icon = getCategoryIcon(transaction.category);
    const displayDate = formatDate(transaction.date);
    const displayTime = formatTime(transaction.date);

    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';
    timelineItem.dataset.id = transaction.id;

    timelineItem.innerHTML = `
        <div class="timeline-dot ${isIncome ? 'income' : 'expense'}"></div>
        <div class="timeline-card ${isIncome ? 'income' : 'expense'}">
            <div class="timeline-date-time">
                <span class="timeline-date"><i class="fas fa-calendar-day"></i> ${displayDate}</span>
                <span class="timeline-time"><i class="fas fa-clock"></i> ${displayTime}</span>
            </div>
            <div class="timeline-content">
                <div class="timeline-info">
                    <div class="timeline-icon ${isIncome ? '' : 'expense'}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="timeline-details">
                        <div class="timeline-category">${transaction.category}</div>
                        ${transaction.description ? `<div class="timeline-note">${transaction.description}</div>` : ''}
                    </div>
                </div>
                <div class="timeline-amount ${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '-'}${formattedAmount}</div>
                <div class="timeline-actions">
                    <button class="timeline-btn edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="timeline-btn delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add event listeners
    const deleteBtn = timelineItem.querySelector('.delete');
    const editBtn = timelineItem.querySelector('.edit');
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', e => {
            e.preventDefault();
            const modal = document.getElementById('deleteModal');
            if (modal) {
                modal.style.display = 'flex';
                modal.dataset.transactionId = transaction.id;
            }
        });
    }
    
    if (editBtn) {
        editBtn.addEventListener('click', e => {
            e.preventDefault();
            editTransaction(transaction.id);
        });
    }

    return timelineItem;
}

function editTransaction(transactionId) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    try {
        localStorage.setItem('editingTransaction', JSON.stringify(transaction));
        window.location.href = 'add.html?edit=true';
    } catch (e) {
        console.error("Error saving transaction for editing:", e);
        showNotification('Failed to edit transaction', 'error');
    }
}

function updateTimelineStats(filteredData = null) {
    const data = filteredData || transactions;

    const income = data.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expense = data.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balance = income - expense;

    const totalLabel = document.getElementById('total-transactions-label');
    const currentBalance = document.getElementById('current-balance');
    const totalIncome = document.getElementById('total-income');
    const totalExpenses = document.getElementById('total-expenses');

    if (totalLabel) totalLabel.textContent = data.length;
    if (currentBalance) currentBalance.textContent = formatCurrency(balance);
    if (totalIncome) totalIncome.textContent = formatCurrency(income);
    if (totalExpenses) totalExpenses.textContent = formatCurrency(expense);
}

function saveTransactions() {
    try {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    } catch (e) {
        console.error("Error saving transactions:", e);
        showNotification('Failed to save transactions', 'error');
    }
}

function getCategoryIcon(category) {
    const icons = {
        'Housing': 'fa-home',
        'Food': 'fa-utensils',
        'Transportation': 'fa-car',
        'Utilities': 'fa-bolt',
        'Entertainment': 'fa-film',
        'Healthcare': 'fa-heartbeat',
        'Shopping': 'fa-shopping-bag',
        'Salary': 'fa-money-bill-wave',
        'Freelance': 'fa-laptop-code',
        'Investments': 'fa-chart-line',
        'Gifts': 'fa-gift',
        'Other Income': 'fa-wallet',
        'Other Expenses': 'fa-tag'
    };
    return icons[category] || 'fa-tag';
}

function formatCurrency(amount) {
    return '₹' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function formatTime(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    } catch (e) {
        console.error("Error formatting time:", e);
        return "";
    }
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return "";
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} notification-icon"></i>
        ${message}
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Settings management
const AppSettings = {
    get darkMode() {
        try {
            return JSON.parse(localStorage.getItem('darkMode')) ?? false;
        } catch (e) {
            return false;
        }
    },
    set darkMode(value) {
        localStorage.setItem('darkMode', JSON.stringify(value));
    },
    get currency() {
        return localStorage.getItem('currency') || 'INR';
    },
    set currency(value) {
        localStorage.setItem('currency', value);
    },
    applyGlobalSettings() {
        document.body.classList.toggle('dark-mode', this.darkMode);
        document.querySelectorAll('.currency-symbol').forEach(el => {
            if (el) el.textContent = this.getCurrencySymbol(this.currency);
        });
    },
    getCurrencySymbol(currency) {
        const symbols = {
            INR: '₹',
            USD: '$',
            EUR: '€',
            GBP: '£',
            JPY: '¥'
        };
        return symbols[currency] || '';
    }
};

// Event listeners for global changes
window.addEventListener('categoriesUpdated', function() {
    try {
        incomeCategories = JSON.parse(localStorage.getItem('incomeCategories')) || incomeCategories;
        expenseCategories = JSON.parse(localStorage.getItem('expenseCategories')) || expenseCategories;
        updateCategoryFilterOptions();
    } catch (e) {
        console.error("Error updating categories:", e);
    }
});

window.addEventListener('fullReset', function() {
    transactions = [];
    updateAllTransactions();
    updateTimelineStats();
});