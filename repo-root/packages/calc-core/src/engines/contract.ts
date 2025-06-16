import { Decimal } from 'decimal.js';
import { addDays, differenceInWeeks, isAfter, isBefore } from 'date-fns';
import {
  ContractInput,
  ContractCalculationResult,
  PayFrequency,
  USState,
  ContractInputSchema
} from '../types';
import { TaxCalculator } from './tax-calculator';
import { LocationDataProvider } from './location-data';

export class ContractCalculationEngine {
  private taxCalculator: TaxCalculator;
  private locationData: LocationDataProvider;

  constructor() {
    this.taxCalculator = new TaxCalculator();
    this.locationData = new LocationDataProvider();
  }

  /**
   * Calculate comprehensive contract financial analysis
   */
  async calculateContract(input: ContractInput): Promise<ContractCalculationResult> {
    // Validate input
    const validatedInput = ContractInputSchema.parse(input);
    
    // Calculate base compensation components
    const basePay = this.calculateBasePay(validatedInput);
    const overtimePay = this.calculateOvertimePay(validatedInput);
    const bonuses = this.calculateBonuses(validatedInput);
    const stipends = this.calculateStipends(validatedInput);
    const deductions = this.calculateDeductions(validatedInput);
    
    // Calculate gross annual pay
    const grossAnnualPay = basePay.add(overtimePay).add(bonuses).add(stipends.total);
    
    // Calculate taxes
    const taxes = await this.calculateTaxes(validatedInput, grossAnnualPay, deductions.total);
    
    // Calculate net pay
    const netAnnualPay = grossAnnualPay.minus(deductions.total).minus(taxes.total);
    
    // Calculate metrics
    const metrics = this.calculateMetrics(
      validatedInput,
      grossAnnualPay,
      netAnnualPay,
      taxes.total,
      stipends.total
    );
    
    // Calculate pay period information
    const payPeriods = this.calculatePayPeriods(grossAnnualPay, netAnnualPay);
    
    return {
      contract: validatedInput,
      calculationDate: new Date(),
      totals: {
        grossAnnualPay,
        netAnnualPay,
        totalStipends: stipends.total,
        totalDeductions: deductions.total,
        totalTaxes: taxes.total,
        effectiveHourlyRate: this.calculateEffectiveHourlyRate(netAnnualPay, validatedInput),
        annualizedHourlyRate: new Decimal(validatedInput.hourlyRate).mul(validatedInput.hoursPerWeek).mul(52)
      },
      breakdown: {
        basePay,
        overtimePay,
        bonuses,
        stipends,
        deductions,
        taxes
      },
      payPeriods,
      metrics
    };
  }

  /**
   * Calculate base pay (regular hours only)
   */
  private calculateBasePay(contract: ContractInput): Decimal {
    const { hourlyRate, hoursPerWeek, duration, overtimeThreshold } = contract;
    
    const regularHoursPerWeek = Math.min(hoursPerWeek, overtimeThreshold);
    const weeklyBasePay = new Decimal(hourlyRate).mul(regularHoursPerWeek);
    const weeksInContract = duration; // Assuming duration is in weeks
    
    return weeklyBasePay.mul(weeksInContract);
  }

  /**
   * Calculate overtime pay
   */
  private calculateOvertimePay(contract: ContractInput): Decimal {
    const { 
      hourlyRate, 
      hoursPerWeek, 
      duration, 
      overtimeThreshold, 
      overtimeRate 
    } = contract;
    
    if (hoursPerWeek <= overtimeThreshold) {
      return new Decimal(0);
    }
    
    const overtimeHoursPerWeek = hoursPerWeek - overtimeThreshold;
    const effectiveOvertimeRate = overtimeRate || (hourlyRate * 1.5);
    const weeklyOvertimePay = new Decimal(effectiveOvertimeRate).mul(overtimeHoursPerWeek);
    
    return weeklyOvertimePay.mul(duration);
  }

  /**
   * Calculate total bonuses
   */
  private calculateBonuses(contract: ContractInput): Decimal {
    return contract.bonuses.reduce((total, bonus) => {
      return total.add(new Decimal(bonus.amount));
    }, new Decimal(0));
  }

  /**
   * Calculate stipends breakdown
   */
  private calculateStipends(contract: ContractInput) {
    const { stipends, duration } = contract;
    
    // Convert weekly stipends to total contract value
    const housing = new Decimal(stipends.housing || 0).mul(duration);
    const travel = new Decimal(stipends.travel || 0);
    const meals = new Decimal(stipends.meals || 0).mul(duration);
    const licensure = new Decimal(stipends.licensure || 0);
    const malpractice = new Decimal(stipends.malpractice || 0);
    const cme = new Decimal(stipends.cme || 0);
    const other = new Decimal(stipends.other || 0);
    
    const total = housing.add(travel).add(meals).add(licensure).add(malpractice).add(cme).add(other);
    
    return {
      housing,
      travel,
      meals,
      licensure,
      malpractice,
      cme,
      other,
      total
    };
  }

