# Market Data Source Documentation

## Overview
The LocumCalc platform displays "Market Average" rates for healthcare professionals. This document explains the source and limitations of this data.

## Data Source
**Current Implementation: Static Data**

The market averages displayed in the contract calculator are **hardcoded static values** stored in `/js/market-data.js`. These are NOT real-time market data from external APIs.

## Market Rate Data Structure

### Available Clinician Types & Rates (Updated December 2024)
- **MD (Medical Doctor)**: $215/hr (Range: $120-$400)
- **MD-EM (Emergency Medicine)**: $250/hr (Range: $200-$300) 
- **CRNA (Nurse Anesthetist)**: $220/hr (Range: $190-$280)
- **NP (Nurse Practitioner)**: $90/hr (Range: $70-$110)
- **PA (Physician Assistant)**: $90/hr (Range: $70-$110)
- **RN (Registered Nurse)**: $68/hr (Range: $34-$79)
- **AA (Anesthesiologist Assistant)**: $85/hr (Range: $70-$100)
- **Tech (Medical Technician)**: $35/hr (Range: $25-$45)
- **MD-Hospitalist**: $180/hr (Range: $140-$220)
- **MD-ICU (Critical Care)**: $275/hr (Range: $200-$350)

### State Multipliers
The system applies basic geographic multipliers to base rates, but these are also **static estimates**, not real market data.

## Limitations

### ⚠️ Important Disclaimers
1. **Static Data**: These are estimated averages, not live market rates
2. **Limited Specialties**: Only covers basic clinician categories
3. **No Real-Time Updates**: Data does not reflect current market conditions
4. **Geographic Limitations**: State multipliers are simplified estimates
5. **No External Sources**: No integration with salary databases or recruiting platforms

## Data File Location
```
/js/market-data.js
```

## Last Updated
**December 2024** - Rates updated based on web research of 2024 locum tenens market data from multiple industry sources including OnCall Solutions, LocumTenens.com, CompHealth, and ZipRecruiter salary surveys.

## How It Works
```javascript
// Example from market-data.js
const MarketData = {
    clinicianRates: {
        'CRNA': {
            name: 'Certified Registered Nurse Anesthetist',
            avgRate: 200,
            minRate: 175,
            maxRate: 250,
            description: 'CRNA anesthesia specialist rates'
        }
        // ... more entries
    }
};
```

## Future Enhancements
To provide real market data, the system would need:
1. **API Integration** with salary databases (e.g., Glassdoor, PayScale, Bureau of Labor Statistics)
2. **Live Data Feeds** from recruiting platforms
3. **Geographic Precision** beyond state-level estimates  
4. **Specialty Granularity** for medical subspecialties
5. **Regular Data Updates** to reflect market changes

## For Developers
When working with the market data system:
- Modify rates in `/js/market-data.js`
- Rates are displayed via `updateMarketAverage()` function
- Users should be made aware these are estimates, not live data
- Consider adding disclaimers about data limitations in the UI

## User Communication
Users should understand that market averages are:
- **Estimates based on general industry data**
- **Not real-time or location-specific rates**
- **Useful for general comparison only**
- **Not suitable for contract negotiation decisions**

For accurate market data, users should consult:
- Professional recruiting firms
- Industry salary surveys
- Regional healthcare associations
- Direct market research