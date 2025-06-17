import React from 'react'

export function CalculatorIntro() {
  return (
    <div className="py-6">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🧮</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Your Financial Calculator
        </h3>
        <p className="text-gray-600">
          Calculate true compensation including taxes, expenses, and benefits
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="border-l-4 border-blue-500 pl-4">
          <h4 className="font-semibold text-gray-900">📊 Contract Calculator</h4>
          <p className="text-sm text-gray-600">
            Compare different contract opportunities by hourly rate, duration, and location
          </p>
        </div>
        
        <div className="border-l-4 border-green-500 pl-4">
          <h4 className="font-semibold text-gray-900">💰 Paycheck Calculator</h4>
          <p className="text-sm text-gray-600">
            Estimate your take-home pay after taxes and deductions
          </p>
        </div>
        
        <div className="border-l-4 border-purple-500 pl-4">
          <h4 className="font-semibold text-gray-900">⚖️ Comparison Tool</h4>
          <p className="text-sm text-gray-600">
            Side-by-side analysis of multiple opportunities
          </p>
        </div>
      </div>
      
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="font-semibold text-yellow-800 mb-1">Pro Tip</h4>
            <p className="text-sm text-yellow-700">
              Always consider the total package - not just the hourly rate. 
              Factors like housing stipends, travel reimbursements, and state taxes 
              can significantly impact your actual earnings.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}