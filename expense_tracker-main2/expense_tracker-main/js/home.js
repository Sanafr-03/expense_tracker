let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let goals = JSON.parse(localStorage.getItem('goals')) || [];
let selectedMonth = new Date().getMonth();
let selectedYear = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements
    const addBtn = document.querySelector('.add-btn');
    const addFirstTransactionBtn = document.getElementById('add-first-transaction');
    const addGoalBtn = document.getElementById('add-goal');
    const goalModal = document.getElementById('goalModal');
    const editGoalModal = document.getElementById('editGoalModal');
    const modalCloseBtns = document.querySelectorAll('.modal-close');
    
    // Initialize month selector
    initSimpleMonthSelector();
    
    // Load data
    updateUI();
    
    // Event listeners
    if (addBtn) addBtn.addEventListener('click', () => window.location.href = 'add.html');
    if (addFirstTransactionBtn) addFirstTransactionBtn.addEventListener('click', () => window.location.href = 'add.html');
    if (addGoalBtn) addGoalBtn.addEventListener('click', showAddGoalModal);
    
    // Modal close buttons
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    });
    
    // Close modal when clicking outside
    if (goalModal) {
        goalModal.addEventListener('click', function(e) {
            if (e.target === goalModal) {
                closeModal();
            }
        });
    }
    
    if (editGoalModal) {
        editGoalModal.addEventListener('click', function(e) {
            if (e.target === editGoalModal) {
                closeModal();
            }
        });
    }

    window.addEventListener('darkModeChanged', function(e) {
        document.body.classList.toggle('dark-mode', e.detail);
        if (typeof initCharts === 'function') initCharts();
    });
    
    // Form submissions
    const goalForm = document.getElementById('goalForm');
    if (goalForm) goalForm.addEventListener('submit', addGoal);
    
    const editGoalForm = document.getElementById('editGoalForm');
    if (editGoalForm) editGoalForm.addEventListener('submit', updateGoal);
    
    // Listen for transaction updates
    window.addEventListener('storage', function(e) {
        if (e.key === 'transactions') {
            transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            updateUI();
        }
    });
    
    // Listen for reset event from settings
    window.addEventListener('fullReset', function() {
        transactions = [];
        goals = [];
        updateUI();
    });
});

// =============== SIMPLE MONTH SELECTOR ===============

function initSimpleMonthSelector() {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    const resetBtn = document.getElementById('reset-month');
    
    updateMonthDisplay();
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            changeMonth(-1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            changeMonth(1);
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetToCurrentMonth();
        });
    }
}

function changeMonth(offset) {
    let newMonth = selectedMonth + offset;
    let newYear = selectedYear;
    
    if (newMonth > 11) {
        newMonth = 0;
        newYear++;
    } else if (newMonth < 0) {
        newMonth = 11;
        newYear--;
    }
    
    const now = new Date();
    // Don't allow future months
    if (newYear > now.getFullYear() || (newYear === now.getFullYear() && newMonth > now.getMonth())) {
        showNotification('Cannot view future months', 'error');
        return;
    }
    
    selectedMonth = newMonth;
    selectedYear = newYear;
    
    updateMonthDisplay();
    updateUI();
}

function resetToCurrentMonth() {
    const now = new Date();
    selectedMonth = now.getMonth();
    selectedYear = now.getFullYear();
    
    updateMonthDisplay();
    updateUI();
    
    showNotification('Showing current month', 'success');
}

function updateMonthDisplay() {
    const monthDisplay = document.getElementById('display-month-year');
    
    if (monthDisplay) {
        const monthNames = ["January", "February", "March", "April", "May", "June", 
                           "July", "August", "September", "October", "November", "December"];
        monthDisplay.textContent = `${monthNames[selectedMonth]} ${selectedYear}`;
    }
    
    // Update next button state
    const nextBtn = document.getElementById('next-month');
    if (nextBtn) {
        const now = new Date();
        if (selectedYear > now.getFullYear() || 
            (selectedYear === now.getFullYear() && selectedMonth >= now.getMonth())) {
            nextBtn.disabled = true;
        } else {
            nextBtn.disabled = false;
        }
    }
}

