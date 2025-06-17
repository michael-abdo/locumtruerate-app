// Main exports for LocumTrueRate calculation engine
export * from './types';
export { ContractCalculationEngine } from './engines/contract';
export { PaycheckCalculationEngine } from './engines/paycheck';
export { ContractComparisonEngine } from './engines/comparison';
export { TaxCalculator } from './engines/tax-calculator';
export { LocationDataProvider } from './engines/location-data';

// Export functionality
export * from './export';

// History functionality
export * from './history';

// React hooks
export { useExport, useExportStatus } from './hooks/use-export';
export { 
  useCalculationHistory, 
  useRecentCalculations, 
  useFavoriteCalculations,
  useCalculationAnalytics 
} from './hooks/use-calculation-history';

// Re-export Decimal for convenience
export { Decimal } from 'decimal.js';

// Version and metadata
export const VERSION = '0.1.0';
export const SUPPORTED_TAX_YEAR = 2024;