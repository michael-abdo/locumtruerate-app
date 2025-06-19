/**
 * PlatformSpecific Component Tests
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Platform, Vibration } from 'react-native'
import * as Haptics from 'expo-haptics'
import {
  PlatformButton,
  PlatformCard,
  PlatformHeader,
  PlatformListItem,
  triggerHaptic
} from '../PlatformSpecific'

// Mock modules
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: {
    OS: 'ios',
  },
  Vibration: {
    vibrate: jest.fn(),
  },
}))

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}))

describe('PlatformButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with default props', () => {
    const mockOnPress = jest.fn()
    const { getByText } = render(
      <PlatformButton title="Test Button" onPress={mockOnPress} />
    )
    
    expect(getByText('Test Button')).toBeTruthy()
  })

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn()
    const { getByText } = render(
      <PlatformButton title="Test Button" onPress={mockOnPress} />
    )
    
    fireEvent.press(getByText('Test Button'))
    expect(mockOnPress).toHaveBeenCalled()
  })

  it('triggers haptic feedback on iOS when pressed', async () => {
    const mockOnPress = jest.fn()
    const mockImpact = Haptics.impactAsync as jest.Mock
    
    const { getByText } = render(
      <PlatformButton title="Test Button" onPress={mockOnPress} />
    )
    
    fireEvent.press(getByText('Test Button'))
    
    await waitFor(() => {
      expect(mockImpact).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium)
    })
  })

  it('triggers vibration on Android when pressed', async () => {
    Platform.OS = 'android'
    const mockOnPress = jest.fn()
    const mockVibrate = Vibration.vibrate as jest.Mock
    
    const { getByText } = render(
      <PlatformButton title="Test Button" onPress={mockOnPress} />
    )
    
    fireEvent.press(getByText('Test Button'))
    
    await waitFor(() => {
      expect(mockVibrate).toHaveBeenCalledWith(50)
    })
  })

  it('uses light haptic for secondary variant', async () => {
    const mockOnPress = jest.fn()
    const mockImpact = Haptics.impactAsync as jest.Mock
    
    const { getByText } = render(
      <PlatformButton 
        title="Secondary" 
        onPress={mockOnPress} 
        variant="secondary"
      />
    )
    
    fireEvent.press(getByText('Secondary'))
    
    await waitFor(() => {
      expect(mockImpact).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
    })
  })

  it('uses warning notification for destructive variant', async () => {
    const mockOnPress = jest.fn()
    const mockNotification = Haptics.notificationAsync as jest.Mock
    
    const { getByText } = render(
      <PlatformButton 
        title="Delete" 
        onPress={mockOnPress} 
        variant="destructive"
      />
    )
    
    fireEvent.press(getByText('Delete'))
    
    await waitFor(() => {
      expect(mockNotification).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Warning
      )
    })
  })

  it('does not call onPress when disabled', () => {
    const mockOnPress = jest.fn()
    const { getByText } = render(
      <PlatformButton 
        title="Disabled" 
        onPress={mockOnPress} 
        disabled={true}
      />
    )
    
    fireEvent.press(getByText('Disabled'))
    expect(mockOnPress).not.toHaveBeenCalled()
  })
})

describe('PlatformCard', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <PlatformCard>
        <text>Card Content</text>
      </PlatformCard>
    )
    
    expect(getByText('Card Content')).toBeTruthy()
  })

  it('applies iOS styles on iOS', () => {
    Platform.OS = 'ios'
    const { getByTestId } = render(
      <PlatformCard testID="card">
        <text>Content</text>
      </PlatformCard>
    )
    
    const card = getByTestId('card')
    expect(card.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderRadius: expect.any(Number) })
      ])
    )
  })
})

describe('PlatformHeader', () => {
  it('renders title correctly', () => {
    const { getByText } = render(
      <PlatformHeader title="Test Header" />
    )
    
    expect(getByText('Test Header')).toBeTruthy()
  })

  it('renders left button when provided', () => {
    const mockPress = jest.fn()
    const { getByText } = render(
      <PlatformHeader 
        title="Header"
        leftButton={{ title: 'Back', onPress: mockPress }}
      />
    )
    
    expect(getByText('Back')).toBeTruthy()
  })

  it('renders right button when provided', () => {
    const mockPress = jest.fn()
    const { getByText } = render(
      <PlatformHeader 
        title="Header"
        rightButton={{ title: 'Done', onPress: mockPress }}
      />
    )
    
    expect(getByText('Done')).toBeTruthy()
  })

  it('calls button onPress when pressed', () => {
    const mockPress = jest.fn()
    const { getByText } = render(
      <PlatformHeader 
        title="Header"
        leftButton={{ title: 'Back', onPress: mockPress }}
      />
    )
    
    fireEvent.press(getByText('Back'))
    expect(mockPress).toHaveBeenCalled()
  })
})

describe('PlatformListItem', () => {
  it('renders title correctly', () => {
    const { getByText } = render(
      <PlatformListItem title="List Item" />
    )
    
    expect(getByText('List Item')).toBeTruthy()
  })

  it('renders subtitle when provided', () => {
    const { getByText } = render(
      <PlatformListItem 
        title="Item" 
        subtitle="Subtitle text"
      />
    )
    
    expect(getByText('Subtitle text')).toBeTruthy()
  })

  it('renders right element when provided', () => {
    const { getByText } = render(
      <PlatformListItem 
        title="Item"
        rightElement={<text>Right</text>}
      />
    )
    
    expect(getByText('Right')).toBeTruthy()
  })

  it('calls onPress when pressed', () => {
    const mockPress = jest.fn()
    const { getByText } = render(
      <PlatformListItem 
        title="Pressable Item"
        onPress={mockPress}
      />
    )
    
    fireEvent.press(getByText('Pressable Item'))
    expect(mockPress).toHaveBeenCalled()
  })

  it('is not pressable when onPress is not provided', () => {
    const { queryByRole } = render(
      <PlatformListItem title="Static Item" />
    )
    
    // Should not render as TouchableOpacity
    expect(queryByRole('button')).toBeNull()
  })
})

describe('triggerHaptic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Platform.OS = 'ios'
  })

  it('triggers light haptic on iOS', async () => {
    const mockImpact = Haptics.impactAsync as jest.Mock
    
    await triggerHaptic.light()
    
    expect(mockImpact).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
  })

  it('triggers medium haptic on iOS', async () => {
    const mockImpact = Haptics.impactAsync as jest.Mock
    
    await triggerHaptic.medium()
    
    expect(mockImpact).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium)
  })

  it('triggers heavy haptic on iOS', async () => {
    const mockImpact = Haptics.impactAsync as jest.Mock
    
    await triggerHaptic.heavy()
    
    expect(mockImpact).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy)
  })

  it('triggers success notification on iOS', async () => {
    const mockNotification = Haptics.notificationAsync as jest.Mock
    
    await triggerHaptic.success()
    
    expect(mockNotification).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success
    )
  })

  it('triggers vibration on Android', async () => {
    Platform.OS = 'android'
    const mockVibrate = Vibration.vibrate as jest.Mock
    
    await triggerHaptic.light()
    
    expect(mockVibrate).toHaveBeenCalledWith(25)
  })

  it('triggers pattern vibration for success on Android', async () => {
    Platform.OS = 'android'
    const mockVibrate = Vibration.vibrate as jest.Mock
    
    await triggerHaptic.success()
    
    expect(mockVibrate).toHaveBeenCalledWith([0, 50, 50, 50])
  })
})