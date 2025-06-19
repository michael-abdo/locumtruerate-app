/**
 * BiometricLoginButton Component Tests
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { BiometricLoginButton, BiometricSetupButton } from '../BiometricLoginButton'

// Mock the auth hook
const mockUseAuth = {
  biometricAvailable: true,
  biometricType: 'Face ID',
  loginWithBiometric: jest.fn(),
  isLoading: false,
  biometricEnabled: false,
  enableBiometric: jest.fn(),
  disableBiometric: jest.fn(),
}

jest.mock('../../lib/auth', () => ({
  useAuth: () => mockUseAuth,
}))

describe('BiometricLoginButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.biometricAvailable = true
    mockUseAuth.biometricType = 'Face ID'
    mockUseAuth.isLoading = false
  })

  it('renders nothing when biometric is not available', () => {
    mockUseAuth.biometricAvailable = false
    
    const { queryByText } = render(
      <BiometricLoginButton />
    )
    
    expect(queryByText('Login with Face ID')).toBeNull()
  })

  it('renders correctly when biometric is available', () => {
    const { getByText } = render(
      <BiometricLoginButton />
    )
    
    expect(getByText('👤')).toBeTruthy()
    expect(getByText('Login with Face ID')).toBeTruthy()
  })

  it('shows Touch ID icon for Touch ID', () => {
    mockUseAuth.biometricType = 'Touch ID'
    
    const { getByText } = render(
      <BiometricLoginButton />
    )
    
    expect(getByText('👆')).toBeTruthy()
    expect(getByText('Login with Touch ID')).toBeTruthy()
  })

  it('shows fingerprint icon for fingerprint', () => {
    mockUseAuth.biometricType = 'Fingerprint'
    
    const { getByText } = render(
      <BiometricLoginButton />
    )
    
    expect(getByText('👆')).toBeTruthy()
    expect(getByText('Login with Fingerprint')).toBeTruthy()
  })

  it('shows generic icon for unknown biometric type', () => {
    mockUseAuth.biometricType = 'Unknown'
    
    const { getByText } = render(
      <BiometricLoginButton />
    )
    
    expect(getByText('🔐')).toBeTruthy()
  })

  it('calls loginWithBiometric when pressed', async () => {
    mockUseAuth.loginWithBiometric.mockResolvedValue({ success: true })
    
    const { getByText } = render(
      <BiometricLoginButton />
    )
    
    fireEvent.press(getByText('Login with Face ID'))
    
    await waitFor(() => {
      expect(mockUseAuth.loginWithBiometric).toHaveBeenCalled()
    })
  })

  it('calls onSuccess when login succeeds', async () => {
    const mockOnSuccess = jest.fn()
    mockUseAuth.loginWithBiometric.mockResolvedValue({ success: true })
    
    const { getByText } = render(
      <BiometricLoginButton onSuccess={mockOnSuccess} />
    )
    
    fireEvent.press(getByText('Login with Face ID'))
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('calls onError when login fails', async () => {
    const mockOnError = jest.fn()
    mockUseAuth.loginWithBiometric.mockResolvedValue({ 
      success: false, 
      error: 'Authentication failed' 
    })
    
    const { getByText } = render(
      <BiometricLoginButton onError={mockOnError} />
    )
    
    fireEvent.press(getByText('Login with Face ID'))
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Authentication failed')
    })
  })

  it('shows loading state when loading', () => {
    mockUseAuth.isLoading = true
    
    const { queryByText, getByTestId } = render(
      <BiometricLoginButton />
    )
    
    expect(queryByText('Login with Face ID')).toBeNull()
    // ActivityIndicator doesn't have text, would need testID
  })

  it('is disabled when loading', () => {
    mockUseAuth.isLoading = true
    
    const { getByRole } = render(
      <BiometricLoginButton />
    )
    
    // TouchableOpacity with disabled=true
    const button = getByRole('button')
    expect(button.props.accessibilityState?.disabled).toBe(true)
  })
})

describe('BiometricSetupButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.biometricAvailable = true
    mockUseAuth.biometricType = 'Face ID'
    mockUseAuth.biometricEnabled = false
  })

  it('renders nothing when biometric is not available', () => {
    mockUseAuth.biometricAvailable = false
    
    const { queryByText } = render(
      <BiometricSetupButton />
    )
    
    expect(queryByText('Enable Face ID')).toBeNull()
  })

  it('shows enable text when biometric is disabled', () => {
    const { getByText } = render(
      <BiometricSetupButton />
    )
    
    expect(getByText('⚪')).toBeTruthy()
    expect(getByText('Enable Face ID')).toBeTruthy()
  })

  it('shows enabled text when biometric is enabled', () => {
    mockUseAuth.biometricEnabled = true
    
    const { getByText } = render(
      <BiometricSetupButton />
    )
    
    expect(getByText('✅')).toBeTruthy()
    expect(getByText('Face ID Enabled')).toBeTruthy()
  })

  it('calls enableBiometric when enabling', async () => {
    mockUseAuth.enableBiometric.mockResolvedValue(true)
    
    const { getByText } = render(
      <BiometricSetupButton />
    )
    
    fireEvent.press(getByText('Enable Face ID'))
    
    await waitFor(() => {
      expect(mockUseAuth.enableBiometric).toHaveBeenCalled()
    })
  })

  it('calls disableBiometric when disabling', async () => {
    mockUseAuth.biometricEnabled = true
    mockUseAuth.disableBiometric.mockResolvedValue(true)
    
    const { getByText } = render(
      <BiometricSetupButton />
    )
    
    fireEvent.press(getByText('Face ID Enabled'))
    
    await waitFor(() => {
      expect(mockUseAuth.disableBiometric).toHaveBeenCalled()
    })
  })

  it('calls onComplete with success result', async () => {
    const mockOnComplete = jest.fn()
    mockUseAuth.enableBiometric.mockResolvedValue(true)
    
    const { getByText } = render(
      <BiometricSetupButton onComplete={mockOnComplete} />
    )
    
    fireEvent.press(getByText('Enable Face ID'))
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(true)
    })
  })

  it('calls onComplete with failure result', async () => {
    const mockOnComplete = jest.fn()
    mockUseAuth.enableBiometric.mockResolvedValue(false)
    
    const { getByText } = render(
      <BiometricSetupButton onComplete={mockOnComplete} />
    )
    
    fireEvent.press(getByText('Enable Face ID'))
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(false)
    })
  })
})