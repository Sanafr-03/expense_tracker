
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let goals = JSON.parse(localStorage.getItem('goals')) || [];

document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements
    const addBtn = document.querySelector('.add-btn');
    const addFirstTransactionBtn = document.getElementById('add-first-transaction');
    const addGoalBtn = document.getElementById('add-goal');
    const goalModal = document.getElementById('goalModal');
    const editGoalModal = document.getElementById('editGoalModal');
    const modalCloseBtns = document.querySelectorAll('.modal-close');
    
    // Load data
    updateUI();
    
    // Event listeners
    addBtn.addEventListener('click', () => window.location.href = 'add.html');
    addFirstTransactionBtn.addEventListener('click', () => window.location.href = 'add.html');
    addGoalBtn.addEventListener('click', showAddGoalModal);
    
    // Modal close buttons
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    });
    
    // Close modal when clicking outside
    goalModal.addEventListener('click', function(e) {
        if (e.target === goalModal) {
            closeModal();
        }
    });
    
    editGoalModal.addEventListener('click', function(e) {
        if (e.target === editGoalModal) {
            closeModal();
        }
    });

    window.addEventListener('darkModeChanged', function(e) {
        document.body.classList.toggle('dark-mode', e.detail);
        if (typeof initCharts === 'function') initCharts();
    });
    
    // Form submissions
    document.getElementById('goalForm').addEventListener('submit', addGoal);
    document.getElementById('editGoalForm').addEventListener('submit', updateGoal);
    
    // Listen for reset event from settings
    // Add this event listener
window.addEventListener('fullReset', function() {
    transactions = [];
    goals = [];
    updateUI(); // This will refresh all charts and lists
});
});

function updateUI() {
    updateTransactionLists();
    updateSummary();
    updateGoals();
    initCharts();
    toggleSummaryVisibility();
}

function toggleSummaryVisibility() {
    const summaryContainer = document.querySelector('.summary-container');
    summaryContainer.style.display = 'grid';
    
    if (transactions.length === 0) {
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
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentTransactions = sortedTransactions.slice(0, 5);
    
    if (recentTransactions.length === 0) {
        recentTransactionsList.innerHTML = `
            <li class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-exchange-alt"></i>
                </div>
                <div class="empty-text">No transactions yet</div>
                <button class="btn btn-primary" id="add-first-transaction">
                    <i class="fas fa-plus"></i> Add Transaction
                </button>
            </li>
        `;
        document.getElementById('add-first-transaction').addEventListener('click', () => window.location.href = 'add.html');
        return;
    }
    
    recentTransactionsList.innerHTML = '';
    recentTransactions.forEach(transaction => {
        recentTransactionsList.appendChild(createTransactionElement(transaction));
    });
}

function updateGoals() {
    const goalsContainer = document.getElementById('goals-slider');
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

function updateSummary() {
    const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balance = income - expense;
    
    document.getElementById('income-total').textContent = formatCurrency(income);
    document.getElementById('expense-total').textContent = formatCurrency(expense);
    document.getElementById('balance-total').textContent = formatCurrency(balance);
    
    const hasData = transactions.length > 0;
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
    const ctx = document.getElementById('incomeChart').getContext('2d');
    
    const incomeByMonth = Array(12).fill(0);
    transactions
        .filter(t => t.amount > 0)
        .forEach(t => {
            const date = new Date(t.date);
            const month = date.getMonth();
            incomeByMonth[month] += t.amount;
        });
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Income',
                data: incomeByMonth,
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${formatCurrency(value)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    grid: {
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function createExpenseChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    const expenseByMonth = Array(12).fill(0);
    transactions
        .filter(t => t.amount < 0)
        .forEach(t => {
            const date = new Date(t.date);
            const month = date.getMonth();
            expenseByMonth[month] += Math.abs(t.amount);
        });
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Expenses',
                data: expenseByMonth,
                backgroundColor: 'rgba(243, 156, 18, 0.7)',
                borderColor: 'rgba(243, 156, 18, 1)',
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${formatCurrency(value)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    grid: {
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
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

document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
});

// Add this event listener
window.addEventListener('fullReset', function() {
    transactions = [];
    goals = [];
    updateUI(); // This will refresh all charts and lists
});