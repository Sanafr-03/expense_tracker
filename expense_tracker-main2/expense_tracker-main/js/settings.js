document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements safely
    const darkModeToggle = document.getElementById('dark-mode');
    const emailNotificationsToggle = document.getElementById('email-notifications');
    const currencySelect = document.getElementById('currency-select');
    const exportDataBtn = document.getElementById('export-data');
    const importDataBtn = document.getElementById('import-data');
    const resetDataBtn = document.getElementById('reset-data');
    const manageIncomeCategoriesBtn = document.getElementById('manage-income-categories');
    const manageExpenseCategoriesBtn = document.getElementById('manage-expense-categories');
    const categoryModal = document.getElementById('categoryModal');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const newCategoryInput = document.getElementById('newCategoryName');
    
    // Load settings - default to INR
    if (darkModeToggle) darkModeToggle.checked = AppSettings.darkMode;
    if (emailNotificationsToggle) emailNotificationsToggle.checked = localStorage.getItem('emailNotifications') !== 'false';
    if (currencySelect) currencySelect.value = AppSettings.currency;
    
    if (currencySelect) {
        document.querySelectorAll('#currency-select option').forEach(option => {
            const currencySymbol = AppSettings.getCurrencySymbol(option.value);
            option.textContent = `${option.text.replace(/\(.*\)/, '')} (${currencySymbol})`;
        });
    }

    // Event listeners with existence checks
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            const isDarkMode = this.checked;
            AppSettings.darkMode = isDarkMode;
            localStorage.setItem('darkMode', isDarkMode);
            document.body.classList.toggle('dark-mode', isDarkMode);
            window.dispatchEvent(new CustomEvent('darkModeChanged', { detail: { isDarkMode } }));
            showNotification(`Dark mode ${isDarkMode ? 'enabled' : 'disabled'}`, 'success');
        });
    }

    if (emailNotificationsToggle) {
        emailNotificationsToggle.addEventListener('change', function() {
            localStorage.setItem('emailNotifications', this.checked);
            showNotification(`Email notifications ${this.checked ? 'enabled' : 'disabled'}`, 'success');
        });
    }

    if (currencySelect) {
        currencySelect.addEventListener('change', function() {
            AppSettings.currency = this.value;
            showNotification(`Currency changed to ${this.value}`, 'success');
            localStorage.setItem('currency', this.value);
            window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency: this.value } }));
        });
    }

    if (exportDataBtn) exportDataBtn.addEventListener('click', exportToExcel);
    if (importDataBtn) importDataBtn.addEventListener('click', importData);
    if (resetDataBtn) resetDataBtn.addEventListener('click', resetData);
    if (manageIncomeCategoriesBtn) manageIncomeCategoriesBtn.addEventListener('click', () => showCategoryModal('income'));
    if (manageExpenseCategoriesBtn) manageExpenseCategoriesBtn.addEventListener('click', () => showCategoryModal('expense'));
    if (addCategoryBtn) addCategoryBtn.addEventListener('click', addCategory);
    
    if (newCategoryInput) {
        newCategoryInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addCategory();
            }
        });
    }

    // Modal close button
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            if (categoryModal) {
                categoryModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });

    // Close modal when clicking outside
    if (categoryModal) {
        categoryModal.addEventListener('click', function(e) {
            if (e.target === categoryModal) {
                categoryModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Initialize help guide tabs
    setupHelpGuideTabs();
});

function setupHelpGuideTabs() {
    const tabButtons = document.querySelectorAll('.help-tab-button');
    const guideSections = document.querySelectorAll('.guide-section');

    if (tabButtons.length > 0 && guideSections.length > 0) {
        // Set first tab and section as active if none are active
        const hasActiveTab = Array.from(tabButtons).some(btn => btn.classList.contains('active'));
        const hasActiveSection = Array.from(guideSections).some(section => section.classList.contains('active'));
        
        if (!hasActiveTab && !hasActiveSection) {
            tabButtons[0].classList.add('active');
            guideSections[0].classList.add('active');
        }

        // Add click event listeners to tab buttons
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // Update active tab
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update visible section
                guideSections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === tabId) {
                        section.classList.add('active');
                    }
                });
            });
        });
    }

    // FAQ toggle functionality
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.closest('.faq-item');
            const isOpening = !faqItem.classList.contains('active');
            
            // Close all FAQs first
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Open clicked FAQ if it was closed
            if (isOpening) {
                faqItem.classList.add('active');
            }
        });
    });
}

