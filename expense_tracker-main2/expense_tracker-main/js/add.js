document.addEventListener('DOMContentLoaded', function () {
    // Use global categories if defined by common.js else fallback
    let incomeCategories = (window.incomeCategories && window.incomeCategories.length > 0)
        ? window.incomeCategories
        : JSON.parse(localStorage.getItem('incomeCategories')) || ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'];

    let expenseCategories = (window.expenseCategories && window.expenseCategories.length > 0)
        ? window.expenseCategories
        : JSON.parse(localStorage.getItem('expenseCategories')) || ['Housing', 'Food', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Other Expenses'];

    let currentType = 'income';

    // Get DOM elements
    const incomeBtn = document.getElementById('income-btn');
    const expenseBtn = document.getElementById('expense-btn');
    const categorySelect = document.getElementById('transaction-category');
    const transactionForm = document.getElementById('transactionForm');
    const cancelBtn = document.getElementById('cancel-btn');
    const amountInput = document.getElementById('transaction-amount');
    const dateInput = document.getElementById('transaction-date');
    const descriptionInput = document.getElementById('transaction-description');

    // Check if we're in edit mode
    const isEditMode = new URLSearchParams(window.location.search).get('edit') === 'true';
    const editModeInput = document.getElementById('edit-mode');
    editModeInput.value = isEditMode;

    if (isEditMode) {
        const transaction = JSON.parse(localStorage.getItem('editingTransaction'));
        if (transaction) {
            // Populate form with transaction data
            document.getElementById('transaction-amount').value = Math.abs(transaction.amount);
            document.getElementById('transaction-date').value = transaction.date.split('T')[0];
            document.getElementById('transaction-description').value = transaction.description || '';
            
            // Set type
            const type = transaction.amount > 0 ? 'income' : 'expense';
            handleTypeToggle(type);
            
            // Set category after a small delay to ensure options are populated
            setTimeout(() => {
                document.getElementById('transaction-category').value = transaction.category;
            }, 100);
            
            // Update form title
            document.querySelector('.page-title').textContent = 'Edit Transaction';
        }
    }

    // Function to update the category options dropdown based on transaction type
    function updateCategoryOptions() {
        categorySelect.innerHTML = '';

        // Add placeholder option
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = 'Select category';
        categorySelect.appendChild(placeholderOption);

        // Choose categories based on current type
        const categories = (currentType === 'income') ? incomeCategories : expenseCategories;

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }

    // Function to handle type button toggles
    function handleTypeToggle(type) {
        currentType = type;
        if (type === 'income') {
            incomeBtn.classList.add('active');
            expenseBtn.classList.remove('active');
        } else {
            expenseBtn.classList.add('active');
            incomeBtn.classList.remove('active');
        }
        updateCategoryOptions();
    }

    // Function to format currency using your AppSettings currency (or fallback)
    function formatCurrency(amount) {
        if (window.formatCurrency) {
            return window.formatCurrency(amount);
        }
        // fallback
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
    }

    function addTransaction(e) {
    e.preventDefault();

    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    const date = dateInput.value;
    const description = descriptionInput.value;
    const isEditMode = editModeInput.value === 'true';

    if (!amount || !category || !date) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Create a Date object from the input date
    const transactionDate = new Date(date);
    // Add current time to the date
    const now = new Date();
    transactionDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    if (isEditMode) {
        // Update existing transaction
        const originalTransaction = JSON.parse(localStorage.getItem('editingTransaction'));
        const transactionIndex = transactions.findIndex(t => t.id === originalTransaction.id);
        
        if (transactionIndex !== -1) {
            transactions[transactionIndex] = {
                ...originalTransaction,
                amount: currentType === 'income' ? amount : -amount,
                category,
                date: transactionDate.toISOString(), // Use the date with time
                description
            };
            
            localStorage.setItem('transactions', JSON.stringify(transactions));
            showNotification('Transaction updated successfully!', 'success');
            
            // Clear edit mode
            localStorage.removeItem('editingTransaction');
            setTimeout(() => {
                window.location.href = 'history.html';
            }, 1500);
        }
    } else {
        
const transaction = {
    id: Date.now(),
    type: currentType,
    amount: currentType === 'income' ? amount : -amount,
    category,
    date: transactionDate.toISOString(), // This now includes both date and time
    description,
    createdAt: new Date().toISOString() // This is the exact moment the transaction was recorded
};
        let existingTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
        existingTransactions.push(transaction);
        localStorage.setItem('transactions', JSON.stringify(existingTransactions));
        window.transactions = existingTransactions;

        const successMsg = currentType === 'income'
            ? `Income of ${formatCurrency(amount)} added!`
            : `Expense of ${formatCurrency(amount)} recorded!`;

        showNotification(successMsg, 'success');
        transactionForm.reset();
        dateInput.valueAsDate = new Date();

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
}

if (!dateInput.value) {
    const now = new Date();
    // Format as YYYY-MM-DD for the date input
    dateInput.value = now.toISOString().split('T')[0];
}

    // Event Listeners
    incomeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleTypeToggle('income');
    });

    expenseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleTypeToggle('expense');
    });

    transactionForm.addEventListener('submit', addTransaction);

    cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'index.html';
    });

    // Update categories on categoriesUpdated event from Settings
    window.addEventListener('categoriesUpdated', () => {
        incomeCategories = JSON.parse(localStorage.getItem('incomeCategories')) || incomeCategories;
        expenseCategories = JSON.parse(localStorage.getItem('expenseCategories')) || expenseCategories;
        updateCategoryOptions();
    });

    // Initialize: set default type and populate categories
    handleTypeToggle('income');
    
    // Set today's date if date input is empty
    if (!dateInput.value) {
        dateInput.valueAsDate = new Date();
    }

    
});  