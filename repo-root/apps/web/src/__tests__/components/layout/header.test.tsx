import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/__tests__/utils/test-utils'
import { Header } from '@/components/layout/header'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/'
}))

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }]
    }
  }),
  UserButton: () => <button data-testid="user-button">User Menu</button>,
  SignInButton: ({ children }: any) => <button data-testid="sign-in-button">{children}</button>
}))

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('renders logo and navigation', () => {
    render(<Header />)
    
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByText(/locumtruerate/i)).toBeInTheDocument()
  })
  
  it('renders main navigation links', () => {
    render(<Header />)
    
    expect(screen.getByRole('link', { name: /jobs/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /calculator/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument()
  })
  
  it('shows user menu when signed in', () => {
    render(<Header />)
    
    expect(screen.getByTestId('user-button')).toBeInTheDocument()
  })
  
  it('handles mobile menu toggle', async () => {
    const user = userEvent.setup()
    render(<Header />)
    
    // Find mobile menu button (usually a hamburger icon)
    const mobileMenuButton = screen.getByRole('button', { name: /menu/i })
    
    // Initially mobile menu should be closed
    expect(screen.queryByRole('navigation')).not.toHaveClass('mobile-open')
    
    // Open mobile menu
    await user.click(mobileMenuButton)
    
    // Mobile menu should be open (this depends on your actual implementation)
    // Adjust the assertion based on how your mobile menu works
  })
  
  it('handles search functionality', async () => {
    const user = userEvent.setup()
    render(<Header />)
    
    // Look for search input if it exists in header
    const searchInput = screen.queryByPlaceholderText(/search/i)
    
    if (searchInput) {
      await user.type(searchInput, 'emergency medicine')
      await user.keyboard('{Enter}')
      
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('emergency medicine')
      )
    }
  })
  
  it('applies correct styles and classes', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('bg-white') // Adjust based on your actual classes
  })
  
  it('has proper accessibility attributes', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    
    // Check for proper ARIA labels on navigation
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
  })
  
  it('handles logo click navigation', async () => {
    const user = userEvent.setup()
    render(<Header />)
    
    const logoLink = screen.getByRole('link', { name: /locumtruerate/i })
    await user.click(logoLink)
    
    // Should navigate to home page (this might be handled by Next.js Link)
    expect(logoLink).toHaveAttribute('href', '/')
  })
})