function exportToExcel() {
    try {
        // Prepare data
        const data = [
            ["Date", "Description", "Category", "Amount", "Type"],
            ...transactions.map(t => [
                formatDate(t.date),
                t.description || '',
                t.category,
                t.amount > 0 ? t.amount : -t.amount,
                t.amount > 0 ? 'Income' : 'Expense'
            ])
        ];
        
        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transactions");
        
        // Add categories sheets
        const incomeCatSheet = XLSX.utils.aoa_to_sheet([
            ["Income Categories"],
            ...incomeCategories.map(c => [c])
        ]);
        XLSX.utils.book_append_sheet(wb, incomeCatSheet, "Income Categories");
        
        const expenseCatSheet = XLSX.utils.aoa_to_sheet([
            ["Expense Categories"],
            ...expenseCategories.map(c => [c])
        ]);
        XLSX.utils.book_append_sheet(wb, expenseCatSheet, "Expense Categories");
        
        // Export to Excel file
        XLSX.writeFile(wb, "expense_tracker_export.xlsx");
        showNotification('Data exported successfully', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Failed to export data', 'error');
    }
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Process transactions
                if (workbook.SheetNames.includes("Transactions")) {
                    const firstSheet = workbook.Sheets["Transactions"];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    
                    if (jsonData.length === 0) {
                        showNotification('No transaction data found in the file', 'error');
                        return;
                    }
                    
                    // Validate and format imported data
                    const newTransactions = jsonData.map(row => {
                        // Skip header row if it exists
                        if (row.Date === "Date") return null;
                        
                        const amount = parseFloat(row.Amount || row.amount || 0);
                        const isIncome = (row.Type || row.type || '').toLowerCase() === 'income' || amount > 0;
                        
                        return {
                            id: Date.now() + Math.random(),
                            date: parseDate(row.Date || row.date) || new Date(),
                            description: row.Description || row.description || '',
                            category: row.Category || row.category || (isIncome ? 'Other Income' : 'Uncategorized'),
                            amount: isIncome ? Math.abs(amount) : -Math.abs(amount)
                        };
                    }).filter(t => t !== null);
                    
                    if (newTransactions.length > 0) {
                        transactions = newTransactions;
                        saveTransactions();
                    }
                }
                
                // Process categories if they exist
                if (workbook.SheetNames.includes("Income Categories")) {
                    const incomeSheet = workbook.Sheets["Income Categories"];
                    const incomeData = XLSX.utils.sheet_to_json(incomeSheet, { header: 1 });
                    if (incomeData.length > 1) {
                        incomeCategories = incomeData.slice(1).map(row => row[0]).filter(Boolean);
                        localStorage.setItem('incomeCategories', JSON.stringify(incomeCategories));
                    }
                }
                
                if (workbook.SheetNames.includes("Expense Categories")) {
                    const expenseSheet = workbook.Sheets["Expense Categories"];
                    const expenseData = XLSX.utils.sheet_to_json(expenseSheet, { header: 1 });
                    if (expenseData.length > 1) {
                        expenseCategories = expenseData.slice(1).map(row => row[0]).filter(Boolean);
                        localStorage.setItem('expenseCategories', JSON.stringify(expenseCategories));
                    }
                }
                
                showNotification(`Successfully imported ${transactions.length} transactions`, 'success');
            } catch (error) {
                console.error('Import error:', error);
                showNotification('Failed to import data. Please check the file format.', 'error');
            }
        };
        
        reader.readAsArrayBuffer(file);
    };
    
    input.click();
}

function resetData() {
    if (confirm('Are you sure you want to reset all financial data? This cannot be undone!')) {
        // Reset transactions
        transactions = [];
        localStorage.setItem('transactions', JSON.stringify(transactions));
        
        // Reset goals
        goals = [];
        localStorage.setItem('goals', JSON.stringify(goals));
        
        // Dispatch custom event to notify all pages
        const resetEvent = new CustomEvent('fullReset', {
            detail: {
                resetTime: new Date().toISOString()
            }
        });
        window.dispatchEvent(resetEvent);
        
        showNotification('All financial data has been reset', 'success');
        
        // Force refresh if on reports page
        if (window.location.pathname.includes('reports.html')) {
            window.location.reload();
        }
    }
}

