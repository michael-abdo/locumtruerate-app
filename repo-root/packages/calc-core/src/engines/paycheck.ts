import { Decimal } from 'decimal.js';
import { addWeeks, addMonths, differenceInWeeks, differenceInDays, endOfYear } from 'date-fns';
import {
  PaycheckInput,
  PaycheckCalculationResult,
  PayFrequency,
  FilingStatus,
  USState,
  PaycheckInputSchema
} from '../types';
import { TaxCalculator } from './tax-calculator';

export class PaycheckCalculationEngine {
  private taxCalculator: TaxCalculator;

  constructor() {
    this.taxCalculator = new TaxCalculator();
  }

  /**
   * Calculate comprehensive paycheck analysis
   */
  async calculatePaycheck(input: PaycheckInput): Promise<PaycheckCalculationResult> {
    // Validate input
    const validatedInput = PaycheckInputSchema.parse(input);
    
    const {
      grossPay,
      payFrequency,
      payDate,
      filingStatus,
      exemptions,
      workState,
      residenceState,
      ytdGross,
      ytdFederalTax,
      ytdStateTax,
      ytdSocialSecurity,
      ytdMedicare,
      ytdStateDisability,
      preTaxDeductions,
      rothDeductions,
      afterTaxDeductions,
      additionalFederalWithholding,
      additionalStateWithholding
    } = validatedInput;

    // Calculate taxable income for this paycheck
    const taxableGross = new Decimal(grossPay).minus(preTaxDeductions);
    
    // Calculate federal income tax withholding
    const federalTax = await this.calculateFederalWithholding(
      taxableGross,
      payFrequency,
      filingStatus,
      exemptions,
      new Decimal(ytdGross),
      new Decimal(ytdFederalTax)
    );

    // Calculate state income tax withholding
    const stateTax = await this.calculateStateWithholding(
      taxableGross,
      payFrequency,
      workState,
      residenceState,
      filingStatus,
      new Decimal(ytdGross),
      new Decimal(ytdStateTax)
    );

    // Calculate FICA taxes
    const socialSecurity = this.calculateSocialSecurityWithholding(
      taxableGross,
      new Decimal(ytdGross),
      new Decimal(ytdSocialSecurity)
    );

    const medicare = this.calculateMedicareWithholding(
      taxableGross,
      filingStatus,
      new Decimal(ytdGross),
      new Decimal(ytdMedicare)
    );

    // Calculate state disability insurance
    const stateDisability = this.calculateStateDisabilityWithholding(
      taxableGross,
      workState,
      new Decimal(ytdGross),
      new Decimal(ytdStateDisability)
    );

    // Calculate total taxes
    const totalTaxes = federalTax
      .add(stateTax)
      .add(socialSecurity)
      .add(medicare)
      .add(stateDisability)
      .add(additionalFederalWithholding || 0)
      .add(additionalStateWithholding || 0);

    // Calculate total deductions
    const totalDeductions = new Decimal(preTaxDeductions)
      .add(rothDeductions)
      .add(afterTaxDeductions);

    // Calculate net pay
    const netPay = new Decimal(grossPay).minus(totalTaxes).minus(totalDeductions);

    // Calculate YTD totals
    const newYtdGross = new Decimal(ytdGross).add(grossPay);
    const newYtdTaxes = new Decimal(ytdFederalTax)
      .add(ytdStateTax)
      .add(ytdSocialSecurity)
      .add(ytdMedicare)
      .add(ytdStateDisability)
      .add(totalTaxes);

    const ytdNetPay = newYtdGross.minus(newYtdTaxes).minus(totalDeductions);
    const effectiveTaxRate = newYtdTaxes.div(newYtdGross).mul(100);

    // Calculate annual projections
    const projections = this.calculateAnnualProjections(
      validatedInput,
      new Decimal(grossPay),
      netPay,
      totalTaxes
    );

    return {
      input: validatedInput,
      calculationDate: new Date(),
      currentPay: {
        grossPay: new Decimal(grossPay),
        netPay,
        totalDeductions,
        totalTaxes
      },
      taxes: {
        federal: federalTax.add(additionalFederalWithholding || 0),
        state: stateTax.add(additionalStateWithholding || 0),
        socialSecurity,
        medicare,
        stateDisability,
        effectiveRate: totalTaxes.div(grossPay).mul(100)
      },
      deductions: {
        preTax: new Decimal(preTaxDeductions),
        roth: new Decimal(rothDeductions),
        afterTax: new Decimal(afterTaxDeductions),
        total: totalDeductions
      },
      ytd: {
        grossPay: newYtdGross,
        netPay: ytdNetPay,
        totalTaxes: newYtdTaxes,
        totalDeductions: new Decimal(totalDeductions).mul(this.getPayPeriodsElapsed(payDate, payFrequency)),
        effectiveTaxRate
      },
      projections
    };
  }

