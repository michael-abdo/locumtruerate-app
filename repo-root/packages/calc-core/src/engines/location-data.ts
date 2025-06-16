import { USState } from '../types';
import { Decimal } from 'decimal.js';

interface LocationData {
  state: USState;
  costOfLivingIndex: number; // 100 = national average
  housingCostIndex: number;
  medianIncome: number;
  averageCommute: number; // minutes
  qualityOfLifeScore: number; // 1-10 scale
  healthcareDemand: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  majorCities: string[];
  taxes: {
    salesTax: number;
    propertyTaxRate: number;
    hasLocalIncomeTax: boolean;
  };
}

// Comprehensive location data for all US states
const LOCATION_DATA: Record<USState, LocationData> = {
  'AL': {
    state: 'AL',
    costOfLivingIndex: 87.9,
    housingCostIndex: 72.1,
    medianIncome: 52035,
    averageCommute: 24.8,
    qualityOfLifeScore: 6.2,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville'],
    taxes: { salesTax: 9.22, propertyTaxRate: 0.41, hasLocalIncomeTax: false }
  },
  'AK': {
    state: 'AK',
    costOfLivingIndex: 127.1,
    housingCostIndex: 134.6,
    medianIncome: 77640,
    averageCommute: 19.4,
    qualityOfLifeScore: 7.8,
    healthcareDemand: 'HIGH',
    majorCities: ['Anchorage', 'Fairbanks', 'Juneau'],
    taxes: { salesTax: 1.76, propertyTaxRate: 1.19, hasLocalIncomeTax: false }
  },
  'AZ': {
    state: 'AZ',
    costOfLivingIndex: 102.2,
    housingCostIndex: 107.3,
    medianIncome: 62055,
    averageCommute: 25.2,
    qualityOfLifeScore: 7.1,
    healthcareDemand: 'HIGH',
    majorCities: ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale'],
    taxes: { salesTax: 8.40, propertyTaxRate: 0.66, hasLocalIncomeTax: false }
  },
  'AR': {
    state: 'AR',
    costOfLivingIndex: 86.9,
    housingCostIndex: 75.4,
    medianIncome: 48952,
    averageCommute: 21.9,
    qualityOfLifeScore: 6.0,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Little Rock', 'Fort Smith', 'Fayetteville'],
    taxes: { salesTax: 9.48, propertyTaxRate: 0.62, hasLocalIncomeTax: false }
  },
  'CA': {
    state: 'CA',
    costOfLivingIndex: 149.9,
    housingCostIndex: 196.5,
    medianIncome: 80440,
    averageCommute: 29.3,
    qualityOfLifeScore: 7.3,
    healthcareDemand: 'CRITICAL',
    majorCities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose'],
    taxes: { salesTax: 8.85, propertyTaxRate: 0.75, hasLocalIncomeTax: false }
  },
  'CO': {
    state: 'CO',
    costOfLivingIndex: 104.1,
    housingCostIndex: 116.8,
    medianIncome: 77127,
    averageCommute: 25.4,
    qualityOfLifeScore: 8.2,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins'],
    taxes: { salesTax: 7.72, propertyTaxRate: 0.51, hasLocalIncomeTax: false }
  },
  'CT': {
    state: 'CT',
    costOfLivingIndex: 107.8,
    housingCostIndex: 103.6,
    medianIncome: 78833,
    averageCommute: 26.1,
    qualityOfLifeScore: 7.0,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Hartford', 'New Haven', 'Stamford', 'Waterbury'],
    taxes: { salesTax: 6.35, propertyTaxRate: 2.14, hasLocalIncomeTax: false }
  },
  'DE': {
    state: 'DE',
    costOfLivingIndex: 105.8,
    housingCostIndex: 103.9,
    medianIncome: 70176,
    averageCommute: 25.9,
    qualityOfLifeScore: 6.8,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Wilmington', 'Dover', 'Newark'],
    taxes: { salesTax: 0.00, propertyTaxRate: 0.57, hasLocalIncomeTax: false }
  },
  'FL': {
    state: 'FL',
    costOfLivingIndex: 99.0,
    housingCostIndex: 95.3,
    medianIncome: 59227,
    averageCommute: 27.8,
    qualityOfLifeScore: 7.4,
    healthcareDemand: 'HIGH',
    majorCities: ['Miami', 'Tampa', 'Orlando', 'Jacksonville', 'Fort Lauderdale'],
    taxes: { salesTax: 7.05, propertyTaxRate: 0.83, hasLocalIncomeTax: false }
  },
  'GA': {
    state: 'GA',
    costOfLivingIndex: 91.4,
    housingCostIndex: 84.7,
    medianIncome: 61980,
    averageCommute: 28.2,
    qualityOfLifeScore: 6.9,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Atlanta', 'Augusta', 'Columbus', 'Savannah'],
    taxes: { salesTax: 7.31, propertyTaxRate: 0.92, hasLocalIncomeTax: false }
  },
  'HI': {
    state: 'HI',
    costOfLivingIndex: 184.1,
    housingCostIndex: 269.0,
    medianIncome: 83102,
    averageCommute: 27.3,
    qualityOfLifeScore: 8.5,
    healthcareDemand: 'HIGH',
    majorCities: ['Honolulu', 'Hilo', 'Kailua-Kona'],
    taxes: { salesTax: 4.44, propertyTaxRate: 0.28, hasLocalIncomeTax: false }
  },
  'ID': {
    state: 'ID',
    costOfLivingIndex: 92.3,
    housingCostIndex: 95.1,
    medianIncome: 60999,
    averageCommute: 20.9,
    qualityOfLifeScore: 7.6,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Boise', 'Nampa', 'Pocatello', 'Idaho Falls'],
    taxes: { salesTax: 6.03, propertyTaxRate: 0.69, hasLocalIncomeTax: false }
  },
  'IL': {
    state: 'IL',
    costOfLivingIndex: 95.5,
    housingCostIndex: 89.0,
    medianIncome: 69187,
    averageCommute: 29.0,
    qualityOfLifeScore: 6.7,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Chicago', 'Aurora', 'Peoria', 'Rockford'],
    taxes: { salesTax: 8.82, propertyTaxRate: 2.16, hasLocalIncomeTax: false }
  },
  'IN': {
    state: 'IN',
    costOfLivingIndex: 87.9,
    housingCostIndex: 78.9,
    medianIncome: 57603,
    averageCommute: 23.8,
    qualityOfLifeScore: 6.4,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend'],
    taxes: { salesTax: 7.00, propertyTaxRate: 0.85, hasLocalIncomeTax: true }
  },
  'IA': {
    state: 'IA',
    costOfLivingIndex: 89.1,
    housingCostIndex: 78.1,
    medianIncome: 65080,
    averageCommute: 19.4,
    qualityOfLifeScore: 7.2,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City'],
    taxes: { salesTax: 6.94, propertyTaxRate: 1.57, hasLocalIncomeTax: false }
  },
  'KS': {
    state: 'KS',
    costOfLivingIndex: 87.0,
    housingCostIndex: 76.1,
    medianIncome: 62087,
    averageCommute: 19.7,
    qualityOfLifeScore: 6.8,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Wichita', 'Overland Park', 'Kansas City', 'Topeka'],
    taxes: { salesTax: 8.68, propertyTaxRate: 1.41, hasLocalIncomeTax: false }
  },
  'KY': {
    state: 'KY',
    costOfLivingIndex: 90.1,
    housingCostIndex: 81.7,
    medianIncome: 52238,
    averageCommute: 23.4,
    qualityOfLifeScore: 6.3,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro'],
    taxes: { salesTax: 6.00, propertyTaxRate: 0.86, hasLocalIncomeTax: true }
  },
  'LA': {
    state: 'LA',
    costOfLivingIndex: 94.3,
    housingCostIndex: 84.6,
    medianIncome: 51073,
    averageCommute: 25.4,
    qualityOfLifeScore: 6.1,
    healthcareDemand: 'MEDIUM',
    majorCities: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'],
    taxes: { salesTax: 9.55, propertyTaxRate: 0.55, hasLocalIncomeTax: false }
  },
  'ME': {
    state: 'ME',
    costOfLivingIndex: 105.2,
    housingCostIndex: 109.7,
    medianIncome: 58924,
    averageCommute: 23.6,
    qualityOfLifeScore: 7.8,
    healthcareDemand: 'HIGH',
    majorCities: ['Portland', 'Lewiston', 'Bangor'],
    taxes: { salesTax: 5.50, propertyTaxRate: 1.28, hasLocalIncomeTax: false }
  },
  'MD': {
    state: 'MD',
    costOfLivingIndex: 113.0,
    housingCostIndex: 120.3,
    medianIncome: 86738,
    averageCommute: 32.9,
    qualityOfLifeScore: 7.1,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg'],
    taxes: { salesTax: 6.00, propertyTaxRate: 1.09, hasLocalIncomeTax: true }
  },
  'MA': {
    state: 'MA',
    costOfLivingIndex: 109.7,
    housingCostIndex: 127.4,
    medianIncome: 85843,
    averageCommute: 29.7,
    qualityOfLifeScore: 7.9,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Boston', 'Worcester', 'Springfield', 'Cambridge'],
    taxes: { salesTax: 6.25, propertyTaxRate: 1.17, hasLocalIncomeTax: false }
  },
  'MI': {
    state: 'MI',
    costOfLivingIndex: 88.9,
    housingCostIndex: 74.0,
    medianIncome: 59584,
    averageCommute: 24.7,
    qualityOfLifeScore: 6.5,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights'],
    taxes: { salesTax: 6.00, propertyTaxRate: 1.54, hasLocalIncomeTax: true }
  },
  'MN': {
    state: 'MN',
    costOfLivingIndex: 97.2,
    housingCostIndex: 92.6,
    medianIncome: 74593,
    averageCommute: 23.9,
    qualityOfLifeScore: 8.0,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Minneapolis', 'Saint Paul', 'Rochester', 'Duluth'],
    taxes: { salesTax: 7.46, propertyTaxRate: 1.12, hasLocalIncomeTax: false }
  },
  'MS': {
    state: 'MS',
    costOfLivingIndex: 83.3,
    housingCostIndex: 71.0,
    medianIncome: 45792,
    averageCommute: 24.5,
    qualityOfLifeScore: 5.8,
    healthcareDemand: 'HIGH',
    majorCities: ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg'],
    taxes: { salesTax: 7.07, propertyTaxRate: 0.81, hasLocalIncomeTax: false }
  },
  'MO': {
    state: 'MO',
    costOfLivingIndex: 87.1,
    housingCostIndex: 77.6,
    medianIncome: 57409,
    averageCommute: 23.8,
    qualityOfLifeScore: 6.6,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Kansas City', 'Saint Louis', 'Springfield', 'Columbia'],
    taxes: { salesTax: 8.28, propertyTaxRate: 0.97, hasLocalIncomeTax: true }
  },
  'MT': {
    state: 'MT',
    costOfLivingIndex: 96.0,
    housingCostIndex: 100.7,
    medianIncome: 57153,
    averageCommute: 18.0,
    qualityOfLifeScore: 8.1,
    healthcareDemand: 'HIGH',
    majorCities: ['Billings', 'Missoula', 'Great Falls', 'Bozeman'],
    taxes: { salesTax: 0.00, propertyTaxRate: 0.83, hasLocalIncomeTax: false }
  },
  'NE': {
    state: 'NE',
    costOfLivingIndex: 89.1,
    housingCostIndex: 80.4,
    medianIncome: 65686,
    averageCommute: 19.7,
    qualityOfLifeScore: 7.0,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island'],
    taxes: { salesTax: 6.94, propertyTaxRate: 1.76, hasLocalIncomeTax: false }
  },
  'NV': {
    state: 'NV',
    costOfLivingIndex: 104.5,
    housingCostIndex: 117.7,
    medianIncome: 63276,
    averageCommute: 24.9,
    qualityOfLifeScore: 6.9,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas'],
    taxes: { salesTax: 8.23, propertyTaxRate: 0.53, hasLocalIncomeTax: false }
  },
  'NH': {
    state: 'NH',
    costOfLivingIndex: 106.0,
    housingCostIndex: 115.2,
    medianIncome: 77933,
    averageCommute: 27.0,
    qualityOfLifeScore: 7.7,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Manchester', 'Nashua', 'Concord', 'Derry'],
    taxes: { salesTax: 0.00, propertyTaxRate: 2.15, hasLocalIncomeTax: false }
  },
  'NJ': {
    state: 'NJ',
    costOfLivingIndex: 115.2,
    housingCostIndex: 127.4,
    medianIncome: 85751,
    averageCommute: 31.7,
    qualityOfLifeScore: 6.8,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth'],
    taxes: { salesTax: 6.60, propertyTaxRate: 2.49, hasLocalIncomeTax: false }
  },
  'NM': {
    state: 'NM',
    costOfLivingIndex: 91.0,
    housingCostIndex: 85.9,
    medianIncome: 51945,
    averageCommute: 22.1,
    qualityOfLifeScore: 6.7,
    healthcareDemand: 'HIGH',
    majorCities: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe'],
    taxes: { salesTax: 7.83, propertyTaxRate: 0.80, hasLocalIncomeTax: false }
  },
  'NY': {
    state: 'NY',
    costOfLivingIndex: 120.5,
    housingCostIndex: 132.1,
    medianIncome: 72108,
    averageCommute: 33.4,
    qualityOfLifeScore: 7.2,
    healthcareDemand: 'MEDIUM',
    majorCities: ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse'],
    taxes: { salesTax: 8.52, propertyTaxRate: 1.72, hasLocalIncomeTax: true }
  },
  'NC': {
    state: 'NC',
    costOfLivingIndex: 94.2,
    housingCostIndex: 90.6,
    medianIncome: 56642,
    averageCommute: 24.7,
    qualityOfLifeScore: 7.0,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem'],
    taxes: { salesTax: 7.41, propertyTaxRate: 0.84, hasLocalIncomeTax: false }
  },
  'ND': {
    state: 'ND',
    costOfLivingIndex: 98.9,
    housingCostIndex: 88.5,
    medianIncome: 65315,
    averageCommute: 17.8,
    qualityOfLifeScore: 7.4,
    healthcareDemand: 'HIGH',
    majorCities: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot'],
    taxes: { salesTax: 6.86, propertyTaxRate: 0.98, hasLocalIncomeTax: false }
  },
  'OH': {
    state: 'OH',
    costOfLivingIndex: 88.5,
    housingCostIndex: 79.5,
    medianIncome: 58642,
    averageCommute: 23.7,
    qualityOfLifeScore: 6.5,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'],
    taxes: { salesTax: 7.23, propertyTaxRate: 1.56, hasLocalIncomeTax: true }
  },
  'OK': {
    state: 'OK',
    costOfLivingIndex: 86.8,
    housingCostIndex: 76.8,
    medianIncome: 54449,
    averageCommute: 21.8,
    qualityOfLifeScore: 6.3,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow'],
    taxes: { salesTax: 8.97, propertyTaxRate: 0.90, hasLocalIncomeTax: false }
  },
  'OR': {
    state: 'OR',
    costOfLivingIndex: 113.8,
    housingCostIndex: 134.8,
    medianIncome: 67058,
    averageCommute: 25.9,
    qualityOfLifeScore: 8.0,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Portland', 'Eugene', 'Salem', 'Gresham'],
    taxes: { salesTax: 0.00, propertyTaxRate: 1.07, hasLocalIncomeTax: false }
  },
  'PA': {
    state: 'PA',
    costOfLivingIndex: 96.1,
    housingCostIndex: 88.6,
    medianIncome: 63463,
    averageCommute: 26.8,
    qualityOfLifeScore: 6.7,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie'],
    taxes: { salesTax: 6.34, propertyTaxRate: 1.58, hasLocalIncomeTax: true }
  },
  'RI': {
    state: 'RI',
    costOfLivingIndex: 107.0,
    housingCostIndex: 108.4,
    medianIncome: 71169,
    averageCommute: 25.2,
    qualityOfLifeScore: 6.9,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Providence', 'Warwick', 'Cranston', 'Pawtucket'],
    taxes: { salesTax: 7.00, propertyTaxRate: 1.53, hasLocalIncomeTax: false }
  },
  'SC': {
    state: 'SC',
    costOfLivingIndex: 94.0,
    housingCostIndex: 88.5,
    medianIncome: 54672,
    averageCommute: 24.4,
    qualityOfLifeScore: 6.8,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant'],
    taxes: { salesTax: 7.44, propertyTaxRate: 0.57, hasLocalIncomeTax: false }
  },
  'SD': {
    state: 'SD',
    costOfLivingIndex: 92.4,
    housingCostIndex: 83.6,
    medianIncome: 59533,
    averageCommute: 16.6,
    qualityOfLifeScore: 7.3,
    healthcareDemand: 'HIGH',
    majorCities: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings'],
    taxes: { salesTax: 6.40, propertyTaxRate: 1.31, hasLocalIncomeTax: false }
  },
  'TN': {
    state: 'TN',
    costOfLivingIndex: 89.0,
    housingCostIndex: 84.1,
    medianIncome: 56071,
    averageCommute: 25.8,
    qualityOfLifeScore: 6.7,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'],
    taxes: { salesTax: 9.55, propertyTaxRate: 0.66, hasLocalIncomeTax: false }
  },
  'TX': {
    state: 'TX',
    costOfLivingIndex: 91.5,
    housingCostIndex: 84.3,
    medianIncome: 64034,
    averageCommute: 26.6,
    qualityOfLifeScore: 6.8,
    healthcareDemand: 'CRITICAL',
    majorCities: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth'],
    taxes: { salesTax: 8.19, propertyTaxRate: 1.69, hasLocalIncomeTax: false }
  },
  'UT': {
    state: 'UT',
    costOfLivingIndex: 103.4,
    housingCostIndex: 118.6,
    medianIncome: 75780,
    averageCommute: 21.9,
    qualityOfLifeScore: 8.3,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan'],
    taxes: { salesTax: 7.19, propertyTaxRate: 0.60, hasLocalIncomeTax: false }
  },
  'VT': {
    state: 'VT',
    costOfLivingIndex: 113.3,
    housingCostIndex: 120.8,
    medianIncome: 65923,
    averageCommute: 22.6,
    qualityOfLifeScore: 8.4,
    healthcareDemand: 'HIGH',
    majorCities: ['Burlington', 'Essex', 'South Burlington', 'Colchester'],
    taxes: { salesTax: 6.24, propertyTaxRate: 1.86, hasLocalIncomeTax: false }
  },
  'VA': {
    state: 'VA',
    costOfLivingIndex: 103.7,
    housingCostIndex: 108.1,
    medianIncome: 76456,
    averageCommute: 28.5,
    qualityOfLifeScore: 7.2,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News'],
    taxes: { salesTax: 5.75, propertyTaxRate: 0.81, hasLocalIncomeTax: true }
  },
  'WA': {
    state: 'WA',
    costOfLivingIndex: 115.4,
    housingCostIndex: 141.1,
    medianIncome: 78687,
    averageCommute: 27.3,
    qualityOfLifeScore: 8.1,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue'],
    taxes: { salesTax: 9.21, propertyTaxRate: 0.94, hasLocalIncomeTax: false }
  },
  'WV': {
    state: 'WV',
    costOfLivingIndex: 90.5,
    housingCostIndex: 73.5,
    medianIncome: 48850,
    averageCommute: 25.9,
    qualityOfLifeScore: 6.0,
    healthcareDemand: 'HIGH',
    majorCities: ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg'],
    taxes: { salesTax: 6.50, propertyTaxRate: 0.59, hasLocalIncomeTax: false }
  },
  'WI': {
    state: 'WI',
    costOfLivingIndex: 92.1,
    housingCostIndex: 86.9,
    medianIncome: 64168,
    averageCommute: 22.5,
    qualityOfLifeScore: 7.1,
    healthcareDemand: 'MEDIUM',
    majorCities: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha'],
    taxes: { salesTax: 5.41, propertyTaxRate: 1.85, hasLocalIncomeTax: false }
  },
  'WY': {
    state: 'WY',
    costOfLivingIndex: 91.7,
    housingCostIndex: 88.9,
    medianIncome: 65003,
    averageCommute: 18.4,
    qualityOfLifeScore: 7.5,
    healthcareDemand: 'HIGH',
    majorCities: ['Cheyenne', 'Casper', 'Laramie', 'Gillette'],
    taxes: { salesTax: 5.36, propertyTaxRate: 0.62, hasLocalIncomeTax: false }
  }
};

