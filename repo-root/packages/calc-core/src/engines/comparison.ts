import { Decimal } from 'decimal.js';
import {
  ContractInput,
  ContractCalculationResult,
  ContractComparisonResult,
  USState
} from '../types';
import { ContractCalculationEngine } from './contract';
import { LocationDataProvider } from './location-data';

export class ContractComparisonEngine {
  private contractEngine: ContractCalculationEngine;
  private locationData: LocationDataProvider;

  constructor() {
    this.contractEngine = new ContractCalculationEngine();
    this.locationData = new LocationDataProvider();
  }

  /**
   * Compare multiple contracts and provide comprehensive analysis
   */
  async compareContracts(contracts: ContractInput[]): Promise<ContractComparisonResult> {
    if (contracts.length < 2) {
      throw new Error('At least 2 contracts are required for comparison');
    }

    // Calculate all contracts
    const calculations = await Promise.all(
      contracts.map(contract => this.contractEngine.calculateContract(contract))
    );

    // Find best contracts by different metrics
    const comparison = this.findBestContracts(calculations);
    
    // Calculate comparative metrics
    const metrics = this.calculateComparisonMetrics(calculations);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(calculations, metrics);

    return {
      contracts: calculations,
      comparison,
      metrics,
      recommendations
    };
  }

  /**
   * Find the best contract by different criteria
   */
  private findBestContracts(calculations: ContractCalculationResult[]) {
    let bestOverall = 0;
    let bestHourlyRate = 0;
    let bestNetPay = 0;
    let bestBenefits = 0;

    let highestScore = 0;
    let highestHourlyRate = new Decimal(0);
    let highestNetPay = new Decimal(0);
    let highestBenefits = new Decimal(0);

    calculations.forEach((calc, index) => {
      // Overall score calculation (weighted)
      const score = this.calculateOverallScore(calc);
      if (score > highestScore) {
        highestScore = score;
        bestOverall = index;
      }

      // Best hourly rate
      if (calc.totals.effectiveHourlyRate.gt(highestHourlyRate)) {
        highestHourlyRate = calc.totals.effectiveHourlyRate;
        bestHourlyRate = index;
      }

      // Best net pay
      if (calc.totals.netAnnualPay.gt(highestNetPay)) {
        highestNetPay = calc.totals.netAnnualPay;
        bestNetPay = index;
      }

      // Best benefits
      const benefitsValue = calc.totals.totalStipends.add(calc.metrics.benefitsValue);
      if (benefitsValue.gt(highestBenefits)) {
        highestBenefits = benefitsValue;
        bestBenefits = index;
      }
    });

    return {
      bestOverall,
      bestHourlyRate,
      bestNetPay,
      bestBenefits
    };
  }

  /**
   * Calculate overall score for a contract (0-100)
   */
  private calculateOverallScore(calculation: ContractCalculationResult): number {
    const contract = calculation.contract;
    
    // Compensation score (40% weight)
    const hourlyRateScore = Math.min(100, calculation.totals.effectiveHourlyRate.toNumber() / 150 * 100);
    const netPayScore = Math.min(100, calculation.totals.netAnnualPay.toNumber() / 400000 * 100);
    const compensationScore = (hourlyRateScore * 0.6) + (netPayScore * 0.4);

    // Benefits score (25% weight)
    const stipendsValue = calculation.totals.totalStipends.toNumber();
    const benefitsScore = Math.min(100, stipendsValue / 100000 * 100);

    // Location score (20% weight)
    const locationScore = this.locationData.calculateLocationScore(contract.location.state);

    // Tax efficiency score (15% weight)
    const taxRate = calculation.metrics.taxRate.toNumber();
    const taxScore = Math.max(0, 100 - (taxRate * 2)); // Lower tax rate = higher score

    // Weighted total
    const totalScore = (compensationScore * 0.40) + 
                      (benefitsScore * 0.25) + 
                      (locationScore * 0.20) + 
                      (taxScore * 0.15);

    return Math.round(totalScore);
  }

