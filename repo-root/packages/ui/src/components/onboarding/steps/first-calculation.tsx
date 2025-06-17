import React, { useState } from 'react'
import { useOnboarding } from '../onboarding-context'

export function FirstCalculation() {
  const { analytics } = useOnboarding()
  const [calculationData, setCalculationData] = useState({
    hourlyRate: 250,
    hoursPerWeek: 40,
    duration: 13,
    location: 'CA',
  })
  const [result, setResult] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const performCalculation = async () => {
    setIsCalculating(true)
    analytics.customEvent('onboarding_first_calculation_started', calculationData)
    
    // Simulate calculation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const mockResult = {
      grossPay: calculationData.hourlyRate * calculationData.hoursPerWeek * calculationData.duration,
      netPay: Math.round((calculationData.hourlyRate * calculationData.hoursPerWeek * calculationData.duration) * 0.72),
      taxes: {
        federal: Math.round((calculationData.hourlyRate * calculationData.hoursPerWeek * calculationData.duration) * 0.22),
        state: Math.round((calculationData.hourlyRate * calculationData.hoursPerWeek * calculationData.duration) * 0.06),
        total: Math.round((calculationData.hourlyRate * calculationData.hoursPerWeek * calculationData.duration) * 0.28),
      }
    }
    
    setResult(mockResult)
    setIsCalculating(false)
    
    analytics.customEvent('onboarding_first_calculation_completed', {
      ...calculationData,
      result: mockResult,
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Let's Calculate Your First Contract
        </h3>
        <p className="text-gray-600">
          We'll use sample data to show you how the calculator works
        </p>
      </div>
      
      {/* Sample contract inputs */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" data-onboarding="calculator-form">
        <h4 className="font-semibold text-blue-900 mb-3">Sample Emergency Medicine Contract</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Hourly Rate
            </label>
            <div className="flex items-center">
              <span className="text-lg font-bold text-blue-900">${calculationData.hourlyRate}</span>
              <span className="text-sm text-blue-600 ml-1">/hour</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Hours per Week
            </label>
            <div className="flex items-center">
              <span className="text-lg font-bold text-blue-900">{calculationData.hoursPerWeek}</span>
              <span className="text-sm text-blue-600 ml-1">hours</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Contract Duration
            </label>
            <div className="flex items-center">
              <span className="text-lg font-bold text-blue-900">{calculationData.duration}</span>
              <span className="text-sm text-blue-600 ml-1">weeks</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Location
            </label>
            <span className="text-lg font-bold text-blue-900">{calculationData.location}</span>
          </div>
        </div>
        
        <button
          onClick={performCalculation}
          disabled={isCalculating}
          className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isCalculating ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Calculating...
            </div>
          ) : (
            'Calculate True Rate 📊'
          )}
        </button>
      </div>
      
      {/* Results */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4" data-onboarding="calculation-results">
          <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <span>✨</span>
            Your Calculation Results
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-gray-900">
                ${result.grossPay.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Gross Pay</div>
              <div className="text-xs text-gray-500">Before taxes</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-green-600">
                ${result.netPay.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Net Pay</div>
              <div className="text-xs text-gray-500">Take home</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-red-600">
                ${result.taxes.total.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Taxes</div>
              <div className="text-xs text-gray-500">
                Federal: ${result.taxes.federal.toLocaleString()}, 
                State: ${result.taxes.state.toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white rounded border">
            <h5 className="font-medium text-gray-900 mb-2">Key Insights</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• You'll take home {Math.round((result.netPay / result.grossPay) * 100)}% of your gross pay</li>
              <li>• California has a {Math.round((result.taxes.state / result.grossPay) * 100)}% state tax impact</li>
              <li>• Your effective hourly rate after taxes is ${Math.round(result.netPay / (calculationData.hoursPerWeek * calculationData.duration))}/hour</li>
            </ul>
          </div>
        </div>
      )}
      
      {!result && (
        <div className="text-center text-gray-500">
          <p className="text-sm">Click "Calculate True Rate" to see your results</p>
        </div>
      )}
    </div>
  )
}