function showCategoryModal(type) {
    currentCategoryType = type;
    const modalTitle = document.getElementById('categoryModalTitle');
    const categoryList = document.getElementById('categoryList');
    const newCategoryInput = document.getElementById('newCategoryName');
    
    modalTitle.textContent = `Manage ${type === 'income' ? 'Income' : 'Expense'} Categories`;
    newCategoryInput.placeholder = `New ${type === 'income' ? 'income' : 'expense'} category`;
    newCategoryInput.value = '';
    newCategoryInput.focus();
    
    // Populate category list
    categoryList.innerHTML = '';
    const categories = type === 'income' ? [...incomeCategories] : [...expenseCategories];
    
    if (categories.length === 0) {
        categoryList.innerHTML = '<p class="no-categories">No categories found</p>';
    } else {
        categories.forEach((category, index) => {
            const li = document.createElement('li');
            li.className = 'category-item';
            li.innerHTML = `
                <span class="category-name">${category}</span>
                <div class="category-actions">
                    <button class="delete-category" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            categoryList.appendChild(li);
        });
    }
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-category').forEach(button => {
        button.addEventListener('click', function() {
            deleteCategory(this.dataset.index);
        });
    });
    
    document.getElementById('categoryModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function addCategory() {
    const newCategoryInput = document.getElementById('newCategoryName');
    const categoryName = newCategoryInput.value.trim();
    
    if (!categoryName) {
        showNotification('Please enter a category name', 'error');
        return;
    }
    
    const categories = currentCategoryType === 'income' ? incomeCategories : expenseCategories;
    
    if (categories.includes(categoryName)) {
        showNotification('This category already exists', 'error');
        return;
    }
    
    categories.push(categoryName);
    saveCategories();
    showCategoryModal(currentCategoryType);
    showNotification(`"${categoryName}" added to ${currentCategoryType} categories`, 'success');
}

function deleteCategory(index) {
    const categories = currentCategoryType === 'income' ? incomeCategories : expenseCategories;
    index = parseInt(index);
    
    if (index >= 0 && index < categories.length) {
        const categoryName = categories[index];
        
        // Check if category is used in any transactions
        const isUsed = transactions.some(t => 
            t.category === categoryName && 
            (currentCategoryType === 'income' ? t.amount > 0 : t.amount < 0)
        );
        
        if (isUsed) {
            showNotification(`Cannot delete "${categoryName}" as it's used in transactions`, 'error');
            return;
        }
        
        if (confirm(`Are you sure you want to delete the "${categoryName}" category?`)) {
            categories.splice(index, 1);
            saveCategories();
            showCategoryModal(currentCategoryType);
            showNotification(`"${categoryName}" category deleted`, 'success');
        }
    }
}

function saveCategories() {
    localStorage.setItem('incomeCategories', JSON.stringify(incomeCategories));
    localStorage.setItem('expenseCategories', JSON.stringify(expenseCategories));
    window.dispatchEvent(new Event('categoriesUpdated'));
    showNotification('Categories updated successfully', 'success');
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function parseDate(dateString) {
    if (!dateString) return null;
    
    // Try parsing as ISO string
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) return date;
    
    // Try parsing as Excel date (numeric)
    if (!isNaN(dateString)) {
        // Excel dates are days since 1900-01-01
        const excelEpoch = new Date(1900, 0, 1);
        excelEpoch.setDate(excelEpoch.getDate() + parseInt(dateString) - 2); // Excel has a leap year bug
        return excelEpoch;
    }
    
    // Try parsing common date formats
    const formats = [
        'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD',
        'MM-DD-YYYY', 'DD-MM-YYYY', 'YYYY/MM/DD'
    ];
    
    for (const format of formats) {
        const parsed = parseDateWithFormat(dateString, format);
        if (parsed) return parsed;
    }
    
    return null;
}

function parseDateWithFormat(dateString, format) {
    const parts = format.split(/[\/-]/);
    const dateParts = dateString.split(/[\/-]/);
    
    if (parts.length !== dateParts.length) return null;
    
    const dateObj = {};
    for (let i = 0; i < parts.length; i++) {
        dateObj[parts[i]] = parseInt(dateParts[i]);
    }
    
    if (dateObj.YYYY && dateObj.MM && dateObj.DD) {
        // Note: Month is 0-indexed in JavaScript Date
        const date = new Date(dateObj.YYYY, dateObj.MM - 1, dateObj.DD);
        if (!isNaN(date.getTime())) return date;
    }
    
    return null;
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}