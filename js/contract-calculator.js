// Contract Calculator JavaScript - External File
// Extracted for security compliance and improved maintainability

function calculateContract() {
    // Get input values
    const hourlyRate = parseFloat(document.getElementById('hourlyRate').value) || 0;
    const overtimeRate = parseFloat(document.getElementById('overtimeRate').value) || 0;
    const hoursPerWeek = parseFloat(document.getElementById('hoursPerWeek').value) || 0;
    const contractWeeks = parseFloat(document.getElementById('contractWeeks').value) || 0;
    const daysWorkedPerWeek = parseFloat(document.getElementById('daysWorkedPerWeek').value) || 5;
    const housingStipend = parseFloat(document.getElementById('housingStipend').value) || 0;
    const foodStipend = parseFloat(document.getElementById('foodStipend').value) || 0;
    const mileageDriven = parseFloat(document.getElementById('mileageDriven').value) || 0;
    const mileageRate = parseFloat(document.getElementById('mileageRate').value) || 0;
    const completionBonus = parseFloat(document.getElementById('completionBonus').value) || 0;
    const beeperCallHours = parseFloat(document.getElementById('beeperCallHours').value) || 0;
    const beeperCallRate = parseFloat(document.getElementById('beeperCallRate').value) || 0;

    // Calculate regular and overtime hours
    const regularHours = Math.min(hoursPerWeek, 40);
    const overtimeHours = Math.max(hoursPerWeek - 40, 0);

    // Calculate pay components
    const regularPay = regularHours * hourlyRate * contractWeeks;
    const overtimePay = overtimeHours * overtimeRate * contractWeeks;
    const totalBeeperCallPay = (beeperCallHours * beeperCallRate * contractWeeks) / 4; // Convert monthly to total
    
    // Get housing coverage type
    const housingCoverageType = document.querySelector('input[name="housingCoverage"]:checked')?.value || 'days-worked';
    
    // Calculate housing days based on coverage type
    let housingDaysPerWeek = daysWorkedPerWeek;
    
    if (housingCoverageType === 'days-worked-plus-travel') {
        // Day before + days worked + day after
        housingDaysPerWeek = daysWorkedPerWeek + 2;
    } else if (housingCoverageType === 'days-worked-plus-before') {
        // Day before + days worked (per work week)
        housingDaysPerWeek = daysWorkedPerWeek + 1;
    }
    
    // Enforce maximum 7 days per week for housing
    housingDaysPerWeek = Math.min(housingDaysPerWeek, 7);
    
    // Tax-free benefits
    const totalDaysWorked = daysWorkedPerWeek * contractWeeks;
    const totalHousingDays = housingDaysPerWeek * contractWeeks;
    const totalHousingStipend = housingStipend * totalHousingDays;
    const totalFoodStipend = foodStipend * totalDaysWorked;
    const totalMileageReimbursement = mileageDriven * mileageRate * totalDaysWorked;
    const otherCompensation = totalFoodStipend + totalMileageReimbursement + completionBonus;
    
    // Taxable income
    const grossTaxableIncome = regularPay + overtimePay + totalBeeperCallPay;
    
    // Total contract value
    const totalContractValue = grossTaxableIncome + totalHousingStipend + otherCompensation;
    
    // True hourly rate calculation
    const totalHours = hoursPerWeek * contractWeeks;
    const trueHourlyRate = totalHours > 0 ? totalContractValue / totalHours : 0;
    
    // Annual equivalent (52 weeks)
    const annualEquivalent = trueHourlyRate * hoursPerWeek * 52;

    // Calculate daily and hourly breakdowns
    const housingDailyAmount = housingStipend;
    const housingWeeklyAmount = housingStipend * housingDaysPerWeek;
    const housingHourlyImpact = hoursPerWeek > 0 ? housingWeeklyAmount / hoursPerWeek : 0;
    
    const foodDailyAmount = foodStipend;
    const foodHourlyImpact = hoursPerWeek > 0 ? (foodStipend * daysWorkedPerWeek) / hoursPerWeek : 0;
    
    const mileageDailyAmount = mileageDriven * mileageRate;
    const mileageHourlyImpact = hoursPerWeek > 0 ? (mileageDriven * mileageRate * daysWorkedPerWeek) / hoursPerWeek : 0;

    // Get weeks per month selection
    const weeksPerMonth = parseFloat(document.querySelector('input[name="weeksPerMonth"]:checked')?.value || '4');
    
    // Calculate gross period displays (total contract value / contract weeks)
    const baseWeeklyGross = contractWeeks > 0 ? totalContractValue / contractWeeks : 0;
    const grossDaily = baseWeeklyGross / daysWorkedPerWeek;
    const grossWeekly = baseWeeklyGross;
    const grossBiweekly = baseWeeklyGross * 2;
    
    // Calculate monthly based on selected weeks per month
    const grossMonthly = baseWeeklyGross * weeksPerMonth;

    // Update display
    document.getElementById('regularPay').textContent = '$' + regularPay.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    document.getElementById('overtimePay').textContent = '$' + overtimePay.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    document.getElementById('beeperCallPay').textContent = '$' + totalBeeperCallPay.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    document.getElementById('grossTaxableIncome').textContent = '$' + grossTaxableIncome.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    document.getElementById('totalHousingStipend').textContent = '$' + totalHousingStipend.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    document.getElementById('otherCompensation').textContent = '$' + otherCompensation.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    document.getElementById('totalContractValue').textContent = '$' + totalContractValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    document.getElementById('trueHourlyRate').textContent = '$' + trueHourlyRate.toFixed(2);
    document.getElementById('yourContractRate').textContent = '$' + trueHourlyRate.toFixed(2);
    document.getElementById('annualEquivalent').textContent = '$' + annualEquivalent.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    
    // Update gross period displays
    document.getElementById('grossDaily').textContent = '$' + grossDaily.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    document.getElementById('grossWeekly').textContent = '$' + grossWeekly.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    document.getElementById('grossBiweekly').textContent = '$' + grossBiweekly.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    document.getElementById('grossMonthly').textContent = '$' + grossMonthly.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});

    // Update subtexts
    document.querySelector('#regularPay').parentElement.querySelector('.result-subtext').textContent = `${regularHours} hrs/week × $${hourlyRate}/hr`;
    document.querySelector('#overtimePay').parentElement.querySelector('.result-subtext').textContent = `${overtimeHours} hrs/week × $${overtimeRate.toFixed(2)}/hr`;
    document.getElementById('beeperCallSubtext').textContent = `${beeperCallHours} hrs/month × $${beeperCallRate}/hr`;
    
    // Update breakdown displays
    document.getElementById('housingWeekly').textContent = '$' + housingWeeklyAmount.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    document.getElementById('housingHourly').textContent = '$' + housingHourlyImpact.toFixed(2) + '/hr';
    
    document.getElementById('foodWeekly').textContent = '$' + foodDailyAmount.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    document.getElementById('foodHourly').textContent = '$' + foodHourlyImpact.toFixed(2) + '/hr';
    
    document.getElementById('mileageWeekly').textContent = '$' + mileageDailyAmount.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    document.getElementById('mileageHourly').textContent = '$' + mileageHourlyImpact.toFixed(2) + '/hr';
    
    document.getElementById('completionBonusDisplay').textContent = '$' + completionBonus.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
}