  /**
   * Calculate federal income tax withholding using percentage method
   */
  private async calculateFederalWithholding(
    grossPay: Decimal,
    payFrequency: PayFrequency,
    filingStatus: FilingStatus,
    exemptions: number,
    ytdGross: Decimal,
    ytdFederalTax: Decimal
  ): Promise<Decimal> {
    // Convert to annual equivalent for calculation
    const periodsPerYear = this.getPeriodsPerYear(payFrequency);
    const annualizedGross = grossPay.mul(periodsPerYear);
    
    // Calculate standard deduction
    const standardDeduction = this.getStandardDeduction(filingStatus);
    const exemptionAmount = new Decimal(exemptions).mul(4700); // 2024 exemption amount
    
    // Calculate taxable income
    const taxableIncome = Decimal.max(0, annualizedGross.minus(standardDeduction).minus(exemptionAmount));
    
    // Calculate annual tax
    const annualTax = await this.taxCalculator.calculateAnnualTaxes({
      grossIncome: taxableIncome,
      state: 'CA', // Federal calculation only, state doesn't matter here
      filingStatus,
      exemptions,
      isResident: true
    });

    // Calculate withholding for this pay period
    const targetAnnualWithholding = annualTax.federal;
    const targetPeriodWithholding = targetAnnualWithholding.div(periodsPerYear);
    
    // Adjust for year-to-date over/under withholding
    const periodsElapsed = this.getPayPeriodsElapsed(new Date(), payFrequency);
    const expectedYtdWithholding = targetAnnualWithholding.mul(periodsElapsed).div(periodsPerYear);
    const adjustmentNeeded = expectedYtdWithholding.minus(ytdFederalTax);
    
    return Decimal.max(0, targetPeriodWithholding.add(adjustmentNeeded));
  }

  /**
   * Calculate state income tax withholding
   */
  private async calculateStateWithholding(
    grossPay: Decimal,
    payFrequency: PayFrequency,
    workState: USState,
    residenceState: USState,
    filingStatus: FilingStatus,
    ytdGross: Decimal,
    ytdStateTax: Decimal
  ): Promise<Decimal> {
    // No state tax states
    const noStateTaxStates: USState[] = ['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY'];
    
    if (noStateTaxStates.includes(workState) && noStateTaxStates.includes(residenceState)) {
      return new Decimal(0);
    }

    // Use work state for withholding calculation
    const taxState = workState;
    
    // Calculate using simplified percentage method
    const periodsPerYear = this.getPeriodsPerYear(payFrequency);
    const annualizedGross = grossPay.mul(periodsPerYear);
    
    // Get state tax rate (simplified)
    const stateRates: Record<USState, number> = {
      'AL': 0.05, 'AK': 0.00, 'AZ': 0.042, 'AR': 0.056, 'CA': 0.093,
      'CO': 0.044, 'CT': 0.065, 'DE': 0.052, 'FL': 0.00, 'GA': 0.055,
      'HI': 0.081, 'ID': 0.058, 'IL': 0.0475, 'IN': 0.032, 'IA': 0.065,
      'KS': 0.053, 'KY': 0.05, 'LA': 0.045, 'ME': 0.075, 'MD': 0.051,
      'MA': 0.05, 'MI': 0.042, 'MN': 0.078, 'MS': 0.05, 'MO': 0.054,
      'MT': 0.069, 'NE': 0.058, 'NV': 0.00, 'NH': 0.00, 'NJ': 0.089,
      'NM': 0.049, 'NY': 0.082, 'NC': 0.0475, 'ND': 0.029, 'OH': 0.037,
      'OK': 0.05, 'OR': 0.087, 'PA': 0.031, 'RI': 0.0475, 'SC': 0.07,
      'SD': 0.00, 'TN': 0.00, 'TX': 0.00, 'UT': 0.047, 'VT': 0.066,
      'VA': 0.0575, 'WA': 0.00, 'WV': 0.036, 'WI': 0.054, 'WY': 0.00
    };

    const stateRate = stateRates[taxState] || 0;
    
    if (stateRate === 0) {
      return new Decimal(0);
    }

    // Simple proportional calculation
    const federalStandardDeduction = this.getStandardDeduction(filingStatus);
    const stateStandardDeduction = federalStandardDeduction.mul(0.7); // Approximate 70% of federal
    const taxableIncome = Decimal.max(0, annualizedGross.minus(stateStandardDeduction));
    
    const annualStateTax = taxableIncome.mul(stateRate);
    return annualStateTax.div(periodsPerYear);
  }