export class LocationDataProvider {
  
  /**
   * Get location data for a specific state
   */
  getLocationData(state: USState): LocationData {
    return LOCATION_DATA[state];
  }

  /**
   * Calculate cost of living adjustment between two states
   */
  calculateCostOfLivingAdjustment(fromState: USState, toState: USState): Decimal {
    const fromData = this.getLocationData(fromState);
    const toData = this.getLocationData(toState);
    
    const adjustment = new Decimal(toData.costOfLivingIndex).div(fromData.costOfLivingIndex);
    return adjustment;
  }

  /**
   * Calculate housing cost adjustment
   */
  calculateHousingCostAdjustment(fromState: USState, toState: USState): Decimal {
    const fromData = this.getLocationData(fromState);
    const toData = this.getLocationData(toState);
    
    const adjustment = new Decimal(toData.housingCostIndex).div(fromData.housingCostIndex);
    return adjustment;
  }

  /**
   * Get states with high healthcare demand
   */
  getHighDemandStates(): USState[] {
    return Object.values(LOCATION_DATA)
      .filter(data => data.healthcareDemand === 'HIGH' || data.healthcareDemand === 'CRITICAL')
      .map(data => data.state);
  }

  /**
   * Calculate quality of life score adjustment
   */
  getQualityOfLifeScore(state: USState): number {
    return this.getLocationData(state).qualityOfLifeScore;
  }