function emailResults() {
    const clinicianType = document.getElementById('clinicianType').options[document.getElementById('clinicianType').selectedIndex].text;
    const state = document.getElementById('state').value;
    const totalValue = document.getElementById('totalContractValue').textContent;
    const trueRate = document.getElementById('trueHourlyRate').textContent;
    
    const subject = 'Contract Analysis Results';
    const body = `Contract Analysis Summary\n\nClinician Type: ${clinicianType}\nState: ${state}\nTotal Contract Value: ${totalValue}\nTrue Hourly Rate: ${trueRate}\n\nGenerated on: ${new Date().toLocaleDateString()}`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function updateMarketAverage() {
    const clinicianType = document.getElementById('clinicianType').value;
    const state = document.getElementById('state').value;
    
    // Market data by clinician type (simplified)
    const marketRates = {
        'md-do': { base: 350, variance: 50 },
        'crna': { base: 185, variance: 25 },
        'np': { base: 125, variance: 20 },
        'pa': { base: 120, variance: 20 },
        'rn': { base: 75, variance: 15 },
        'scrub-tech': { base: 45, variance: 10 },
        'aa': { base: 140, variance: 20 }
    };
    
    if (clinicianType && state && marketRates[clinicianType]) {
        const baseRate = marketRates[clinicianType].base;
        const variance = marketRates[clinicianType].variance;
        // Simple state adjustment (could be enhanced with real data)
        const stateMultiplier = state === 'CA' || state === 'NY' ? 1.2 : state === 'TX' || state === 'FL' ? 0.9 : 1.0;
        const marketAverage = baseRate * stateMultiplier;
        
        document.getElementById('marketAverage').textContent = '$' + marketAverage.toFixed(2);
        document.getElementById('marketAverageLabel').textContent = document.getElementById('clinicianType').options[document.getElementById('clinicianType').selectedIndex].text + ' in ' + state;
    } else {
        document.getElementById('marketAverage').textContent = '$0.00';
        document.getElementById('marketAverageLabel').textContent = 'Select Clinician & State';
    }
}

function exportAnalysis() {
    window.print();
}

// Save contract analysis function
function saveContractAnalysis() {
    // Check if user is logged in
    const userData = JSON.parse(localStorage.getItem('locum_user_data') || '{}');
    if (!userData.email) {
        showToast('Please log in to save your contract analysis', 'error');
        return;
    }
    
    // Get all contract data
    const contractData = {
        id: Date.now(), // Simple ID generation
        savedDate: new Date().toISOString(),
        jobTitle: document.getElementById('jobTitle')?.value || 'Contract Analysis',
        location: document.getElementById('state')?.value || 'Not specified',
        hourlyRate: parseFloat(document.getElementById('hourlyRate').value),
        overtimeRate: parseFloat(document.getElementById('overtimeRate').value),
        hoursPerWeek: parseFloat(document.getElementById('hoursPerWeek').value),
        contractWeeks: parseFloat(document.getElementById('contractWeeks').value),
        daysWorkedPerWeek: parseFloat(document.getElementById('daysWorkedPerWeek').value),
        housingStipend: parseFloat(document.getElementById('housingStipend').value),
        foodStipend: parseFloat(document.getElementById('foodStipend').value),
        mileageDriven: parseFloat(document.getElementById('mileageDriven').value),
        completionBonus: parseFloat(document.getElementById('completionBonus').value),
        totalContractValue: document.getElementById('totalContractValue').textContent,
        trueHourlyRate: document.getElementById('trueHourlyRate').textContent,
        annualEquivalent: document.getElementById('annualEquivalent').textContent
    };
    
    // Get existing saved contracts or initialize empty array
    const savedContracts = JSON.parse(localStorage.getItem('savedContracts') || '[]');
    
    // Add new contract to beginning of array
    savedContracts.unshift(contractData);
    
    // Keep only last 50 saved contracts
    if (savedContracts.length > 50) {
        savedContracts.splice(50);
    }
    
    // Save back to localStorage
    localStorage.setItem('savedContracts', JSON.stringify(savedContracts));
    
    // Show success message
    showToast('Contract analysis saved successfully!', 'success');
    
    // Update button temporarily
    const saveButton = document.getElementById('saveAnalysis');
    if (saveButton) {
        const originalText = saveButton.textContent;
        saveButton.textContent = 'Saved ✓';
        saveButton.disabled = true;
        
        setTimeout(() => {
            saveButton.textContent = originalText;
            saveButton.disabled = false;
        }, 2000);
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Check if toast already exists
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            transition: all 0.3s ease;
            transform: translateY(100px);
            opacity: 0;
        `;
        document.body.appendChild(toast);
    }
    
    // Set color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#2563eb',
        warning: '#f59e0b'
    };
    
    toast.style.backgroundColor = colors[type] || colors.info;
    toast.textContent = message;
    
    // Show toast
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 100);
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
    }, 3000);
}

// Check for pre-filled data from job board
function checkPrefilledData() {
    const calculatorData = localStorage.getItem('calculatorData');
    if (calculatorData) {
        const data = JSON.parse(calculatorData);
        
        // Fill form with job data
        if (data.hourlyRate) document.getElementById('hourlyRate').value = data.hourlyRate;
        if (data.hoursPerWeek) document.getElementById('hoursPerWeek').value = data.hoursPerWeek;
        if (data.contractWeeks) document.getElementById('contractWeeks').value = data.contractWeeks;
        if (data.housingStipend) document.getElementById('housingStipend').value = data.housingStipend;
        
        // Set overtime rate if provided
        if (data.overtimeRate) {
            document.getElementById('overtimeRate').value = data.overtimeRate;
        }
        
        // Show alert
        document.getElementById('prefilledAlert').classList.add('show');
        
        // Clear the data
        localStorage.removeItem('calculatorData');
        
        // Calculate with new data
        calculateContract();
    }
}

// Initialize all event listeners and calculator
function initializeContractCalculator() {
    // Auto-calculate overtime rate based on regular rate
    document.getElementById('hourlyRate').addEventListener('input', function() {
        const regularRate = parseFloat(this.value) || 0;
        const overtimeRate = regularRate * 1.25;
        document.getElementById('overtimeRate').value = overtimeRate.toFixed(2);
        calculateContract();
    });

    // Add all input event listeners for calculation
    const calculationInputs = [
        'hourlyRate', 'overtimeRate', 'hoursPerWeek', 'contractWeeks', 'daysWorkedPerWeek',
        'housingStipend', 'foodStipend', 'mileageDriven', 'mileageRate', 'completionBonus',
        'beeperCallHours', 'beeperCallRate'
    ];

    calculationInputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('input', calculateContract);
        }
    });
    
    // Add housing coverage radio button listeners
    const housingCoverageRadios = document.querySelectorAll('input[name="housingCoverage"]');
    housingCoverageRadios.forEach(radio => {
        radio.addEventListener('change', calculateContract);
    });
    
    // Add weeks per month radio button listeners
    const weeksPerMonthRadios = document.querySelectorAll('input[name="weeksPerMonth"]');
    weeksPerMonthRadios.forEach(radio => {
        radio.addEventListener('change', calculateContract);
    });

    // Add market average update listeners
    const marketInputs = ['clinicianType', 'state'];
    marketInputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('change', updateMarketAverage);
        }
    });

    // Add button event listeners
    const saveButton = document.getElementById('saveAnalysis');
    if (saveButton) {
        saveButton.addEventListener('click', saveContractAnalysis);
    }

    const emailButton = document.getElementById('emailResults');
    if (emailButton) {
        emailButton.addEventListener('click', emailResults);
    }

    const exportButton = document.getElementById('exportAnalysis');
    if (exportButton) {
        exportButton.addEventListener('click', exportAnalysis);
    }

    // Initialize calculator
    checkPrefilledData();
    calculateContract();
    updateMarketAverage();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeContractCalculator);