/**
 * Offline Indicator Component
 * 
 * Shows sync status and offline mode to users
 */

import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator
} from 'react-native'
import { useOfflineSync } from '../lib/offline'

export function OfflineIndicator() {
  const { syncStatus, isOffline, isSyncing, pendingCount, forceSync } = useOfflineSync()
  const [isVisible, setIsVisible] = useState(false)
  const slideAnim = new Animated.Value(-100)

  useEffect(() => {
    // Show indicator when offline or syncing
    const shouldShow = isOffline || isSyncing || pendingCount > 0

    if (shouldShow && !isVisible) {
      setIsVisible(true)
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start()
    } else if (!shouldShow && isVisible) {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true
      }).start(() => setIsVisible(false))
    }
  }, [isOffline, isSyncing, pendingCount, isVisible])

  if (!isVisible) return null

  const getStatusText = () => {
    if (isOffline) {
      return `Offline Mode${pendingCount > 0 ? ` • ${pendingCount} pending` : ''}`
    }
    if (isSyncing) {
      return 'Syncing...'
    }
    if (pendingCount > 0) {
      return `${pendingCount} items to sync`
    }
    return 'All synced'
  }

  const getStatusColor = () => {
    if (isOffline) return '#ef4444' // red
    if (isSyncing) return '#3b82f6' // blue
    if (pendingCount > 0) return '#f59e0b' // yellow
    return '#10b981' // green
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          backgroundColor: getStatusColor(),
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.content}>
        <View style={styles.statusSection}>
          {isSyncing && (
            <ActivityIndicator 
              size="small" 
              color="#ffffff" 
              style={styles.spinner}
            />
          )}
          <Text style={styles.statusText}>
            {getStatusText()}
          </Text>
        </View>

        {!isSyncing && pendingCount > 0 && syncStatus.isOnline && (
          <TouchableOpacity 
            onPress={forceSync}
            style={styles.syncButton}
          >
            <Text style={styles.syncButtonText}>Sync Now</Text>
          </TouchableOpacity>
        )}
      </View>

      {syncStatus.errors.length > 0 && (
        <View style={styles.errorSection}>
          <Text style={styles.errorText}>
            ⚠️ {syncStatus.errors.length} sync errors
          </Text>
        </View>
      )}
    </Animated.View>
  )
}

// Minimal offline badge for use in other components
export function OfflineBadge() {
  const { isOffline, pendingCount } = useOfflineSync()

  if (!isOffline && pendingCount === 0) return null

  return (
    <View style={[
      styles.badge,
      { backgroundColor: isOffline ? '#ef4444' : '#f59e0b' }
    ]}>
      <Text style={styles.badgeText}>
        {isOffline ? '🔌' : `${pendingCount}`}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 44, // Account for status bar
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  spinner: {
    marginRight: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  syncButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 12,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
})