  /**
   * Calculate comparison metrics between contracts
   */
  private calculateComparisonMetrics(calculations: ContractCalculationResult[]) {
    // Pay differences
    const netPays = calculations.map(calc => calc.totals.netAnnualPay);
    const highestPay = Decimal.max(...netPays);
    const lowestPay = Decimal.min(...netPays);
    const payDifference = highestPay.minus(lowestPay);
    const payPercentageDiff = payDifference.div(lowestPay).mul(100);

    // Benefits differences
    const benefitsValues = calculations.map(calc => 
      calc.totals.totalStipends.add(calc.metrics.benefitsValue)
    );
    const highestBenefits = Decimal.max(...benefitsValues);
    const lowestBenefits = Decimal.min(...benefitsValues);
    const benefitsDifference = highestBenefits.minus(lowestBenefits);
    const benefitsPercentageDiff = benefitsDifference.div(lowestBenefits || new Decimal(1)).mul(100);

    // Location factors
    const costOfLivingFactors = calculations.map(calc => {
      const locationData = this.locationData.getLocationData(calc.contract.location.state);
      return new Decimal(locationData.costOfLivingIndex);
    });

    const taxBurdens = calculations.map(calc => calc.metrics.taxRate);

    return {
      payDifference: {
        highestToLowest: payDifference,
        percentageDifference: payPercentageDiff
      },
      benefitsDifference: {
        highestToLowest: benefitsDifference,
        percentageDifference: benefitsPercentageDiff
      },
      locationFactors: {
        costOfLiving: costOfLivingFactors,
        taxBurden: taxBurdens
      }
    };
  }

  /**
   * Generate recommendations based on comparison analysis
   */
  private generateRecommendations(
    calculations: ContractCalculationResult[], 
    metrics: any
  ): string[] {
    const recommendations: string[] = [];

    // High-level pay difference recommendation
    if (metrics.payDifference.percentageDifference.gt(20)) {
      recommendations.push(
        `There's a significant ${metrics.payDifference.percentageDifference.toFixed(1)}% difference in net pay between the highest and lowest paying contracts. Consider the total compensation package, not just base salary.`
      );
    }

    // Location-based recommendations
    const locations = calculations.map(calc => calc.contract.location.state);
    const uniqueStates = [...new Set(locations)];
    
    if (uniqueStates.length > 1) {
      const noTaxStates = this.locationData.getNoIncomeTaxStates();
      const contractsInNoTaxStates = calculations.filter(calc => 
        noTaxStates.includes(calc.contract.location.state)
      );

      if (contractsInNoTaxStates.length > 0) {
        recommendations.push(
          `Consider contracts in ${contractsInNoTaxStates.map(c => c.contract.location.state).join(', ')} - these states have no income tax, which could significantly increase your take-home pay.`
        );
      }
    }

    // High-demand area recommendations
    const highDemandStates = this.locationData.getHighDemandStates();
    const contractsInHighDemand = calculations.filter(calc => 
      highDemandStates.includes(calc.contract.location.state)
    );

    if (contractsInHighDemand.length > 0) {
      recommendations.push(
        `Contracts in ${contractsInHighDemand.map(c => c.contract.location.state).join(', ')} are in high-demand healthcare markets, which may offer better long-term opportunities and higher rates.`
      );
    }

    // Benefits recommendations
    const maxStipends = Decimal.max(...calculations.map(calc => calc.totals.totalStipends));
    const contractsWithHighStipends = calculations.filter(calc => 
      calc.totals.totalStipends.gte(maxStipends.mul(0.9))
    );

    if (contractsWithHighStipends.length > 0 && maxStipends.gt(50000)) {
      recommendations.push(
        `Look closely at housing and travel stipends - some contracts offer up to $${maxStipends.toFixed(0)} in tax-free benefits, which is equivalent to a significant salary increase.`
      );
    }

    // Duration and renewal recommendations
    const shortContracts = calculations.filter(calc => calc.contract.duration <= 13); // 3 months or less
    if (shortContracts.length > 0) {
      recommendations.push(
        `Short-term contracts (≤13 weeks) may offer higher hourly rates but consider the gaps between assignments when comparing total annual income.`
      );
    }

    // Work-life balance recommendations
    const longHourContracts = calculations.filter(calc => calc.contract.hoursPerWeek > 50);
    if (longHourContracts.length > 0) {
      recommendations.push(
        `Contracts requiring 50+ hours per week may offer higher total pay but consider the impact on work-life balance and potential burnout.`
      );
    }

    return recommendations;
  }