  /**
   * Calculate Social Security withholding
   */
  private calculateSocialSecurityWithholding(
    grossPay: Decimal,
    ytdGross: Decimal,
    ytdSocialSecurity: Decimal
  ): Decimal {
    const SOCIAL_SECURITY_RATE = 0.062;
    const WAGE_BASE_2024 = 160200;
    
    const newYtdGross = ytdGross.add(grossPay);
    
    if (ytdGross.gte(WAGE_BASE_2024)) {
      return new Decimal(0); // Already hit wage base
    }
    
    if (newYtdGross.lte(WAGE_BASE_2024)) {
      return grossPay.mul(SOCIAL_SECURITY_RATE);
    }
    
    // Partial withholding up to wage base
    const remainingWageBase = new Decimal(WAGE_BASE_2024).minus(ytdGross);
    const taxableAmount = Decimal.min(grossPay, remainingWageBase);
    
    return taxableAmount.mul(SOCIAL_SECURITY_RATE);
  }

  /**
   * Calculate Medicare withholding (including additional Medicare tax)
   */
  private calculateMedicareWithholding(
    grossPay: Decimal,
    filingStatus: FilingStatus,
    ytdGross: Decimal,
    ytdMedicare: Decimal
  ): Decimal {
    const MEDICARE_RATE = 0.0145;
    const ADDITIONAL_MEDICARE_RATE = 0.009;
    
    // Regular Medicare (no wage base limit)
    const regularMedicare = grossPay.mul(MEDICARE_RATE);
    
    // Additional Medicare tax thresholds
    const thresholds = {
      'SINGLE': 200000,
      'MARRIED_FILING_JOINTLY': 250000,
      'MARRIED_FILING_SEPARATELY': 125000,
      'HEAD_OF_HOUSEHOLD': 200000,
      'QUALIFYING_WIDOW': 250000
    };
    
    const threshold = new Decimal(thresholds[filingStatus]);
    const newYtdGross = ytdGross.add(grossPay);
    
    let additionalMedicare = new Decimal(0);
    
    if (ytdGross.gte(threshold)) {
      // Already over threshold
      additionalMedicare = grossPay.mul(ADDITIONAL_MEDICARE_RATE);
    } else if (newYtdGross.gt(threshold)) {
      // Crosses threshold this pay period
      const amountOverThreshold = newYtdGross.minus(threshold);
      additionalMedicare = amountOverThreshold.mul(ADDITIONAL_MEDICARE_RATE);
    }
    
    return regularMedicare.add(additionalMedicare);
  }

  /**
   * Calculate state disability insurance withholding
   */
  private calculateStateDisabilityWithholding(
    grossPay: Decimal,
    state: USState,
    ytdGross: Decimal,
    ytdStateDisability: Decimal
  ): Decimal {
    const stateDisabilityRates: Record<string, { rate: number; wageBase: number }> = {
      'CA': { rate: 0.009, wageBase: 153164 },
      'HI': { rate: 0.005, wageBase: 57000 },
      'NJ': { rate: 0.0047, wageBase: 151900 },
      'NY': { rate: 0.005, wageBase: 142800 },
      'RI': { rate: 0.013, wageBase: 84000 }
    };

    const disabilityInfo = stateDisabilityRates[state];
    
    if (!disabilityInfo) {
      return new Decimal(0);
    }

    const newYtdGross = ytdGross.add(grossPay);
    const wageBase = new Decimal(disabilityInfo.wageBase);
    
    if (ytdGross.gte(wageBase)) {
      return new Decimal(0); // Already hit wage base
    }
    
    if (newYtdGross.lte(wageBase)) {
      return grossPay.mul(disabilityInfo.rate);
    }
    
    // Partial withholding up to wage base
    const remainingWageBase = wageBase.minus(ytdGross);
    const taxableAmount = Decimal.min(grossPay, remainingWageBase);
    
    return taxableAmount.mul(disabilityInfo.rate);
  }

