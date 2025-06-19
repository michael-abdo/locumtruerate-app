// Minimal exports for calc-core package
// This is a temporary build configuration to get the package building

// Main types
export * from './types';

// Calculation engines
export { ContractCalculationEngine } from './engines/contract';
export { PaycheckCalculationEngine } from './engines/paycheck';
export { ContractComparisonEngine } from './engines/comparison';
export { TaxCalculator } from './engines/tax-calculator';
export { LocationDataProvider } from './engines/location-data';

// Re-export Decimal for convenience
export { Decimal } from 'decimal.js';

// Version and metadata
export const VERSION = '0.1.0';
export const SUPPORTED_TAX_YEAR = 2024;