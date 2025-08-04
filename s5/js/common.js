// Global variables (only for direct access if needed)
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let incomeCategories = JSON.parse(localStorage.getItem('incomeCategories')) || [];
let expenseCategories = JSON.parse(localStorage.getItem('expenseCategories')) || [];
// Single AppSettings implementation
const AppSettings = {
    get darkMode() {
        return JSON.parse(localStorage.getItem('darkMode')) ?? false;
    },
    set darkMode(value) {
        localStorage.setItem('darkMode', value);
        document.body.classList.toggle('dark-mode', value);
        this.dispatchDarkModeChange();
    },
    get currency() {
        return localStorage.getItem('currency') || 'INR';
    },
    set currency(value) {
        localStorage.setItem('currency', value);
        this.updateCurrencySymbols();
        window.dispatchEvent(new CustomEvent('currencyChanged'));
    },
    get emailNotifications() {
        return localStorage.getItem('emailNotifications') !== 'false';
    },
    set emailNotifications(value) {
        localStorage.setItem('emailNotifications', value);
    },
    
    
    applyGlobalSettings() {
        document.body.classList.toggle('dark-mode', this.darkMode);
        this.updateCurrencySymbols();
    },
    
    updateCurrencySymbols() {
        const symbols = {
            INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥'
        };
        const symbol = symbols[this.currency] || '₹';
        
        document.querySelectorAll('.currency-display, .currency-input .input-group-text').forEach(el => {
            el.textContent = symbol;
        });
    },
    
    dispatchDarkModeChange() {
        window.dispatchEvent(new CustomEvent('darkModeChanged', {
            detail: this.darkMode
        }));
    },
    
    saveCategories() {
        localStorage.setItem('incomeCategories', JSON.stringify(incomeCategories));
        localStorage.setItem('expenseCategories', JSON.stringify(expenseCategories));
    },

    getCurrencySymbol(currency) {
        const symbols = {
            INR: '₹', 
            USD: '$', 
            EUR: '€', 
            GBP: '£', 
            JPY: '¥'
        };
        return symbols[currency] || '₹';
    },
    
    updateCurrencyDisplays() {
        document.querySelectorAll('[data-currency]').forEach(el => {
            const amount = parseFloat(el.dataset.currency) || 0;
            el.textContent = formatCurrency(amount);
        });
    }
};

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: AppSettings.currency,
        minimumFractionDigits: 2
    }).format(amount || 0);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function showNotification(message, type = 'success') {
    if (!AppSettings.emailNotifications && type !== 'error') return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    
    (document.getElementById('notification-container') || document.body).appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function setActiveNavItem() {
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('href') === currentPage);
    });
    
    // Special case for reports page
    if (currentPage === 'reports.html') {
        document.querySelector('.nav-item.reports').classList.add('active');
    }
}

// Initialize everything
function initializeApp() {
    let storedIncome = JSON.parse(localStorage.getItem('incomeCategories') || 'null');
    let storedExpense = JSON.parse(localStorage.getItem('expenseCategories') || 'null');
    if (!storedIncome || !Array.isArray(storedIncome) || storedIncome.length === 0) {
        localStorage.setItem('incomeCategories', JSON.stringify([
           'Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'
        ]));
    }
    if (!storedExpense || !Array.isArray(storedExpense) || storedExpense.length === 0) {
        localStorage.setItem('expenseCategories', JSON.stringify([
           'Housing', 'Food', 'Transportation', 'Utilities',
           'Entertainment', 'Healthcare', 'Shopping', 'Other Expenses'
        ]));
    }
    // Set default currency if not set
    if (!localStorage.getItem('currency')) {
        localStorage.setItem('currency', 'INR');
    }
    
    // Set today's date in date inputs
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]:not([value])').forEach(input => {
        input.value = today;
    });
    
    // Apply settings
    AppSettings.applyGlobalSettings();
    setActiveNavItem();
}

// common.js
document.addEventListener('DOMContentLoaded', function() {
    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
});

// Function to toggle dark mode that can be called from any page
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    
    // Dispatch a custom event to notify other pages
    const darkModeEvent = new CustomEvent('darkModeChanged', {
        detail: { isDarkMode: document.body.classList.contains('dark-mode') }
    });
    window.dispatchEvent(darkModeEvent);
}

// Single DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', initializeApp);

// Event listeners for global changes
window.addEventListener('currencyChanged', () => {
    AppSettings.updateCurrencySymbols();
    document.querySelectorAll('[data-currency]').forEach(el => {
        el.textContent = formatCurrency(parseFloat(el.dataset.currency) || 0);
    });
});

// Handle full reset event
window.addEventListener('fullReset', function() {
    transactions = [];
    if (typeof goals !== 'undefined') {
        goals = [];
    }
    initializeApp(); // Re-initialize with default categories
    
    // Special handling for reports page
    if (typeof initChartsWithAnimations === 'function') {
        initChartsWithAnimations();
    }
});

// Make AppSettings available globally
window.AppSettings = AppSettings;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.showNotification = showNotification;