'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import { motion } from 'framer-motion'
import { Calculator, DollarSign, MapPin, Clock, TrendingUp } from 'lucide-react'
import { ContractCalculator, PaycheckCalculator } from '@/components/calculator'
import { 
  ComparisonTool,
  CalculatorTabs, CalculatorResults, SavedCalculations,
  ExportOptions
} from '@/components/placeholder'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

type CalculatorType = 'contract' | 'paycheck' | 'comparison'

const calculatorFeatures = [
  {
    icon: DollarSign,
    title: 'Accurate Compensation',
    description: 'Get precise calculations with 2024 tax tables and location-based adjustments'
  },
  {
    icon: MapPin,
    title: 'Location Intelligence',
    description: 'Factor in cost of living, state taxes, and regional market conditions'
  },
  {
    icon: Clock,
    title: 'Real-time Updates',
    description: 'Calculations update instantly as you modify contract parameters'
  },
  {
    icon: TrendingUp,
    title: 'Career Planning',
    description: 'Compare multiple opportunities and plan your career trajectory'
  }
]

export default function CalculatorPage() {
  const [activeCalculator, setActiveCalculator] = useState<CalculatorType>('contract')
  const [calculationResult, setCalculationResult] = useState(null)
  const [showSaved, setShowSaved] = useState(false)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Page Header */}
        <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Calculator className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Contract Calculator
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Make informed decisions with our comprehensive healthcare contract analysis tools. 
                Calculate true compensation, compare opportunities, and plan your financial future.
              </p>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12"
            >
              {calculatorFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 text-center"
                  >
                    <div className="flex justify-center mb-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                )
              })}
            </motion.div>
          </div>
        </section>

        {/* Calculator Interface */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calculator Panel */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
              >
                {/* Calculator Tabs */}
                <CalculatorTabs
                  activeCalculator={activeCalculator}
                  onCalculatorChange={setActiveCalculator}
                />

                {/* Calculator Content */}
                <div className="p-6">
                  {activeCalculator === 'contract' && (
                    <ContractCalculator
                      onCalculation={setCalculationResult}
                    />
                  )}
                  
                  {activeCalculator === 'paycheck' && (
                    <PaycheckCalculator
                      onCalculation={setCalculationResult}
                    />
                  )}
                  
                  {activeCalculator === 'comparison' && (
                    <ComparisonTool
                      onCalculation={setCalculationResult}
                    />
                  )}
                </div>
              </motion.div>

              {/* Saved Calculations */}
              {showSaved && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-8"
                >
                  <SavedCalculations
                    onClose={() => setShowSaved(false)}
                    onLoadCalculation={setCalculationResult}
                  />
                </motion.div>
              )}
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="sticky top-6"
              >
                {calculationResult ? (
                  <>
                    <CalculatorResults
                      result={calculationResult}
                      calculatorType={activeCalculator}
                    />
                    
                    <div className="mt-6">
                      <ExportOptions
                        result={calculationResult}
                        calculatorType={activeCalculator}
                      />
                    </div>
                  </>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calculator className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Ready to Calculate
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Enter your contract details to see comprehensive analysis and insights.
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowSaved(!showSaved)}
                      className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        Saved Calculations
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        View your previous calculations
                      </div>
                    </button>
                    
                    <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="font-medium text-gray-900 dark:text-white">
                        Market Insights
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        See regional compensation data
                      </div>
                    </button>
                    
                    <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="font-medium text-gray-900 dark:text-white">
                        Tax Planning
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Optimize your tax strategy
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Help Section */}
        <section className="bg-blue-50 dark:bg-blue-900/20 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Need Help Getting Started?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Our calculator is designed to be intuitive, but we're here to help you get the most accurate results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                Watch Tutorial
              </button>
              <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-semibold transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}