document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    // General
    const expenseTab = document.getElementById('expense-tab');
    const incomeTab = document.getElementById('income-tab');
    const expenseSection = document.getElementById('expense-section');
    const incomeSection = document.getElementById('income-section');

    // Summary
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpensesEl = document.getElementById('total-expenses');
    const remainingBalanceEl = document.getElementById('remaining-balance');

    // Expense Elements
    const expenseForm = document.getElementById('expense-form');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const categoryInput = document.getElementById('category');
    const dateInput = document.getElementById('date');
    const editIndexInput = document.getElementById('edit-index');
    const submitBtn = document.getElementById('submit-btn');
    const expenseList = document.getElementById('expense-list');
    const noExpensesEl = document.getElementById('no-expenses');
    const expenseChartEl = document.getElementById('expense-chart');
    
    // Income Elements
    const incomeForm = document.getElementById('income-form');
    const incomeSourceInput = document.getElementById('income-source');
    const incomeAmountInput = document.getElementById('income-amount');
    const incomeDateInput = document.getElementById('income-date');
    const incomeEditIndexInput = document.getElementById('income-edit-index');
    const incomeSubmitBtn = document.getElementById('income-submit-btn');
    const incomeList = document.getElementById('income-list');
    const noIncomeEl = document.getElementById('no-income');

    // --- STATE ---
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let incomes = JSON.parse(localStorage.getItem('incomes')) || [];
    let expenseChart;

    // --- DEFAULTS ---
    dateInput.valueAsDate = new Date();
    incomeDateInput.valueAsDate = new Date();
    
    // --- HELPERS ---
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    // --- LOCAL STORAGE ---
    const saveExpensesToLocalStorage = () => {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    };
    const saveIncomesToLocalStorage = () => {
        localStorage.setItem('incomes', JSON.stringify(incomes));
    };

    // --- SUMMARY & CHART ---
    const updateSummary = () => {
        const totalIncome = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);
        const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
        const remainingBalance = totalIncome - totalExpenses;

        totalIncomeEl.textContent = `$${totalIncome.toFixed(2)}`;
        totalExpensesEl.textContent = `$${totalExpenses.toFixed(2)}`;
        remainingBalanceEl.textContent = `$${remainingBalance.toFixed(2)}`;

        remainingBalanceEl.classList.remove('text-green-400', 'text-red-400', 'text-blue-400');
        if (remainingBalance > 0) {
            remainingBalanceEl.classList.add('text-green-400');
        } else if (remainingBalance < 0) {
            remainingBalanceEl.classList.add('text-red-400');
        } else {
            remainingBalanceEl.classList.add('text-blue-400');
        }
    };

    const updateChart = () => {
        const categoryTotals = expenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount);
            return acc;
        }, {});

        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);

        const chartData = {
            labels: labels,
            datasets: [{
                label: 'Expenses by Category',
                data: data,
                backgroundColor: ['#4f46e5', '#db2777', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'],
                borderColor: '#1f2937', // Card background color
                borderWidth: 2,
                hoverOffset: 4
            }]
        };

        if (expenseChart) {
            expenseChart.data = chartData;
            expenseChart.update();
        } else {
            expenseChart = new Chart(expenseChartEl, {
                type: 'doughnut',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            position: 'bottom',
                            labels: {
                                color: '#d1d5db' // gray-300 for legend text
                            }
                        }, 
                        title: { 
                            display: false 
                        } 
                    }
                }
            });
        }
    };
    
    // --- EXPENSE FUNCTIONS ---
    const renderExpenses = () => {
        expenseList.innerHTML = '';
        noExpensesEl.style.display = expenses.length === 0 ? 'block' : 'none';

        const getCategoryClass = (category) => {
            const colors = {
                'Food': 'bg-red-900/50 text-red-300', 'Transport': 'bg-blue-900/50 text-blue-300',
                'Utilities': 'bg-yellow-900/50 text-yellow-300', 'Entertainment': 'bg-purple-900/50 text-purple-300',
                'Shopping': 'bg-pink-900/50 text-pink-300', 'Health': 'bg-green-900/50 text-green-300',
                'Other': 'bg-gray-700 text-gray-300',
            };
            return colors[category] || colors['Other'];
        };

        expenses.forEach((expense, index) => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-700 hover:bg-gray-700';
            row.innerHTML = `
                <td class="p-3">${expense.description}</td>
                <td class="p-3 font-medium">$${parseFloat(expense.amount).toFixed(2)}</td>
                <td class="p-3"><span class="px-2 py-1 text-xs font-semibold rounded-full ${getCategoryClass(expense.category)}">${expense.category}</span></td>
                <td class="p-3 text-sm text-gray-400">${formatDate(expense.date)}</td>
                <td class="p-3 text-right">
                    <button onclick="editExpense(${index})" class="text-blue-400 hover:text-blue-300 text-sm font-semibold mr-2">Edit</button>
                    <button onclick="deleteExpense(${index})" class="text-red-400 hover:text-red-300 text-sm font-semibold">Delete</button>
                </td>
            `;
            expenseList.appendChild(row);
        });
        
        updateSummary();
        updateChart();
        saveExpensesToLocalStorage();
    };

    window.editExpense = (index) => {
        const expense = expenses[index];
        descriptionInput.value = expense.description;
        amountInput.value = expense.amount;
        categoryInput.value = expense.category;
        dateInput.value = expense.date;
        editIndexInput.value = index;
        
        submitBtn.textContent = 'Update Expense';
        submitBtn.classList.replace('btn-primary','bg-green-600');
        submitBtn.classList.add('hover:bg-green-500');
        
        descriptionInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.deleteExpense = (index) => {
        if(confirm('Are you sure you want to delete this expense?')) {
            expenses.splice(index, 1);
            renderExpenses();
        }
    };
    
    // --- INCOME FUNCTIONS ---
    const renderIncomes = () => {
        incomeList.innerHTML = '';
        noIncomeEl.style.display = incomes.length === 0 ? 'block' : 'none';

        incomes.forEach((income, index) => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-700 hover:bg-gray-700';
            row.innerHTML = `
                <td class="p-3">${income.source}</td>
                <td class="p-3 font-medium">$${parseFloat(income.amount).toFixed(2)}</td>
                <td class="p-3 text-sm text-gray-400">${formatDate(income.date)}</td>
                <td class="p-3 text-right">
                    <button onclick="editIncome(${index})" class="text-blue-400 hover:text-blue-300 text-sm font-semibold mr-2">Edit</button>
                    <button onclick="deleteIncome(${index})" class="text-red-400 hover:text-red-300 text-sm font-semibold">Delete</button>
                </td>
            `;
            incomeList.appendChild(row);
        });

        updateSummary();
        saveIncomesToLocalStorage();
    };
    
    window.editIncome = (index) => {
        const income = incomes[index];
        incomeSourceInput.value = income.source;
        incomeAmountInput.value = income.amount;
        incomeDateInput.value = income.date;
        incomeEditIndexInput.value = index;

        incomeSubmitBtn.textContent = 'Update Income';
        incomeSubmitBtn.classList.replace('btn-primary','bg-green-600');
        incomeSubmitBtn.classList.add('hover:bg-green-500');
        
        incomeSourceInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.deleteIncome = (index) => {
        if(confirm('Are you sure you want to delete this income entry?')) {
            incomes.splice(index, 1);
            renderIncomes();
        }
    };

    // --- EVENT LISTENERS ---
    expenseTab.addEventListener('click', () => {
        expenseTab.classList.add('active-tab');
        incomeTab.classList.remove('active-tab');
        expenseSection.classList.remove('hidden');
        incomeSection.classList.add('hidden');
    });

    incomeTab.addEventListener('click', () => {
        incomeTab.classList.add('active-tab');
        expenseTab.classList.remove('active-tab');
        incomeSection.classList.remove('hidden');
        expenseSection.classList.add('hidden');
    });

    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newExpense = {
            description: descriptionInput.value.trim(),
            amount: amountInput.value.trim(),
            category: categoryInput.value,
            date: dateInput.value
        };
        const editIndex = editIndexInput.value;

        if (editIndex !== '') {
            expenses[editIndex] = newExpense;
            submitBtn.textContent = 'Add Expense';
            submitBtn.classList.replace('bg-green-600', 'btn-primary');
            submitBtn.classList.remove('hover:bg-green-500');
        } else {
            expenses.push(newExpense);
        }
        
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        expenseForm.reset();
        dateInput.valueAsDate = new Date();
        editIndexInput.value = '';
        descriptionInput.focus();
        renderExpenses();
    });
    
    incomeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newIncome = {
            source: incomeSourceInput.value.trim(),
            amount: incomeAmountInput.value.trim(),
            date: incomeDateInput.value
        };
        const editIndex = incomeEditIndexInput.value;

        if (editIndex !== '') {
            incomes[editIndex] = newIncome;
            incomeSubmitBtn.textContent = 'Add Income';
            incomeSubmitBtn.classList.replace('bg-green-600', 'btn-primary');
            incomeSubmitBtn.classList.remove('hover:bg-green-500');
        } else {
            incomes.push(newIncome);
        }

        incomes.sort((a, b) => new Date(b.date) - new Date(a.date));
        incomeForm.reset();
        incomeDateInput.valueAsDate = new Date();
        incomeEditIndexInput.value = '';
        incomeSourceInput.focus();
        renderIncomes();
    });
    
    // --- INITIAL RENDER ---
    renderExpenses();
    renderIncomes();
});

