/**
 * Tax and Payroll Calculations Module
 * Provides accurate tax calculations for contract and paycheck estimations
 */

// 2024 Federal Tax Brackets (Single Filing Status)
const FEDERAL_TAX_BRACKETS = [
    { min: 0, max: 11000, rate: 0.10 },
    { min: 11000, max: 44725, rate: 0.12 },
    { min: 44725, max: 95375, rate: 0.22 },
    { min: 95375, max: 182050, rate: 0.24 },
    { min: 182050, max: 231250, rate: 0.32 },
    { min: 231250, max: 578125, rate: 0.35 },
    { min: 578125, max: Infinity, rate: 0.37 }
];

// FICA Tax Rates and Wage Base Limits (2024)
const FICA_RATES = {
    socialSecurity: {
        rate: 0.062, // 6.2%
        wageBase: 160200 // Annual wage base limit
    },
    medicare: {
        rate: 0.0145, // 1.45%
        wageBase: Infinity // No wage base limit
    },
    additionalMedicare: {
        rate: 0.009, // 0.9% additional on high earners
        threshold: 200000 // Annual threshold for single filers
    }
};

// State Tax Rates (approximate - flat rate for simplicity)
const STATE_TAX_RATES = {
    'AL': 0.05, 'AK': 0.00, 'AZ': 0.045, 'AR': 0.063, 'CA': 0.093,
    'CO': 0.044, 'CT': 0.065, 'DE': 0.066, 'FL': 0.00, 'GA': 0.0575,
    'HI': 0.085, 'ID': 0.058, 'IL': 0.0495, 'IN': 0.0323, 'IA': 0.067,
    'KS': 0.057, 'KY': 0.05, 'LA': 0.043, 'ME': 0.0715, 'MD': 0.0575,
    'MA': 0.05, 'MI': 0.0425, 'MN': 0.0785, 'MS': 0.05, 'MO': 0.054,
    'MT': 0.0675, 'NE': 0.0684, 'NV': 0.00, 'NH': 0.00, 'NJ': 0.0897,
    'NM': 0.049, 'NY': 0.0685, 'NC': 0.0475, 'ND': 0.029, 'OH': 0.0399,
    'OK': 0.05, 'OR': 0.0875, 'PA': 0.0307, 'RI': 0.0599, 'SC': 0.065,
    'SD': 0.00, 'TN': 0.00, 'TX': 0.00, 'UT': 0.0495, 'VT': 0.066,
    'VA': 0.0575, 'WA': 0.00, 'WV': 0.065, 'WI': 0.0765, 'WY': 0.00
};

/**
 * Calculate federal income tax using graduated brackets
 * @param {number} annualIncome - Annual gross income
 * @returns {number} Federal tax amount
 */
