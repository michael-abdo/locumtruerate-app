import { Decimal } from 'decimal.js';
import { USState, FilingStatus } from '../types';

// 2024 Tax Tables and Constants
const FEDERAL_TAX_BRACKETS_2024 = {
  SINGLE: [
    { min: 0, max: 11000, rate: 0.10 },
    { min: 11000, max: 44725, rate: 0.12 },
    { min: 44725, max: 95375, rate: 0.22 },
    { min: 95375, max: 182050, rate: 0.24 },
    { min: 182050, max: 231250, rate: 0.32 },
    { min: 231250, max: 578125, rate: 0.35 },
    { min: 578125, max: Infinity, rate: 0.37 }
  ],
  MARRIED_FILING_JOINTLY: [
    { min: 0, max: 22000, rate: 0.10 },
    { min: 22000, max: 89450, rate: 0.12 },
    { min: 89450, max: 190750, rate: 0.22 },
    { min: 190750, max: 364200, rate: 0.24 },
    { min: 364200, max: 462500, rate: 0.32 },
    { min: 462500, max: 693750, rate: 0.35 },
    { min: 693750, max: Infinity, rate: 0.37 }
  ],
  MARRIED_FILING_SEPARATELY: [
    { min: 0, max: 11000, rate: 0.10 },
    { min: 11000, max: 44725, rate: 0.12 },
    { min: 44725, max: 95375, rate: 0.22 },
    { min: 95375, max: 182050, rate: 0.24 },
    { min: 182050, max: 231250, rate: 0.32 },
    { min: 231250, max: 346875, rate: 0.35 },
    { min: 346875, max: Infinity, rate: 0.37 }
  ],
  HEAD_OF_HOUSEHOLD: [
    { min: 0, max: 15700, rate: 0.10 },
    { min: 15700, max: 59850, rate: 0.12 },
    { min: 59850, max: 95350, rate: 0.22 },
    { min: 95350, max: 182050, rate: 0.24 },
    { min: 182050, max: 231250, rate: 0.32 },
    { min: 231250, max: 578100, rate: 0.35 },
    { min: 578100, max: Infinity, rate: 0.37 }
  ],
  QUALIFYING_WIDOW: [
    { min: 0, max: 22000, rate: 0.10 },
    { min: 22000, max: 89450, rate: 0.12 },
    { min: 89450, max: 190750, rate: 0.22 },
    { min: 190750, max: 364200, rate: 0.24 },
    { min: 364200, max: 462500, rate: 0.32 },
    { min: 462500, max: 693750, rate: 0.35 },
    { min: 693750, max: Infinity, rate: 0.37 }
  ]
};

const SOCIAL_SECURITY_RATE = 0.062;
const MEDICARE_RATE = 0.0145;
const ADDITIONAL_MEDICARE_RATE = 0.009; // For income over $200k (single) / $250k (married)
const SOCIAL_SECURITY_WAGE_BASE_2024 = 160200;

