import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#2563eb" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>LocumTrueRate</Text>
        <Text style={styles.subtitle}>Healthcare Staffing Platform</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureTitle}>🧮 Calculator</Text>
            <Text style={styles.featureText}>Calculate true contract rates</Text>
          </View>
          
          <View style={styles.feature}>
            <Text style={styles.featureTitle}>💼 Jobs</Text>
            <Text style={styles.featureText}>Find locum opportunities</Text>
          </View>
          
          <View style={styles.feature}>
            <Text style={styles.featureTitle}>📊 Analytics</Text>
            <Text style={styles.featureText}>Track your career progress</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Empowering healthcare professionals with transparent compensation analysis
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2563eb',
  },
  header: {
    padding: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  features: {
    width: '100%',
    gap: 24,
  },
  feature: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#e0e7ff',
    textAlign: 'center',
  },
})