// =============== FILTERING FUNCTIONS ===============

function getSelectedMonthDateRange() {
    const startOfMonth = new Date(selectedYear, selectedMonth, 1);
    const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
    
    return { startOfMonth, endOfMonth };
}

function getFilteredMonthTransactions() {
    const { startOfMonth, endOfMonth } = getSelectedMonthDateRange();
    
    return transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });
}

function getMonthName(monthIndex) {
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"];
    return monthNames[monthIndex];
}

// =============== UI UPDATE FUNCTIONS ===============

function updateUI() {
    updateTransactionLists();
    updateSummary();
    updateGoals();
    initCharts();
    toggleSummaryVisibility();
}

function toggleSummaryVisibility() {
    const summaryContainer = document.querySelector('.summary-container');
    if (summaryContainer) summaryContainer.style.display = 'grid';
    
    const filteredTransactions = getFilteredMonthTransactions();
    
    if (filteredTransactions.length === 0) {
        document.getElementById('income-total').textContent = formatCurrency(0);
        document.getElementById('expense-total').textContent = formatCurrency(0);
        document.getElementById('balance-total').textContent = formatCurrency(0);
        
        document.querySelectorAll('.summary-change').forEach(el => {
            el.style.display = 'none';
        });
    }
}

function resetFinancialData() {
    transactions = [];
    saveTransactions();
    
    goals = [];
    saveGoals();
    
    updateUI();
    
    showNotification('All financial data has been reset', 'success');
}

function showAddGoalModal() {
    const goalModal = document.getElementById('goalModal');
    goalModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    document.getElementById('goalForm').reset();
    
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);
    document.getElementById('goal-date').value = futureDate.toISOString().split('T')[0];
}

function showEditGoalModal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const editGoalModal = document.getElementById('editGoalModal');
    editGoalModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    document.getElementById('edit-goal-id').value = goal.id;
    document.getElementById('edit-goal-name').value = goal.name;
    document.getElementById('edit-goal-amount').value = goal.targetAmount;
    document.getElementById('edit-goal-current').value = goal.currentAmount || 0;
    document.getElementById('edit-goal-date').value = goal.targetDate;
    document.getElementById('edit-goal-description').value = goal.description || '';
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

function addGoal(e) {
    e.preventDefault();
    
    const name = document.getElementById('goal-name').value;
    const amount = parseFloat(document.getElementById('goal-amount').value);
    const date = document.getElementById('goal-date').value;
    const description = document.getElementById('goal-description').value;
    
    if (!name || isNaN(amount) || !date) {
        showNotification('Please fill in all required fields with valid values', 'error');
        return;
    }
    
    const goal = {
        id: Date.now(),
        name,
        targetAmount: amount,
        currentAmount: 0,
        targetDate: date,
        description,
        createdAt: new Date().toISOString()
    };
    
    goals.push(goal);
    saveGoals();
    updateGoals();
    closeModal();
    
    showNotification(`Goal "${name}" added successfully!`, 'success');
}

function updateGoal(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edit-goal-id').value);
    const name = document.getElementById('edit-goal-name').value;
    const targetAmount = parseFloat(document.getElementById('edit-goal-amount').value);
    const currentAmount = parseFloat(document.getElementById('edit-goal-current').value);
    const targetDate = document.getElementById('edit-goal-date').value;
    const description = document.getElementById('edit-goal-description').value;
    
    if (!name || isNaN(targetAmount) || isNaN(currentAmount) || !targetDate) {
        showNotification('Please fill in all required fields with valid values', 'error');
        return;
    }
    
    const goalIndex = goals.findIndex(g => g.id === id);
    if (goalIndex === -1) {
        showNotification('Goal not found', 'error');
        return;
    }
    
    const createdAt = goals[goalIndex].createdAt;
    
    goals[goalIndex] = {
        id,
        name,
        targetAmount,
        currentAmount,
        targetDate,
        description,
        createdAt
    };
    
    saveGoals();
    updateGoals();
    closeModal();
    
    showNotification(`Goal "${name}" updated successfully!`, 'success');
}

