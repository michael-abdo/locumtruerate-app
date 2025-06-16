import { z } from 'zod';
import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.config({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -15,
  toExpPos: 20,
  maxE: 9e15,
  minE: -9e15
});

// Location and State Types
export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
] as const;

export type USState = typeof US_STATES[number];

export const ContractTypeSchema = z.enum([
  'LOCUM_TENENS',
  'PERMANENT',
  'CONTRACT_TO_HIRE',
  'TRAVEL_NURSING',
  'CONSULTING'
]);

export const FilingStatusSchema = z.enum([
  'SINGLE',
  'MARRIED_FILING_JOINTLY',
  'MARRIED_FILING_SEPARATELY',
  'HEAD_OF_HOUSEHOLD',
  'QUALIFYING_WIDOW'
]);

export const PayFrequencySchema = z.enum([
  'WEEKLY',
  'BI_WEEKLY',
  'SEMI_MONTHLY',
  'MONTHLY',
  'QUARTERLY',
  'ANNUALLY'
]);

// Base Contract Information
export const ContractInputSchema = z.object({
  // Basic contract details
  title: z.string().min(1, 'Contract title is required'),
  specialty: z.string().min(1, 'Medical specialty is required'),
  location: z.object({
    state: z.enum(US_STATES),
    city: z.string().min(1, 'City is required'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
  }),
  
  // Contract terms
  contractType: ContractTypeSchema,
  startDate: z.date(),
  endDate: z.date(),
  duration: z.number().positive('Duration must be positive'),
  
  // Compensation
  hourlyRate: z.number().positive('Hourly rate must be positive'),
  hoursPerWeek: z.number().min(1).max(168, 'Hours per week must be between 1 and 168'),
  overtimeRate: z.number().optional(),
  overtimeThreshold: z.number().default(40),
  
  // Additional compensation
  bonuses: z.array(z.object({
    type: z.enum(['COMPLETION', 'PERFORMANCE', 'RETENTION', 'REFERRAL', 'SIGNING']),
    amount: z.number().nonnegative(),
    description: z.string().optional()
  })).default([]),
  
  // Benefits and allowances
  stipends: z.object({
    housing: z.number().nonnegative().default(0),
    travel: z.number().nonnegative().default(0),
    meals: z.number().nonnegative().default(0),
    licensure: z.number().nonnegative().default(0),
    malpractice: z.number().nonnegative().default(0),
    cme: z.number().nonnegative().default(0), // Continuing Medical Education
    other: z.number().nonnegative().default(0)
  }).default({}),
  
  // Deductions and expenses
  deductions: z.object({
    healthInsurance: z.number().nonnegative().default(0),
    dentalInsurance: z.number().nonnegative().default(0),
    visionInsurance: z.number().nonnegative().default(0),
    retirement401k: z.number().nonnegative().default(0),
    retirement401kPercent: z.number().min(0).max(100).optional(),
    professionalFees: z.number().nonnegative().default(0),
    parking: z.number().nonnegative().default(0),
    other: z.number().nonnegative().default(0)
  }).default({}),
  
  // Tax information
  taxInfo: z.object({
    filingStatus: FilingStatusSchema,
    federalExemptions: z.number().nonnegative().default(0),
    stateExemptions: z.number().nonnegative().default(0),
    additionalFederalWithholding: z.number().nonnegative().default(0),
    additionalStateWithholding: z.number().nonnegative().default(0),
    isResident: z.boolean().default(true)
  })
});

export const PaycheckInputSchema = z.object({
  // Gross pay for this pay period
  grossPay: z.number().positive('Gross pay must be positive'),
  payFrequency: PayFrequencySchema,
  payDate: z.date(),
  
  // Employee information
  filingStatus: FilingStatusSchema,
  exemptions: z.number().nonnegative().default(0),
  
  // Location for tax calculations
  workState: z.enum(US_STATES),
  residenceState: z.enum(US_STATES),
  
  // Year-to-date totals
  ytdGross: z.number().nonnegative().default(0),
  ytdFederalTax: z.number().nonnegative().default(0),
  ytdStateTax: z.number().nonnegative().default(0),
  ytdSocialSecurity: z.number().nonnegative().default(0),
  ytdMedicare: z.number().nonnegative().default(0),
  ytdStateDisability: z.number().nonnegative().default(0),
  
  // Deductions
  preeTaxDeductions: z.number().nonnegative().default(0),
  rothDeductions: z.number().nonnegative().default(0),
  afterTaxDeductions: z.number().nonnegative().default(0),
  
  // Additional withholdings
  additionalFederalWithholding: z.number().nonnegative().default(0),
  additionalStateWithholding: z.number().nonnegative().default(0)
});

// Output Types
export interface ContractCalculationResult {
  contract: ContractInput;
  calculationDate: Date;
  
  // Summary totals
  totals: {
    grossAnnualPay: Decimal;
    netAnnualPay: Decimal;
    totalStipends: Decimal;
    totalDeductions: Decimal;
    totalTaxes: Decimal;
    effectiveHourlyRate: Decimal;
    annualizedHourlyRate: Decimal;
  };
  
  // Detailed breakdowns
  breakdown: {
    basePay: Decimal;
    overtimePay: Decimal;
    bonuses: Decimal;
    stipends: {
      housing: Decimal;
      travel: Decimal;
      meals: Decimal;
      licensure: Decimal;
      malpractice: Decimal;
      cme: Decimal;
      other: Decimal;
      total: Decimal;
    };
    deductions: {
      healthInsurance: Decimal;
      dentalInsurance: Decimal;
      visionInsurance: Decimal;
      retirement401k: Decimal;
      professionalFees: Decimal;
      parking: Decimal;
      other: Decimal;
      total: Decimal;
    };
    taxes: {
      federal: Decimal;
      state: Decimal;
      socialSecurity: Decimal;
      medicare: Decimal;
      stateDisability: Decimal;
      unemployment: Decimal;
      total: Decimal;
    };
  };
  
  // Pay period calculations
  payPeriods: {
    frequency: PayFrequency;
    grossPerPeriod: Decimal;
    netPerPeriod: Decimal;
    periodsPerYear: number;
  };
  
  // Metrics and ratios
  metrics: {
    taxRate: Decimal; // Effective tax rate
    takeHomePercentage: Decimal;
    housingStipendPercentage: Decimal;
    benefitsValue: Decimal;
    costOfLivingAdjustment?: Decimal;
  };
}

export interface PaycheckCalculationResult {
  input: PaycheckInput;
  calculationDate: Date;
  
  // Current paycheck
  currentPay: {
    grossPay: Decimal;
    netPay: Decimal;
    totalDeductions: Decimal;
    totalTaxes: Decimal;
  };
  
  // Tax withholdings
  taxes: {
    federal: Decimal;
    state: Decimal;
    socialSecurity: Decimal;
    medicare: Decimal;
    stateDisability: Decimal;
    effectiveRate: Decimal;
  };
  
  // Deductions breakdown
  deductions: {
    preTax: Decimal;
    roth: Decimal;
    afterTax: Decimal;
    total: Decimal;
  };
  
  // Year-to-date totals
  ytd: {
    grossPay: Decimal;
    netPay: Decimal;
    totalTaxes: Decimal;
    totalDeductions: Decimal;
    effectiveTaxRate: Decimal;
  };
  
  // Projections
  projections: {
    annualGross: Decimal;
    annualNet: Decimal;
    annualTaxes: Decimal;
    remainingPaychecks: number;
  };
}

export interface ContractComparisonResult {
  contracts: ContractCalculationResult[];
  comparison: {
    bestOverall: number; // Index of best contract
    bestHourlyRate: number;
    bestNetPay: number;
    bestBenefits: number;
  };
  metrics: {
    payDifference: {
      highestToLowest: Decimal;
      percentageDifference: Decimal;
    };
    benefitsDifference: {
      highestToLowest: Decimal;
      percentageDifference: Decimal;
    };
    locationFactors: {
      costOfLiving: Decimal[];
      taxBurden: Decimal[];
    };
  };
  recommendations: string[];
}

// Export types from schemas
export type ContractInput = z.infer<typeof ContractInputSchema>;
export type PaycheckInput = z.infer<typeof PaycheckInputSchema>;
export type ContractType = z.infer<typeof ContractTypeSchema>;
export type FilingStatus = z.infer<typeof FilingStatusSchema>;
export type PayFrequency = z.infer<typeof PayFrequencySchema>;

// Export Decimal for external use
export { Decimal };