  /**
   * Compare two specific contracts in detail
   */
  async compareTwo(
    contract1: ContractInput, 
    contract2: ContractInput
  ): Promise<{
    contract1: ContractCalculationResult;
    contract2: ContractCalculationResult;
    differences: {
      netPayDifference: Decimal;
      hourlyRateDifference: Decimal;
      benefitsDifference: Decimal;
      taxDifference: Decimal;
      costOfLivingImpact: Decimal;
    };
    recommendation: string;
  }> {
    const [calc1, calc2] = await Promise.all([
      this.contractEngine.calculateContract(contract1),
      this.contractEngine.calculateContract(contract2)
    ]);

    // Calculate differences
    const netPayDiff = calc1.totals.netAnnualPay.minus(calc2.totals.netAnnualPay);
    const hourlyRateDiff = calc1.totals.effectiveHourlyRate.minus(calc2.totals.effectiveHourlyRate);
    const benefitsDiff = calc1.totals.totalStipends.minus(calc2.totals.totalStipends);
    const taxDiff = calc1.totals.totalTaxes.minus(calc2.totals.totalTaxes);

    // Calculate cost of living impact
    const costOfLivingAdjustment = this.locationData.calculateCostOfLivingAdjustment(
      contract1.location.state,
      contract2.location.state
    );

    // Generate recommendation
    let recommendation = '';
    if (netPayDiff.abs().gt(10000)) {
      const betterContract = netPayDiff.gt(0) ? 'first' : 'second';
      recommendation = `The ${betterContract} contract offers $${netPayDiff.abs().toFixed(0)} more in annual net pay. `;
    }

    if (costOfLivingAdjustment.minus(1).abs().gt(0.1)) {
      const adjustment = costOfLivingAdjustment.gt(1) ? 'higher' : 'lower';
      const percentage = costOfLivingAdjustment.minus(1).mul(100).abs().toFixed(1);
      recommendation += `Consider that the second location has ${percentage}% ${adjustment} cost of living.`;
    }

    return {
      contract1: calc1,
      contract2: calc2,
      differences: {
        netPayDifference: netPayDiff,
        hourlyRateDifference: hourlyRateDiff,
        benefitsDifference: benefitsDiff,
        taxDifference: taxDiff,
        costOfLivingImpact: costOfLivingAdjustment
      },
      recommendation: recommendation || 'Both contracts offer similar financial benefits. Consider personal preferences for location and work environment.'
    };
  }

  /**
   * Rank contracts by specified criteria
   */
  rankContracts(
    calculations: ContractCalculationResult[],
    criteria: 'netPay' | 'hourlyRate' | 'benefits' | 'overall' | 'location' = 'overall'
  ): { ranking: number[]; scores: number[] } {
    const scores: number[] = [];

    calculations.forEach((calc, index) => {
      let score = 0;

      switch (criteria) {
        case 'netPay':
          score = calc.totals.netAnnualPay.toNumber();
          break;
        case 'hourlyRate':
          score = calc.totals.effectiveHourlyRate.toNumber();
          break;
        case 'benefits':
          score = calc.totals.totalStipends.add(calc.metrics.benefitsValue).toNumber();
          break;
        case 'location':
          score = this.locationData.calculateLocationScore(calc.contract.location.state);
          break;
        case 'overall':
        default:
          score = this.calculateOverallScore(calc);
          break;
      }

      scores.push(score);
    });

    // Create ranking (indices sorted by score descending)
    const ranking = scores
      .map((score, index) => ({ score, index }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.index);

    return { ranking, scores };
  }

  /**
   * Calculate break-even analysis for contract differences
   */
  calculateBreakEven(
    higherPayContract: ContractCalculationResult,
    lowerPayContract: ContractCalculationResult,
    additionalCosts: {
      movingCosts?: number;
      housingSetupCosts?: number;
      travelCosts?: number;
      licensingCosts?: number;
    } = {}
  ): {
    netPayDifference: Decimal;
    totalAdditionalCosts: Decimal;
    breakEvenWeeks: Decimal;
    recommendation: string;
  } {
    const netPayDiff = higherPayContract.totals.netAnnualPay.minus(lowerPayContract.totals.netAnnualPay);
    const totalCosts = new Decimal(
      (additionalCosts.movingCosts || 0) +
      (additionalCosts.housingSetupCosts || 0) +
      (additionalCosts.travelCosts || 0) +
      (additionalCosts.licensingCosts || 0)
    );

    const weeklyPayDiff = netPayDiff.div(52);
    const breakEvenWeeks = totalCosts.div(weeklyPayDiff);

    let recommendation = '';
    if (breakEvenWeeks.lte(higherPayContract.contract.duration)) {
      recommendation = `You'll break even after ${breakEvenWeeks.toFixed(1)} weeks. This contract is financially beneficial.`;
    } else {
      recommendation = `Break-even would take ${breakEvenWeeks.toFixed(1)} weeks, which exceeds the contract duration of ${higherPayContract.contract.duration} weeks. Consider the long-term benefits beyond just this contract.`;
    }

    return {
      netPayDifference: netPayDiff,
      totalAdditionalCosts: totalCosts,
      breakEvenWeeks,
      recommendation
    };
  }
}