function updateTransactionLists() {
    updateRecentTransactions();
}

function updateRecentTransactions() {
    const recentTransactionsList = document.getElementById('recent-transactions');
    if (!recentTransactionsList) return;
    
    const filteredTransactions = getFilteredMonthTransactions();
    
    const recentTransactions = [...filteredTransactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    if (recentTransactions.length === 0) {
        recentTransactionsList.innerHTML = `
            <li class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-exchange-alt"></i>
                </div>
                <div class="empty-text">No transactions for ${getMonthName(selectedMonth)} ${selectedYear}</div>
                <button class="btn btn-primary" id="add-first-transaction">
                    <i class="fas fa-plus"></i> Add Transaction
                </button>
            </li>
        `;
        const addBtn = document.getElementById('add-first-transaction');
        if (addBtn) addBtn.addEventListener('click', () => window.location.href = 'add.html');
        return;
    }
    
    recentTransactionsList.innerHTML = '';
    recentTransactions.forEach(transaction => {
        recentTransactionsList.appendChild(createTransactionElement(transaction));
    });
}

function updateSummary() {
    const filteredTransactions = getFilteredMonthTransactions();
    
    const income = filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balance = income - expense;
    
    const incomeElement = document.getElementById('income-total');
    const expenseElement = document.getElementById('expense-total');
    const balanceElement = document.getElementById('balance-total');
    
    if (incomeElement) incomeElement.textContent = formatCurrency(income);
    if (expenseElement) expenseElement.textContent = formatCurrency(expense);
    if (balanceElement) balanceElement.textContent = formatCurrency(balance);
    
    const hasData = filteredTransactions.length > 0;
    document.querySelectorAll('.summary-change').forEach(el => {
        el.style.display = hasData ? 'block' : 'none';
    });
}

function initCharts() {
    const chartIds = ['incomeChart', 'expenseChart'];
    
    chartIds.forEach(id => {
        const chart = Chart.getChart(id);
        if (chart) chart.destroy();
    });
    
    createIncomeChart();
    createExpenseChart();
}

function createIncomeChart() {
    const ctx = document.getElementById('incomeChart');
    if (!ctx) return;
    
    const filteredTransactions = getFilteredMonthTransactions();
    
    const incomeByCategory = {};
    
    filteredTransactions
        .filter(t => t.amount > 0)
        .forEach(t => {
            incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
        });
    
    if (Object.keys(incomeByCategory).length === 0) {
        incomeByCategory['No Income'] = 1;
    }
    
    new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(incomeByCategory),
            datasets: [{
                data: Object.values(incomeByCategory),
                backgroundColor: ['#3498db', '#5dade2', '#2980b9', '#1f618d', '#154360', '#2e86c1', '#2874a6', '#1b4d72'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function createExpenseChart() {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;
    
    const filteredTransactions = getFilteredMonthTransactions();
    
    const expenseByCategory = {};
    
    filteredTransactions
        .filter(t => t.amount < 0)
        .forEach(t => {
            const category = t.category;
            expenseByCategory[category] = (expenseByCategory[category] || 0) + Math.abs(t.amount);
        });
    
    if (Object.keys(expenseByCategory).length === 0) {
        expenseByCategory['No Expenses'] = 1;
    }
    
    new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(expenseByCategory),
            datasets: [{
                data: Object.values(expenseByCategory),
                backgroundColor: ['#f39c12', '#f8c471', '#e67e22', '#d35400', '#ba4a00', '#a04000', '#784212', '#5d3a1a'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function updateGoals() {
    const goalsContainer = document.getElementById('goals-slider');
    if (!goalsContainer) return;
    
    const slider = $('.goals-slider');
    
    if (slider.hasClass('slick-initialized')) {
        slider.slick('unslick');
    }
    
    if (goals.length === 0) {
        goalsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-bullseye"></i>
                </div>
                <div class="empty-text">No goals set yet</div>
            </div>
        `;
        return;
    }
    
    goalsContainer.innerHTML = '';
    goals.forEach(goal => {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        const progressWidth = Math.min(progress, 100);
        
        const goalEl = document.createElement('div');
        goalEl.className = 'goal-card';
        goalEl.innerHTML = `
            <div class="goal-header">
                <h3 class="goal-title">${goal.name}</h3>
                <div class="goal-amount">${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}</div>
            </div>
            <div class="goal-progress">
                <div class="progress-bar">
                    <div class="progress-value" style="width: ${progressWidth}%"></div>
                </div>
                <div class="goal-meta">
                    <span>${progress.toFixed(1)}% completed</span>
                    <span>Target: ${formatDate(goal.targetDate)}</span>
                </div>
            </div>
            <div class="goal-actions">
                <button class="goal-btn edit" data-id="${goal.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="goal-btn delete" data-id="${goal.id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        goalsContainer.appendChild(goalEl);
    });
    
    $('.goals-slider').slick({
        dots: false,
        infinite: false,
        speed: 300,
        slidesToShow: Math.min(3, goals.length),
        slidesToScroll: 1,
        prevArrow: '<button type="button" class="slick-prev"></button>',
        nextArrow: '<button type="button" class="slick-next"></button>',
        responsive: [
            {
                breakpoint: 1200,
                settings: {
                    slidesToShow: Math.min(2, goals.length),
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    });
    
    document.querySelectorAll('.goal-btn.edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const goalId = parseInt(this.getAttribute('data-id'));
            showEditGoalModal(goalId);
        });
    });
    
    document.querySelectorAll('.goal-btn.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const goalId = parseInt(this.getAttribute('data-id'));
            if (confirm('Are you sure you want to delete this goal?')) {
                goals = goals.filter(g => g.id !== goalId);
                saveGoals();
                updateGoals();
                showNotification('Goal deleted successfully', 'success');
            }
        });
    });
}

function createTransactionElement(transaction) {
    const li = document.createElement('li');
    li.className = 'transaction-item';
    li.dataset.id = transaction.id;
    
    const isIncome = transaction.amount > 0;
    const amount = Math.abs(transaction.amount);
    const formattedAmount = formatCurrency(amount);
    
    const iconClass = isIncome ? 'income' : 'expense';
    const icon = isIncome ? 'fa-dollar-sign' : getCategoryIcon(transaction.category);
    
    li.innerHTML = `
        <div class="transaction-info">
            <div class="transaction-icon ${iconClass}">
                <i class="fas ${icon}"></i>
            </div>
            <div class="transaction-details">
                <span class="transaction-category">${transaction.category}</span>
                <span class="transaction-date">${formatDate(transaction.date)}</span>
                ${transaction.description ? `<span class="transaction-note">${transaction.description}</span>` : ''}
            </div>
        </div>
        <div class="transaction-amount ${iconClass}">${isIncome ? '+' : '-'}${formattedAmount}</div>
    `;
    
    return li;
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    window.dispatchEvent(new Event('transactionsUpdated'));
}

function saveGoals() {
    localStorage.setItem('goals', JSON.stringify(goals));
    window.dispatchEvent(new Event('goalsUpdated'));
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
        'Gifts': 'fa-gift'
    };
    return icons[category] || 'fa-tag';
}

function formatCurrency(amount) {
    const currency = localStorage.getItem('currency') || 'INR';
    const formatter = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    });
    return formatter.format(amount || 0);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

window.addEventListener('darkModeChanged', function(e) {
    if (e.detail.isDarkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
});