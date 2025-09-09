/**
 * Market Data for Clinician Average Rates
 * Contains average hourly rates by clinician type for comparison
 */

const MarketData = {
    // Average hourly rates by clinician type
    clinicianRates: {
        'MD': {
            name: 'Medical Doctor',
            avgRate: 150,
            minRate: 100,
            maxRate: 250,
            description: 'General physician rates'
        },
        'MD-EM': {
            name: 'Emergency Medicine Specialist',
            avgRate: 175,
            minRate: 150,
            maxRate: 225,
            description: 'EM specialist premium rates'
        },
        'CRNA': {
            name: 'Certified Registered Nurse Anesthetist',
            avgRate: 200,
            minRate: 175,
            maxRate: 250,
            description: 'CRNA anesthesia specialist rates'
        },
        'NP': {
            name: 'Nurse Practitioner',
            avgRate: 75,
            minRate: 60,
            maxRate: 95,
            description: 'Advanced practice nurse rates'
        },
        'PA': {
            name: 'Physician Assistant',
            avgRate: 70,
            minRate: 55,
            maxRate: 90,
            description: 'Physician assistant rates'
        },
        'RN': {
            name: 'Registered Nurse',
            avgRate: 50,
            minRate: 40,
            maxRate: 65,
            description: 'Registered nurse rates'
        },
        'AA': {
            name: 'Anesthesiologist Assistant',
            avgRate: 85,
            minRate: 70,
            maxRate: 100,
            description: 'Anesthesia assistant rates'
        },
        'Tech': {
            name: 'Medical Technician',
            avgRate: 35,
            minRate: 25,
            maxRate: 45,
            description: 'Medical technician rates'
        },
        'MD-Hospitalist': {
            name: 'Hospitalist',
            avgRate: 150,
            minRate: 125,
            maxRate: 175,
            description: 'Hospital-based physician rates'
        },
        'MD-ICU': {
            name: 'Critical Care/ICU',
            avgRate: 180,
            minRate: 160,
            maxRate: 210,
            description: 'ICU/Critical care specialist rates'
        }
    },

    // Get market data for a specific clinician type
    getMarketRate: function(clinicianType) {
        // Check if we have data for this type
        let rateData = this.clinicianRates[clinicianType];
        
        // If not found, check if it's a specialty MD
        if (!rateData && clinicianType === 'MD') {
            // Default to general MD rates
            rateData = this.clinicianRates['MD'];
        }
        
        return rateData || null;
    },

    // Compare a rate to market average
    compareToMarket: function(clinicianType, hourlyRate) {
        const marketData = this.getMarketRate(clinicianType);
        if (!marketData) return null;

        const avgRate = marketData.avgRate;
        const difference = hourlyRate - avgRate;
        const percentDiff = ((hourlyRate - avgRate) / avgRate) * 100;

        return {
            marketAvg: avgRate,
            marketMin: marketData.minRate,
            marketMax: marketData.maxRate,
            yourRate: hourlyRate,
            difference: difference,
            percentDiff: percentDiff,
            comparison: hourlyRate > avgRate ? 'above' : hourlyRate < avgRate ? 'below' : 'at',
            description: `${percentDiff > 0 ? '+' : ''}${percentDiff.toFixed(1)}% ${hourlyRate > avgRate ? 'above' : hourlyRate < avgRate ? 'below' : 'at'} market average`
        };
    },

    // Format comparison for display
    formatComparison: function(comparison) {
        if (!comparison) return '<div class="comparison-value">--</div><p style="color: var(--text-secondary); font-size: 0.9rem;">Market data not available</p>';

        const color = comparison.comparison === 'above' ? '#10b981' : 
                     comparison.comparison === 'below' ? '#ef4444' : '#3b82f6';
        
        return `
            <div class="comparison-value" style="color: ${color};">$${comparison.marketAvg}</div>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">
                ${comparison.description}<br>
                <span style="font-size: 0.8rem;">Range: $${comparison.marketMin}-$${comparison.marketMax}/hr</span>
            </p>
        `;
    }
};

// Make it available globally if needed
if (typeof window !== 'undefined') {
    window.MarketData = MarketData;
}