// State tax rates (simplified - in production would use comprehensive state tax tables)
const STATE_TAX_RATES: Record<USState, number> = {
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

// State disability insurance rates (where applicable)
const STATE_DISABILITY_RATES: Record<string, { rate: number; wageBase: number }> = {
  'CA': { rate: 0.009, wageBase: 153164 },
  'HI': { rate: 0.005, wageBase: 57000 },
  'NJ': { rate: 0.0047, wageBase: 151900 },
  'NY': { rate: 0.005, wageBase: 142800 },
  'RI': { rate: 0.013, wageBase: 84000 }
};

interface TaxCalculationInput {
  grossIncome: Decimal;
  state: USState;
  filingStatus: FilingStatus;
  exemptions: number;
  isResident: boolean;
  additionalWithholding?: Decimal;
}

interface TaxCalculationResult {
  federal: Decimal;
  state: Decimal;
  socialSecurity: Decimal;
  medicare: Decimal;
  stateDisability: Decimal;
  unemployment: Decimal;
  total: Decimal;
  effectiveRate: Decimal;
  marginalRate: Decimal;
}

export class TaxCalculator {
  
  /**
   * Calculate annual taxes for given income and parameters
   */
  async calculateAnnualTaxes(input: TaxCalculationInput): Promise<TaxCalculationResult> {
    const { grossIncome, state, filingStatus, exemptions, isResident, additionalWithholding } = input;
    
    // Calculate standard deduction (2024 values)
    const standardDeduction = this.getStandardDeduction(filingStatus);
    
    // Calculate taxable income
    const exemptionAmount = new Decimal(exemptions).mul(4700); // 2024 exemption amount
    const taxableIncome = Decimal.max(0, grossIncome.minus(standardDeduction).minus(exemptionAmount));
    
    // Calculate federal income tax
    const federal = this.calculateFederalTax(taxableIncome, filingStatus);
    
    // Calculate state income tax
    const stateTax = isResident ? this.calculateStateTax(taxableIncome, state, filingStatus) : new Decimal(0);
    
    // Calculate FICA taxes
    const socialSecurity = this.calculateSocialSecurityTax(grossIncome);
    const medicare = this.calculateMedicareTax(grossIncome, filingStatus);
    
    // Calculate state disability insurance (where applicable)
    const stateDisability = this.calculateStateDisabilityTax(grossIncome, state);
    
    // Calculate unemployment tax (typically employer paid, but included for completeness)
    const unemployment = new Decimal(0); // FUTA is employer responsibility
    
    // Add additional withholding
    const additionalFederal = additionalWithholding || new Decimal(0);
    
    const totalTaxes = federal.add(stateTax).add(socialSecurity).add(medicare)
      .add(stateDisability).add(unemployment).add(additionalFederal);
    
    const effectiveRate = totalTaxes.div(grossIncome).mul(100);
    const marginalRate = this.calculateMarginalRate(taxableIncome, filingStatus, state);
    
    return {
      federal: federal.add(additionalFederal),
      state: stateTax,
      socialSecurity,
      medicare,
      stateDisability,
      unemployment,
      total: totalTaxes,
      effectiveRate,
      marginalRate
    };
  }

  /**
   * Calculate federal income tax using progressive brackets
   */
  private calculateFederalTax(taxableIncome: Decimal, filingStatus: FilingStatus): Decimal {
    const brackets = FEDERAL_TAX_BRACKETS_2024[filingStatus];
    let tax = new Decimal(0);
    let remainingIncome = taxableIncome;

    for (const bracket of brackets) {
      if (remainingIncome.lte(0)) break;

      const bracketMin = new Decimal(bracket.min);
      const bracketMax = new Decimal(bracket.max);
      const bracketWidth = bracketMax.minus(bracketMin);
      
      const taxableAtThisBracket = Decimal.min(remainingIncome, bracketWidth);
      const taxAtThisBracket = taxableAtThisBracket.mul(bracket.rate);
      
      tax = tax.add(taxAtThisBracket);
      remainingIncome = remainingIncome.minus(taxableAtThisBracket);
    }

    return tax;
  }

  /**
   * Calculate state income tax (simplified)
   */
  private calculateStateTax(taxableIncome: Decimal, state: USState, filingStatus: FilingStatus): Decimal {
    const stateRate = STATE_TAX_RATES[state];
    
    if (stateRate === 0) {
      return new Decimal(0);
    }

    // Simplified calculation - in production would use state-specific brackets and deductions
    const stateStandardDeduction = this.getStateStandardDeduction(state, filingStatus);
    const stateTaxableIncome = Decimal.max(0, taxableIncome.minus(stateStandardDeduction));
    
    return stateTaxableIncome.mul(stateRate);
  }

  /**
   * Calculate Social Security tax
   */
  private calculateSocialSecurityTax(grossIncome: Decimal): Decimal {
    const wageBase = new Decimal(SOCIAL_SECURITY_WAGE_BASE_2024);
    const taxableWages = Decimal.min(grossIncome, wageBase);
    return taxableWages.mul(SOCIAL_SECURITY_RATE);
  }

  /**
   * Calculate Medicare tax (including additional Medicare tax)
   */
  private calculateMedicareTax(grossIncome: Decimal, filingStatus: FilingStatus): Decimal {
    // Regular Medicare tax (no wage base limit)
    const regularMedicare = grossIncome.mul(MEDICARE_RATE);
    
    // Additional Medicare tax for high earners
    const additionalMedicareThreshold = this.getAdditionalMedicareThreshold(filingStatus);
    const additionalMedicareTax = grossIncome.gt(additionalMedicareThreshold) 
      ? grossIncome.minus(additionalMedicareThreshold).mul(ADDITIONAL_MEDICARE_RATE)
      : new Decimal(0);
    
    return regularMedicare.add(additionalMedicareTax);
  }

  /**
   * Calculate state disability insurance tax
   */
  private calculateStateDisabilityTax(grossIncome: Decimal, state: USState): Decimal {
    const disabilityInfo = STATE_DISABILITY_RATES[state];
    
    if (!disabilityInfo) {
      return new Decimal(0);
    }

    const taxableWages = Decimal.min(grossIncome, new Decimal(disabilityInfo.wageBase));
    return taxableWages.mul(disabilityInfo.rate);
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
   * Get state standard deduction (simplified)
   */
  private getStateStandardDeduction(state: USState, filingStatus: FilingStatus): Decimal {
    // Simplified - states have varying standard deductions
    const federalDeduction = this.getStandardDeduction(filingStatus);
    
    // Most states use a percentage of federal or have their own amounts
    // This is a simplified calculation
    return federalDeduction.mul(0.7); // Approximate 70% of federal
  }

  /**
   * Get Additional Medicare tax threshold
   */
  private getAdditionalMedicareThreshold(filingStatus: FilingStatus): Decimal {
    const thresholds = {
      'SINGLE': 200000,
      'MARRIED_FILING_JOINTLY': 250000,
      'MARRIED_FILING_SEPARATELY': 125000,
      'HEAD_OF_HOUSEHOLD': 200000,
      'QUALIFYING_WIDOW': 250000
    };
    
    return new Decimal(thresholds[filingStatus]);
  }

  /**
   * Calculate marginal tax rate
   */
  private calculateMarginalRate(taxableIncome: Decimal, filingStatus: FilingStatus, state: USState): Decimal {
    // Find federal marginal rate
    const federalBrackets = FEDERAL_TAX_BRACKETS_2024[filingStatus];
    let federalMarginalRate = 0;
    
    for (const bracket of federalBrackets) {
      if (taxableIncome.gt(bracket.min)) {
        federalMarginalRate = bracket.rate;
      } else {
        break;
      }
    }
    
    // Add state marginal rate
    const stateMarginalRate = STATE_TAX_RATES[state];
    
    // Add FICA rates (if applicable)
    const ficaRate = taxableIncome.lt(SOCIAL_SECURITY_WAGE_BASE_2024) 
      ? SOCIAL_SECURITY_RATE + MEDICARE_RATE 
      : MEDICARE_RATE;
    
    const totalMarginalRate = federalMarginalRate + stateMarginalRate + ficaRate;
    
    return new Decimal(totalMarginalRate).mul(100);
  }

  /**
   * Calculate quarterly estimated tax payments
   */
  calculateEstimatedTaxPayments(annualTax: Decimal, priorYearTax: Decimal): {
    quarterlyPayment: Decimal;
    safeHarborPayment: Decimal;
    recommendedPayment: Decimal;
  } {
    const quarterlyPayment = annualTax.div(4);
    
    // Safe harbor: 100% of prior year tax (110% if AGI > $150k)
    const safeHarborPercentage = priorYearTax.gt(150000) ? 1.10 : 1.00;
    const safeHarborPayment = priorYearTax.mul(safeHarborPercentage).div(4);
    
    // Recommend the higher of quarterly payment or safe harbor
    const recommendedPayment = Decimal.max(quarterlyPayment, safeHarborPayment);
    
    return {
      quarterlyPayment,
      safeHarborPayment,
      recommendedPayment
    };
  }

  /**
   * Calculate tax savings from deductions
   */
  calculateDeductionSavings(deductionAmount: Decimal, marginalRate: Decimal): Decimal {
    return deductionAmount.mul(marginalRate.div(100));
  }
}