  /**
   * Calculate deductions breakdown
   */
  private calculateDeductions(contract: ContractInput) {
    const { deductions, duration, hourlyRate, hoursPerWeek } = contract;
    
    // Calculate 401k deduction if percentage is specified
    let retirement401k = new Decimal(deductions.retirement401k || 0).mul(duration);
    if (deductions.retirement401kPercent) {
      const grossWeeklyPay = new Decimal(hourlyRate).mul(hoursPerWeek);
      const grossContractPay = grossWeeklyPay.mul(duration);
      const percentageDeduction = grossContractPay.mul(deductions.retirement401kPercent).div(100);
      retirement401k = Decimal.max(retirement401k, percentageDeduction);
    }
    
    const healthInsurance = new Decimal(deductions.healthInsurance || 0).mul(duration);
    const dentalInsurance = new Decimal(deductions.dentalInsurance || 0).mul(duration);
    const visionInsurance = new Decimal(deductions.visionInsurance || 0).mul(duration);
    const professionalFees = new Decimal(deductions.professionalFees || 0);
    const parking = new Decimal(deductions.parking || 0).mul(duration);
    const other = new Decimal(deductions.other || 0);
    
    const total = healthInsurance.add(dentalInsurance).add(visionInsurance)
      .add(retirement401k).add(professionalFees).add(parking).add(other);
    
    return {
      healthInsurance,
      dentalInsurance,
      visionInsurance,
      retirement401k,
      professionalFees,
      parking,
      other,
      total
    };
  }

  /**
   * Calculate taxes using TaxCalculator
   */
  private async calculateTaxes(
    contract: ContractInput, 
    grossPay: Decimal, 
    deductions: Decimal
  ) {
    const taxableIncome = grossPay.minus(deductions);
    
    const taxes = await this.taxCalculator.calculateAnnualTaxes({
      grossIncome: taxableIncome,
      state: contract.location.state,
      filingStatus: contract.taxInfo.filingStatus,
      exemptions: contract.taxInfo.federalExemptions,
      isResident: contract.taxInfo.isResident
    });
    
    return taxes;
  }

  /**
   * Calculate effective hourly rate based on net pay
   */
  private calculateEffectiveHourlyRate(netPay: Decimal, contract: ContractInput): Decimal {
    const totalHours = new Decimal(contract.hoursPerWeek).mul(contract.duration);
    return netPay.div(totalHours);
  }

  /**
   * Calculate pay period information
   */
  private calculatePayPeriods(grossAnnualPay: Decimal, netAnnualPay: Decimal) {
    const frequency: PayFrequency = 'BI_WEEKLY'; // Default for most locum contracts
    const periodsPerYear = this.getPeriodsPerYear(frequency);
    
    return {
      frequency,
      grossPerPeriod: grossAnnualPay.div(periodsPerYear),
      netPerPeriod: netAnnualPay.div(periodsPerYear),
      periodsPerYear
    };
  }

  /**
   * Get number of pay periods per year for given frequency
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
   * Calculate financial metrics and ratios
   */
  private calculateMetrics(
    contract: ContractInput,
    grossPay: Decimal,
    netPay: Decimal,
    totalTaxes: Decimal,
    totalStipends: Decimal
  ) {
    const taxRate = totalTaxes.div(grossPay).mul(100);
    const takeHomePercentage = netPay.div(grossPay).mul(100);
    const housingStipendPercentage = new Decimal(contract.stipends.housing || 0)
      .mul(contract.duration).div(grossPay).mul(100);
    
    // Calculate benefits value (non-taxable stipends + employer contributions)
    const benefitsValue = totalStipends.add(new Decimal(contract.stipends.malpractice || 0));
    
    return {
      taxRate,
      takeHomePercentage,
      housingStipendPercentage,
      benefitsValue
    };
  }

  /**
   * Calculate contract duration in weeks
   */
  static calculateDurationInWeeks(startDate: Date, endDate: Date): number {
    if (isAfter(startDate, endDate)) {
      throw new Error('Start date must be before end date');
    }
    
    return differenceInWeeks(endDate, startDate) + 1; // Include both start and end weeks
  }

  /**
   * Validate contract dates
   */
  static validateContractDates(startDate: Date, endDate: Date): boolean {
    const now = new Date();
    return isBefore(startDate, endDate) && !isBefore(endDate, now);
  }

  /**
   * Calculate pro-rated amounts for partial periods
   */
  static calculateProRatedAmount(
    amount: Decimal, 
    totalDays: number, 
    actualDays: number
  ): Decimal {
    return amount.mul(actualDays).div(totalDays);
  }
}