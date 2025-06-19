import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'

export default function CalculatorScreen() {
  const [activeTab, setActiveTab] = useState<'contract' | 'paycheck'>('contract')
  const [hourlyRate, setHourlyRate] = useState('')
  const [hoursPerWeek, setHoursPerWeek] = useState('')
  const [contractLength, setContractLength] = useState('')
  
  const calculateContract = () => {
    const rate = parseFloat(hourlyRate) || 0
    const hours = parseFloat(hoursPerWeek) || 0
    const weeks = parseFloat(contractLength) || 0
    
    const weeklyGross = rate * hours
    const totalGross = weeklyGross * weeks
    
    return {
      weeklyGross,
      totalGross,
      monthlyGross: weeklyGross * 4.33,
    }
  }

  const results = calculateContract()

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'contract' && styles.activeTab]}
            onPress={() => setActiveTab('contract')}
          >
            <Text style={[styles.tabText, activeTab === 'contract' && styles.activeTabText]}>
              Contract Calculator
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'paycheck' && styles.activeTab]}
            onPress={() => setActiveTab('paycheck')}
          >
            <Text style={[styles.tabText, activeTab === 'paycheck' && styles.activeTabText]}>
              Paycheck Calculator
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Form */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Contract Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hourly Rate ($)</Text>
            <TextInput
              style={styles.input}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              placeholder="125.00"
              keyboardType="numeric"
              placeholderTextColor="#94a3b8"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hours per Week</Text>
            <TextInput
              style={styles.input}
              value={hoursPerWeek}
              onChangeText={setHoursPerWeek}
              placeholder="40"
              keyboardType="numeric"
              placeholderTextColor="#94a3b8"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contract Length (weeks)</Text>
            <TextInput
              style={styles.input}
              value={contractLength}
              onChangeText={setContractLength}
              placeholder="13"
              keyboardType="numeric"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Results */}
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Weekly Gross</Text>
            <Text style={styles.resultValue}>${results.weeklyGross.toLocaleString()}</Text>
          </View>
          
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Monthly Gross</Text>
            <Text style={styles.resultValue}>${results.monthlyGross.toLocaleString()}</Text>
          </View>
          
          <View style={[styles.resultCard, styles.primaryResult]}>
            <Text style={styles.resultLabel}>Total Contract Value</Text>
            <Text style={[styles.resultValue, styles.primaryResultValue]}>
              ${results.totalGross.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>💾 Save Calculation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>📤 Share Results</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.compareButton}>
            <Text style={styles.compareButtonText}>⚖️ Compare Contracts</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>💡 Tips</Text>
          <Text style={styles.tipText}>
            • Consider housing, travel, and meal allowances when comparing contracts
          </Text>
          <Text style={styles.tipText}>
            • Factor in state taxes and cost of living differences
          </Text>
          <Text style={styles.tipText}>
            • Don't forget about malpractice insurance and licensing costs
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabText: {
    color: '#ffffff',
  },
  inputSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  resultsSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  primaryResult: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 16,
    borderRadius: 8,
    borderBottomWidth: 0,
    marginTop: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  primaryResultValue: {
    fontSize: 18,
    color: '#2563eb',
  },
  actionSection: {
    margin: 16,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  compareButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  compareButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tipText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 20,
  },
})