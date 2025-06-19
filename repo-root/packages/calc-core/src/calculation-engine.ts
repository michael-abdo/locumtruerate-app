/**
 * Mock Calculation Engine for performance testing
 */

import { Decimal } from 'decimal.js';
import { ContractInput, ContractCalculationResult } from './types';

export class CalculationEngine {
  async calculateContract(input: ContractInput): Promise<ContractCalculationResult> {
    // Mock calculation - just return a simple result
    const hourlyRate = new Decimal(input.hourlyRate);
    const hoursPerWeek = new Decimal(input.hoursPerWeek);
    const weeksPerYear = new Decimal(52);
    
    const grossAnnualPay = hourlyRate.mul(hoursPerWeek).mul(weeksPerYear);
    const totalTaxes = grossAnnualPay.mul(0.3); // Assume 30% tax rate
    const netAnnualPay = grossAnnualPay.sub(totalTaxes);
    
    return {
      contract: input,
      calculationDate: new Date(),
      totals: {
        grossAnnualPay,
        netAnnualPay,
        totalStipends: new Decimal(0),
        totalDeductions: new Decimal(0),
        totalTaxes,
        effectiveHourlyRate: hourlyRate,
        annualizedHourlyRate: hourlyRate
      },
      breakdown: {
        basePay: grossAnnualPay,
        overtimePay: new Decimal(0),
        bonuses: new Decimal(0),
        stipends: {
          housing: new Decimal(0),
          travel: new Decimal(0),
          meals: new Decimal(0),
          licensure: new Decimal(0),
          malpractice: new Decimal(0),
          cme: new Decimal(0),
          other: new Decimal(0),
          total: new Decimal(0)
        },
        deductions: {
          healthInsurance: new Decimal(0),
          dentalInsurance: new Decimal(0),
          visionInsurance: new Decimal(0),
          retirement401k: new Decimal(0),
          professionalFees: new Decimal(0),
          parking: new Decimal(0),
          other: new Decimal(0),
          total: new Decimal(0)
        },
        taxes: {
          federal: totalTaxes.mul(0.6),
          state: totalTaxes.mul(0.3),
          socialSecurity: totalTaxes.mul(0.07),
          medicare: totalTaxes.mul(0.03),
          stateDisability: new Decimal(0),
          unemployment: new Decimal(0),
          total: totalTaxes
        }
      },
      payPeriods: {
        frequency: 'BI_WEEKLY',
        grossPerPeriod: grossAnnualPay.div(26),
        netPerPeriod: netAnnualPay.div(26),
        periodsPerYear: 26
      },
      metrics: {
        taxRate: new Decimal(30),
        takeHomePercentage: new Decimal(70),
        housingStipendPercentage: new Decimal(0),
        benefitsValue: new Decimal(0)
      }
    };
  }
}