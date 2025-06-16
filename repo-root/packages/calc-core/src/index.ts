// Main exports for LocumTrueRate calculation engine
export * from './types';
export { ContractCalculationEngine } from './engines/contract';
export { TaxCalculator } from './engines/tax-calculator';
export { LocationDataProvider } from './engines/location-data';

// Re-export Decimal for convenience
export { Decimal } from 'decimal.js';

// Version and metadata
export const VERSION = '0.1.0';
export const SUPPORTED_TAX_YEAR = 2024;