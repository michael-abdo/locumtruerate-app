/**
 * Calculator Endpoints
 * 
 * Provides tax and payroll calculation services for locum tenens professionals.
 * Includes contract calculation and comprehensive paycheck breakdown.
 */

const express = require('express');
const router = express.Router();
const { calculatorSchemas, validateWithSchema } = require('../validation/schemas');
const { calculateContract, calculatePaycheck, calculateSimplePaycheck } = require('../utils/calculations');
const { createSuccessResponse, createErrorResponse } = require('../utils/responses');

/**
 * POST /api/v1/calculate/contract
 * Calculate contract earnings with tax estimates
 * 
 * @route POST /api/v1/calculate/contract
 * @access Public
 * @param {number} hourlyRate - Hourly rate in dollars
 * @param {number} hoursPerWeek - Hours worked per week
 * @param {number} weeksPerYear - Weeks worked per year
 * @param {string} [state=CA] - State abbreviation for tax calculation
 * @param {number} [expenseRate=0.15] - Business expense rate (0-0.5)
 * @returns {object} Complete contract calculation breakdown
 */
router.post('/contract', async (req, res, next) => {
    try {
        // Validate input
        const validation = validateWithSchema(req.body, calculatorSchemas.contract);
        if (!validation.isValid) {
            return createErrorResponse(res, 400, validation.error, 'validation_error');
        }

        const validatedData = validation.value;
        
        // Perform calculation
        const result = calculateContract(
            validatedData.hourlyRate,
            validatedData.hoursPerWeek,
            validatedData.weeksPerYear,
            validatedData.state,
            validatedData.expenseRate
        );

        // Add metadata
        const response = {
            ...result,
            metadata: {
                calculationType: 'contract',
                disclaimer: 'This is an estimate for planning purposes only. Actual taxes may vary based on individual circumstances, deductions, and tax law changes.',
                taxYear: new Date().getFullYear(),
                calculatedAt: result.timestamp
            }
        };

        return createSuccessResponse(res, 200, response, 'Contract calculation completed');
        
    } catch (error) {
        console.error('Contract calculation error:', error.message);
        next(error);
    }
});

/**
 * POST /api/v1/calculate/paycheck
 * Calculate comprehensive paycheck breakdown with all deductions
 * 
 * @route POST /api/v1/calculate/paycheck
 * @access Public
 * @param {object} paycheckData - Paycheck calculation inputs
 * @returns {object} Complete paycheck calculation breakdown
 */
router.post('/paycheck', async (req, res, next) => {
    try {
        // Validate input
        const validation = validateWithSchema(req.body, calculatorSchemas.paycheck);
        if (!validation.isValid) {
            return createErrorResponse(res, 400, validation.error, 'validation_error');
        }

        const validatedData = validation.value;
        
        // Perform calculation
        const result = calculatePaycheck(validatedData);

        // Add metadata
        const response = {
            ...result,
            metadata: {
                calculationType: 'paycheck',
                disclaimer: 'This is an estimate for planning purposes only. Actual taxes may vary based on individual circumstances, deductions, filing status, and tax law changes.',
                taxYear: new Date().getFullYear(),
                calculatedAt: result.timestamp,
                notes: {
                    stipends: 'Stipends are treated as non-taxable reimbursements',
                    fica: 'FICA calculations include Social Security (6.2%) and Medicare (1.45%) taxes',
                    additionalMedicare: 'Additional Medicare tax (0.9%) applies to income over $200,000'
                }
            }
        };

        return createSuccessResponse(res, 200, response, 'Paycheck calculation completed');
        
    } catch (error) {
        console.error('Paycheck calculation error:', error.message);
        next(error);
    }
});

/**
 * POST /api/v1/calculate/simple-paycheck
 * Calculate basic paycheck with simple inputs
 * 
 * @route POST /api/v1/calculate/simple-paycheck
 * @access Public
 * @param {number} grossPay - Gross pay amount
 * @param {number} [additionalDeductions=0] - Additional deductions
 * @param {string} [state=CA] - State abbreviation
 * @param {string} [period=weekly] - Pay period
 * @returns {object} Basic paycheck calculation
 */
router.post('/simple-paycheck', async (req, res, next) => {
    try {
        // Validate input
        const validation = validateWithSchema(req.body, calculatorSchemas.simplePaycheck);
        if (!validation.isValid) {
            return createErrorResponse(res, 400, validation.error, 'validation_error');
        }

        const { grossPay, additionalDeductions, state, period } = validation.value;
        
        // Perform calculation
        const result = calculateSimplePaycheck(grossPay, additionalDeductions, state, period);

        // Add metadata
        const response = {
            ...result,
            metadata: {
                calculationType: 'simple-paycheck',
                disclaimer: 'This is a simplified estimate for planning purposes only. Actual taxes may vary.',
                taxYear: new Date().getFullYear(),
                calculatedAt: result.timestamp
            }
        };

        return createSuccessResponse(res, 200, response, 'Simple paycheck calculation completed');
        
    } catch (error) {
        console.error('Simple paycheck calculation error:', error.message);
        next(error);
    }
});

/**
 * GET /api/v1/calculate/tax-info
 * Get tax rate information for reference
 * 
 * @route GET /api/v1/calculate/tax-info
 * @access Public
 * @returns {object} Tax bracket and rate information
 */
router.get('/tax-info', (req, res) => {
    const { FEDERAL_TAX_BRACKETS, FICA_RATES, STATE_TAX_RATES } = require('../utils/calculations');
    
    const response = {
        federalTaxBrackets: FEDERAL_TAX_BRACKETS,
        ficaRates: FICA_RATES,
        stateTaxRates: STATE_TAX_RATES,
        taxYear: new Date().getFullYear(),
        disclaimer: 'Tax rates are subject to change. Consult a tax professional for specific advice.',
        lastUpdated: new Date().toISOString()
    };

    return createSuccessResponse(res, 200, response, 'Tax information retrieved');
});

/**
 * GET /api/v1/calculate/states
 * Get list of supported states with tax rates
 * 
 * @route GET /api/v1/calculate/states
 * @access Public
 * @returns {object} List of states with tax information
 */
router.get('/states', (req, res) => {
    const { STATE_TAX_RATES } = require('../utils/calculations');
    
    const statesList = Object.entries(STATE_TAX_RATES).map(([code, rate]) => ({
        code,
        rate,
        percentage: `${(rate * 100).toFixed(1)}%`
    })).sort((a, b) => a.code.localeCompare(b.code));

    const response = {
        states: statesList,
        count: statesList.length,
        notes: {
            zeroRate: 'States with 0% rate have no state income tax',
            approximation: 'Rates are approximations for estimation purposes',
            actualRates: 'Actual rates may vary based on income level and deductions'
        },
        lastUpdated: new Date().toISOString()
    };

    return createSuccessResponse(res, 200, response, 'States list retrieved');
});

module.exports = router;