  /**
   * Get states with no income tax
   */
  getNoIncomeTaxStates(): USState[] {
    // States with no state income tax
    return ['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY'];
  }

  /**
   * Get states with low cost of living (below national average)
   */
  getLowCostStates(): USState[] {
    return Object.values(LOCATION_DATA)
      .filter(data => data.costOfLivingIndex < 100)
      .map(data => data.state);
  }

  /**
   * Calculate total tax burden including sales and property taxes
   */
  calculateTotalTaxBurden(state: USState, income: Decimal, propertyValue: Decimal = new Decimal(0)): {
    salesTaxBurden: Decimal;
    propertyTaxBurden: Decimal;
    totalBurden: Decimal;
  } {
    const data = this.getLocationData(state);
    
    // Estimate annual sales tax (roughly 8-12% of income for most households)
    const salesTaxBurden = income.mul(0.10).mul(data.taxes.salesTax / 100);
    
    // Calculate property tax
    const propertyTaxBurden = propertyValue.mul(data.taxes.propertyTaxRate / 100);
    
    const totalBurden = salesTaxBurden.add(propertyTaxBurden);
    
    return {
      salesTaxBurden,
      propertyTaxBurden,
      totalBurden
    };
  }

  /**
   * Get recommended locations based on criteria
   */
  getRecommendedLocations(criteria: {
    maxCostOfLiving?: number;
    minQualityOfLife?: number;
    preferredHealthcareDemand?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    preferNoIncomeTax?: boolean;
    maxCommute?: number;
  }): LocationData[] {
    return Object.values(LOCATION_DATA).filter(data => {
      if (criteria.maxCostOfLiving && data.costOfLivingIndex > criteria.maxCostOfLiving) return false;
      if (criteria.minQualityOfLife && data.qualityOfLifeScore < criteria.minQualityOfLife) return false;
      if (criteria.preferredHealthcareDemand && data.healthcareDemand !== criteria.preferredHealthcareDemand) return false;
      if (criteria.preferNoIncomeTax && this.getNoIncomeTaxStates().includes(data.state) === false) return false;
      if (criteria.maxCommute && data.averageCommute > criteria.maxCommute) return false;
      
      return true;
    }).sort((a, b) => {
      // Sort by quality of life score descending, then cost of living ascending
      if (a.qualityOfLifeScore !== b.qualityOfLifeScore) {
        return b.qualityOfLifeScore - a.qualityOfLifeScore;
      }
      return a.costOfLivingIndex - b.costOfLivingIndex;
    });
  }

  /**
   * Calculate location score for contract comparison
   */
  calculateLocationScore(state: USState): number {
    const data = this.getLocationData(state);
    
    // Weighted scoring algorithm
    const costScore = Math.max(0, 200 - data.costOfLivingIndex) / 100; // Lower cost = higher score
    const qualityScore = data.qualityOfLifeScore / 10;
    const commuteScore = Math.max(0, (60 - data.averageCommute)) / 60; // Shorter commute = higher score
    const demandScore = { 'LOW': 0.5, 'MEDIUM': 0.7, 'HIGH': 0.9, 'CRITICAL': 1.0 }[data.healthcareDemand];
    
    // Weighted average (cost 30%, quality 25%, commute 20%, demand 25%)
    const totalScore = (costScore * 0.30) + (qualityScore * 0.25) + (commuteScore * 0.20) + (demandScore * 0.25);
    
    return Math.round(totalScore * 100); // Return as percentage
  }
}