  /**
   * Calculate annual projections based on current paycheck
   */
  private calculateAnnualProjections(
    input: PaycheckInput,
    grossPay: Decimal,
    netPay: Decimal,
    taxes: Decimal
  ) {
    const periodsPerYear = this.getPeriodsPerYear(input.payFrequency);
    const periodsElapsed = this.getPayPeriodsElapsed(input.payDate, input.payFrequency);
    const remainingPaychecks = periodsPerYear - periodsElapsed;
    
    // Project based on current pay period
    const projectedAnnualGross = grossPay.mul(periodsPerYear);
    const projectedAnnualNet = netPay.mul(periodsPerYear);
    const projectedAnnualTaxes = taxes.mul(periodsPerYear);
    
    return {
      annualGross: projectedAnnualGross,
      annualNet: projectedAnnualNet,
      annualTaxes: projectedAnnualTaxes,
      remainingPaychecks
    };
  }

  /**
   * Get standard deduction for filing status
   */
  private getStandardDeduction(filingStatus: FilingStatus): Decimal {
    const deductions = {
      'SINGLE': 14600,
      'MARRIED_FILING_JOINTLY': 29200,
      'MARRIED_FILING_SEPARATELY': 14600,
      'HEAD_OF_HOUSEHOLD': 21900,
      'QUALIFYING_WIDOW': 29200
    };
    
    return new Decimal(deductions[filingStatus]);
  }

  /**
   * Get number of pay periods per year
   */
  private getPeriodsPerYear(frequency: PayFrequency): number {
    switch (frequency) {
      case 'WEEKLY': return 52;
      case 'BI_WEEKLY': return 26;
      case 'SEMI_MONTHLY': return 24;
      case 'MONTHLY': return 12;
      case 'QUARTERLY': return 4;
      case 'ANNUALLY': return 1;
      default: return 26;
    }
  }

  /**
   * Calculate number of pay periods elapsed this year
   */
  private getPayPeriodsElapsed(payDate: Date, frequency: PayFrequency): number {
    const yearStart = new Date(payDate.getFullYear(), 0, 1);
    
    switch (frequency) {
      case 'WEEKLY':
        return Math.floor(differenceInWeeks(payDate, yearStart)) + 1;
      case 'BI_WEEKLY':
        return Math.floor(differenceInWeeks(payDate, yearStart) / 2) + 1;
      case 'SEMI_MONTHLY':
        return (payDate.getMonth() * 2) + (payDate.getDate() > 15 ? 2 : 1);
      case 'MONTHLY':
        return payDate.getMonth() + 1;
      case 'QUARTERLY':
        return Math.floor(payDate.getMonth() / 3) + 1;
      case 'ANNUALLY':
        return 1;
      default:
        return Math.floor(differenceInWeeks(payDate, yearStart) / 2) + 1;
    }
  }

  /**
   * Calculate take-home percentage
   */
  static calculateTakeHomePercentage(grossPay: Decimal, netPay: Decimal): Decimal {
    return netPay.div(grossPay).mul(100);
  }

  /**
   * Calculate effective tax rate
   */
  static calculateEffectiveTaxRate(grossPay: Decimal, totalTaxes: Decimal): Decimal {
    return totalTaxes.div(grossPay).mul(100);
  }

  /**
   * Calculate pay frequency conversion
   */
  static convertPayFrequency(
    amount: Decimal, 
    fromFrequency: PayFrequency, 
    toFrequency: PayFrequency
  ): Decimal {
    const fromPeriods = this.prototype.getPeriodsPerYear(fromFrequency);
    const toPeriods = this.prototype.getPeriodsPerYear(toFrequency);
    
    return amount.mul(fromPeriods).div(toPeriods);
  }
}