function calculateFederalTax(annualIncome) {
    if (annualIncome <= 0) return 0;
    
    let tax = 0;
    let remainingIncome = annualIncome;
    
    for (const bracket of FEDERAL_TAX_BRACKETS) {
        if (remainingIncome <= 0) break;
        
        const taxableInThisBracket = Math.min(remainingIncome, bracket.max - bracket.min);
        tax += taxableInThisBracket * bracket.rate;
        remainingIncome -= taxableInThisBracket;
    }
    
    return Math.round(tax * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate FICA taxes (Social Security + Medicare)
 * @param {number} annualIncome - Annual gross income
 * @returns {object} Breakdown of FICA taxes
 */
function calculateFICATax(annualIncome) {
    if (annualIncome <= 0) return { socialSecurity: 0, medicare: 0, additionalMedicare: 0, total: 0 };
    
    // Social Security Tax (capped at wage base)
    const socialSecurityWages = Math.min(annualIncome, FICA_RATES.socialSecurity.wageBase);
    const socialSecurity = socialSecurityWages * FICA_RATES.socialSecurity.rate;
    
    // Medicare Tax (no cap)
    const medicare = annualIncome * FICA_RATES.medicare.rate;
    
    // Additional Medicare Tax for high earners
    const additionalMedicare = annualIncome > FICA_RATES.additionalMedicare.threshold
        ? (annualIncome - FICA_RATES.additionalMedicare.threshold) * FICA_RATES.additionalMedicare.rate
        : 0;
    
    const total = socialSecurity + medicare + additionalMedicare;
    
    return {
        socialSecurity: Math.round(socialSecurity * 100) / 100,
        medicare: Math.round(medicare * 100) / 100,
        additionalMedicare: Math.round(additionalMedicare * 100) / 100,
        total: Math.round(total * 100) / 100
    };
}

/**
 * Calculate state income tax
 * @param {number} annualIncome - Annual gross income
 * @param {string} state - State abbreviation (e.g., 'CA', 'TX')
 * @returns {number} State tax amount
 */
function calculateStateTax(annualIncome, state = 'CA') {
    if (annualIncome <= 0) return 0;
    
    const rate = STATE_TAX_RATES[state.toUpperCase()] || 0.05; // Default 5% if state not found
    return Math.round(annualIncome * rate * 100) / 100;
}

/**
 * Validate numeric input with constraints
 * @param {any} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {string} fieldName - Name of field for error messages
 * @returns {number} Validated number
 * @throws {Error} If validation fails
 */
function validateNumericInput(value, min = 0, max = Infinity, fieldName = 'value') {
    if (value === null || value === undefined || value === '') {
        throw new Error(`${fieldName} is required`);
    }
    
    const num = parseFloat(value);
    
    if (isNaN(num)) {
        throw new Error(`${fieldName} must be a valid number`);
    }
    
    if (num < min) {
        throw new Error(`${fieldName} must be at least ${min}`);
    }
    
    if (num > max) {
        throw new Error(`${fieldName} cannot exceed ${max}`);
    }
    
    return num;
}

/**
 * Calculate contract earnings with tax and expense estimates
 * @param {number} hourlyRate - Hourly rate in dollars
 * @param {number} hoursPerWeek - Hours worked per week
 * @param {number} weeksPerYear - Weeks worked per year
 * @param {string} state - State abbreviation for tax calculation
 * @param {number} expenseRate - Expense rate as decimal (default 0.15 = 15%)
 * @returns {object} Complete contract calculation breakdown
 */
function calculateContract(hourlyRate, hoursPerWeek, weeksPerYear, state = 'CA', expenseRate = 0.15) {
    // Validate inputs
    const validatedHourlyRate = validateNumericInput(hourlyRate, 0.01, 10000, 'hourlyRate');
    const validatedHoursPerWeek = validateNumericInput(hoursPerWeek, 1, 80, 'hoursPerWeek');
    const validatedWeeksPerYear = validateNumericInput(weeksPerYear, 1, 52, 'weeksPerYear');
    const validatedExpenseRate = validateNumericInput(expenseRate, 0, 0.5, 'expenseRate');
    
    // Calculate gross amounts
    const grossAnnual = validatedHourlyRate * validatedHoursPerWeek * validatedWeeksPerYear;
    const grossMonthly = grossAnnual / 12;
    const grossWeekly = validatedHourlyRate * validatedHoursPerWeek;
    
    // Calculate taxes
    const federalTax = calculateFederalTax(grossAnnual);
    const stateTax = calculateStateTax(grossAnnual, state);
    const ficaTax = calculateFICATax(grossAnnual);
    const totalTaxes = federalTax + stateTax + ficaTax.total;
    
    // Calculate after-tax amounts
    const afterTaxAnnual = grossAnnual - totalTaxes;
    const afterTaxMonthly = afterTaxAnnual / 12;
    const afterTaxWeekly = afterTaxAnnual / validatedWeeksPerYear;
    
    // Calculate after-expense amounts (business expenses)
    const businessExpenses = afterTaxAnnual * validatedExpenseRate;
    const netAnnual = afterTaxAnnual - businessExpenses;
    const netMonthly = netAnnual / 12;
    const netWeekly = netAnnual / validatedWeeksPerYear;
    
    // Calculate effective rates
    const effectiveTaxRate = grossAnnual > 0 ? (totalTaxes / grossAnnual) : 0;
    const effectiveExpenseRate = afterTaxAnnual > 0 ? (businessExpenses / afterTaxAnnual) : 0;
    const takeHomeRate = grossAnnual > 0 ? (netAnnual / grossAnnual) : 0;
    
    return {
        inputs: {
            hourlyRate: validatedHourlyRate,
            hoursPerWeek: validatedHoursPerWeek,
            weeksPerYear: validatedWeeksPerYear,
            state: state.toUpperCase(),
            expenseRate: validatedExpenseRate
        },
        gross: {
            annual: Math.round(grossAnnual * 100) / 100,
            monthly: Math.round(grossMonthly * 100) / 100,
            weekly: Math.round(grossWeekly * 100) / 100
        },
        taxes: {
            federal: Math.round(federalTax * 100) / 100,
            state: Math.round(stateTax * 100) / 100,
            fica: ficaTax,
            total: Math.round(totalTaxes * 100) / 100
        },
        afterTax: {
            annual: Math.round(afterTaxAnnual * 100) / 100,
            monthly: Math.round(afterTaxMonthly * 100) / 100,
            weekly: Math.round(afterTaxWeekly * 100) / 100
        },
        expenses: {
            businessExpenses: Math.round(businessExpenses * 100) / 100,
            expenseRate: validatedExpenseRate
        },
        net: {
            annual: Math.round(netAnnual * 100) / 100,
            monthly: Math.round(netMonthly * 100) / 100,
            weekly: Math.round(netWeekly * 100) / 100
        },
        rates: {
            effectiveTaxRate: Math.round(effectiveTaxRate * 10000) / 100, // Percentage
            effectiveExpenseRate: Math.round(effectiveExpenseRate * 10000) / 100, // Percentage
            takeHomeRate: Math.round(takeHomeRate * 10000) / 100 // Percentage
        },
        timestamp: new Date().toISOString()
    };
}

/**
 * Calculate paycheck breakdown with all deductions
 * @param {object} paycheckData - Paycheck input data
 * @param {number} paycheckData.regularHours - Regular hours worked
 * @param {number} paycheckData.regularRate - Regular hourly rate
 * @param {number} paycheckData.overtimeHours - Overtime hours worked
 * @param {number} paycheckData.overtimeRate - Overtime hourly rate
 * @param {number} paycheckData.callHours - Call hours worked
 * @param {number} paycheckData.callRate - Call hourly rate
 * @param {number} paycheckData.callbackHours - Callback hours worked
 * @param {number} paycheckData.callbackRate - Callback hourly rate
 * @param {number} paycheckData.housingStipend - Housing stipend amount
 * @param {number} paycheckData.mealStipend - Meal stipend amount
 * @param {number} paycheckData.mileageReimbursement - Mileage reimbursement
 * @param {string} paycheckData.state - State abbreviation for tax calculation
 * @param {string} paycheckData.period - Pay period (weekly, biweekly, monthly, annual)
 * @returns {object} Complete paycheck calculation breakdown
 */
function calculatePaycheck(paycheckData) {
    const {
        regularHours = 0,
        regularRate = 0,
        overtimeHours = 0,
        overtimeRate = 0,
        callHours = 0,
        callRate = 0,
        callbackHours = 0,
        callbackRate = 0,
        housingStipend = 0,
        mealStipend = 0,
        mileageReimbursement = 0,
        state = 'CA',
        period = 'weekly'
    } = paycheckData;

    // Validate all inputs
    const validatedRegularHours = validateNumericInput(regularHours, 0, 168, 'regularHours');
    const validatedRegularRate = validateNumericInput(regularRate, 0, 10000, 'regularRate');
    const validatedOvertimeHours = validateNumericInput(overtimeHours, 0, 80, 'overtimeHours');
    const validatedOvertimeRate = validateNumericInput(overtimeRate, 0, 10000, 'overtimeRate');
    const validatedCallHours = validateNumericInput(callHours, 0, 168, 'callHours');
    const validatedCallRate = validateNumericInput(callRate, 0, 10000, 'callRate');
    const validatedCallbackHours = validateNumericInput(callbackHours, 0, 168, 'callbackHours');
    const validatedCallbackRate = validateNumericInput(callbackRate, 0, 10000, 'callbackRate');
    const validatedHousingStipend = validateNumericInput(housingStipend, 0, 50000, 'housingStipend');
    const validatedMealStipend = validateNumericInput(mealStipend, 0, 10000, 'mealStipend');
    const validatedMileageReimbursement = validateNumericInput(mileageReimbursement, 0, 10000, 'mileageReimbursement');

    // Period multipliers to annualize for tax calculations
    const periodMultipliers = {
        weekly: 52,
        biweekly: 26,
        semimonthly: 24,
        monthly: 12,
        annual: 1
    };
    
    const multiplier = periodMultipliers[period] || 52;

    // Calculate gross pay components
    const regularPay = validatedRegularHours * validatedRegularRate;
    const overtimePay = validatedOvertimeHours * validatedOvertimeRate;
    const callPay = validatedCallHours * validatedCallRate;
    const callbackPay = validatedCallbackHours * validatedCallbackRate;
    
    // Total taxable gross pay
    const totalGrossPay = regularPay + overtimePay + callPay + callbackPay;
    
    // Stipends (non-taxable)
    const totalStipends = validatedHousingStipend + validatedMealStipend + validatedMileageReimbursement;
    
    // Annualize gross pay for tax calculations
    const annualizedGrossPay = totalGrossPay * multiplier;
    
    // Calculate taxes on annualized amount
    const annualFederalTax = calculateFederalTax(annualizedGrossPay);
    const annualStateTax = calculateStateTax(annualizedGrossPay, state);
    const annualFicaTax = calculateFICATax(annualizedGrossPay);
    
    // Convert taxes back to pay period
    const federalTax = annualFederalTax / multiplier;
    const stateTax = annualStateTax / multiplier;
    const ficaTax = {
        socialSecurity: annualFicaTax.socialSecurity / multiplier,
        medicare: annualFicaTax.medicare / multiplier,
        additionalMedicare: annualFicaTax.additionalMedicare / multiplier,
        total: annualFicaTax.total / multiplier
    };
    
    const totalDeductions = federalTax + stateTax + ficaTax.total;
    
    // Calculate net pay (taxable pay minus taxes plus non-taxable stipends)
    const netPay = totalGrossPay - totalDeductions + totalStipends;
    
    // Calculate effective tax rate
    const effectiveTaxRate = totalGrossPay > 0 ? (totalDeductions / totalGrossPay) : 0;
    
    return {
        inputs: {
            regularHours: validatedRegularHours,
            regularRate: validatedRegularRate,
            overtimeHours: validatedOvertimeHours,
            overtimeRate: validatedOvertimeRate,
            callHours: validatedCallHours,
            callRate: validatedCallRate,
            callbackHours: validatedCallbackHours,
            callbackRate: validatedCallbackRate,
            housingStipend: validatedHousingStipend,
            mealStipend: validatedMealStipend,
            mileageReimbursement: validatedMileageReimbursement,
            state: state.toUpperCase(),
            period: period
        },
        earnings: {
            regularPay: Math.round(regularPay * 100) / 100,
            overtimePay: Math.round(overtimePay * 100) / 100,
            callPay: Math.round(callPay * 100) / 100,
            callbackPay: Math.round(callbackPay * 100) / 100,
            totalGrossPay: Math.round(totalGrossPay * 100) / 100
        },
        stipends: {
            housingStipend: Math.round(validatedHousingStipend * 100) / 100,
            mealStipend: Math.round(validatedMealStipend * 100) / 100,
            mileageReimbursement: Math.round(validatedMileageReimbursement * 100) / 100,
            totalStipends: Math.round(totalStipends * 100) / 100
        },
        deductions: {
            federalTax: Math.round(federalTax * 100) / 100,
            stateTax: Math.round(stateTax * 100) / 100,
            fica: {
                socialSecurity: Math.round(ficaTax.socialSecurity * 100) / 100,
                medicare: Math.round(ficaTax.medicare * 100) / 100,
                additionalMedicare: Math.round(ficaTax.additionalMedicare * 100) / 100,
                total: Math.round(ficaTax.total * 100) / 100
            },
            totalDeductions: Math.round(totalDeductions * 100) / 100
        },
        summary: {
            totalGrossPayIncludingStipends: Math.round((totalGrossPay + totalStipends) * 100) / 100,
            netPay: Math.round(netPay * 100) / 100,
            effectiveTaxRate: Math.round(effectiveTaxRate * 10000) / 100, // Percentage
            takeHomeRate: Math.round((netPay / (totalGrossPay + totalStipends)) * 10000) / 100 // Percentage
        },
        annualized: {
            grossPay: Math.round(annualizedGrossPay * 100) / 100,
            netPay: Math.round(netPay * multiplier * 100) / 100,
            totalDeductions: Math.round(totalDeductions * multiplier * 100) / 100
        },
        timestamp: new Date().toISOString()
    };
}

/**
 * Simple paycheck calculation for basic use cases
 * @param {number} grossPay - Gross pay amount
 * @param {number} additionalDeductions - Additional deductions
 * @param {string} state - State abbreviation
 * @param {string} period - Pay period
 * @returns {object} Basic paycheck calculation
 */
function calculateSimplePaycheck(grossPay, additionalDeductions = 0, state = 'CA', period = 'weekly') {
    const validatedGrossPay = validateNumericInput(grossPay, 0, 1000000, 'grossPay');
    const validatedDeductions = validateNumericInput(additionalDeductions, 0, validatedGrossPay, 'additionalDeductions');
    
    const periodMultipliers = {
        weekly: 52,
        biweekly: 26,
        semimonthly: 24,
        monthly: 12,
        annual: 1
    };
    
    const multiplier = periodMultipliers[period] || 52;
    const annualizedGrossPay = validatedGrossPay * multiplier;
    
    // Calculate taxes
    const annualFederalTax = calculateFederalTax(annualizedGrossPay);
    const annualStateTax = calculateStateTax(annualizedGrossPay, state);
    const annualFicaTax = calculateFICATax(annualizedGrossPay);
    
    // Convert to pay period
    const federalTax = annualFederalTax / multiplier;
    const stateTax = annualStateTax / multiplier;
    const ficaTax = annualFicaTax.total / multiplier;
    
    const totalTaxes = federalTax + stateTax + ficaTax;
    const totalDeductions = totalTaxes + validatedDeductions;
    const netPay = validatedGrossPay - totalDeductions;
    
    return {
        grossPay: Math.round(validatedGrossPay * 100) / 100,
        deductions: {
            federalTax: Math.round(federalTax * 100) / 100,
            stateTax: Math.round(stateTax * 100) / 100,
            ficaTax: Math.round(ficaTax * 100) / 100,
            additionalDeductions: Math.round(validatedDeductions * 100) / 100,
            totalDeductions: Math.round(totalDeductions * 100) / 100
        },
        netPay: Math.round(netPay * 100) / 100,
        effectiveTaxRate: Math.round((totalTaxes / validatedGrossPay) * 10000) / 100,
        period: period,
        state: state.toUpperCase(),
        timestamp: new Date().toISOString()
    };
}

module.exports = {
    calculateFederalTax,
    calculateFICATax,
    calculateStateTax,
    validateNumericInput,
    calculateContract,
    calculatePaycheck,
    calculateSimplePaycheck,
    FEDERAL_TAX_BRACKETS,
    FICA_RATES,
    STATE_TAX_RATES
};