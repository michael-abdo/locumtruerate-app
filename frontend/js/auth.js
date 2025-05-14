/**
 * Locum True Rate™ Calculator - Authentication Module
 * This file handles user authentication with the backend API
 */

// DOM Elements
const loginButton = document.getElementById('login-button');
const registerButton = document.getElementById('register-button');
const logoutButton = document.getElementById('logout-button');
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const closeModalButton = document.querySelector('.close-modal');
const passwordInput = document.getElementById('register-password');
const confirmPasswordInput = document.getElementById('register-confirm-password');
const passwordStrength = document.getElementById('password-strength');

/**
 * Initialize authentication functionality
 */
document.addEventListener('DOMContentLoaded', function() {
  // Add event listeners
  loginButton.addEventListener('click', showLoginModal);
  registerButton.addEventListener('click', showRegisterModal);
  logoutButton.addEventListener('click', handleLogout);
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  closeModalButton.addEventListener('click', closeLoginModal);
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === loginModal) {
      closeLoginModal();
    }
  });
  
  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      
      // Hide all tab contents
      tabContents.forEach(content => {
        content.style.display = 'none';
      });
      
      // Add active class to the clicked tab
      button.classList.add('active');
      
      // Show the corresponding content
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).style.display = 'block';
    });
  });
  
  // Password strength meter
  if (passwordInput) {
    passwordInput.addEventListener('input', updatePasswordStrength);
  }
  
  // Password confirmation validation
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', validatePasswordMatch);
  }
});

/**
 * Show login modal
 */
function showLoginModal() {
  loginModal.style.display = 'block';
  
  // Activate login tab
  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabContents.forEach(content => { content.style.display = 'none'; });
  
  document.querySelector('[data-tab="login-tab"]').classList.add('active');
  document.getElementById('login-tab').style.display = 'block';
}

/**
 * Show register modal
 */
function showRegisterModal() {
  loginModal.style.display = 'block';
  
  // Activate register tab
  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabContents.forEach(content => { content.style.display = 'none'; });
  
  document.querySelector('[data-tab="register-tab"]').classList.add('active');
  document.getElementById('register-tab').style.display = 'block';
}

/**
 * Close login modal
 */
function closeLoginModal() {
  loginModal.style.display = 'none';
  
  // Reset forms
  loginForm.reset();
  registerForm.reset();
  passwordStrength.innerHTML = '';
}

/**
 * Handle login form submission
 * @param {Event} event - Submit event
 */
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Store user data
      currentUser = data.user;
      
      // Update UI
      updateUIForLoggedInUser();
      
      // Close modal
      closeLoginModal();
      
      // Show success message
      showToast('Logged in successfully!', 'success');
    } else {
      const error = await response.json();
      showToast(error.error || 'Login failed. Please check your credentials.', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Login failed. Please try again later.', 'error');
  }
}

/**
 * Handle registration form submission
 * @param {Event} event - Submit event
 */
async function handleRegister(event) {
  event.preventDefault();
  
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  const userType = document.getElementById('register-user-type').value;
  
  // Validate passwords match
  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }
  
  // Validate password strength
  const strengthScore = getPasswordStrength(password);
  if (strengthScore < 2) {
    showToast('Password is too weak. Please use a stronger password.', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
        user_type: userType
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Store user data
      currentUser = data.user;
      
      // Update UI
      updateUIForLoggedInUser();
      
      // Close modal
      closeLoginModal();
      
      // Show success message
      showToast('Account created successfully!', 'success');
      
      // Redirect to profile completion form for new users
      setTimeout(() => {
        window.location.href = '/complete-profile.html';
      }, 1500);
    } else {
      const error = await response.json();
      showToast(error.error || 'Registration failed. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showToast('Registration failed. Please try again later.', 'error');
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  try {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      // Clear user data
      currentUser = null;
      
      // Update UI
      updateUIForGuest();
      
      // Show success message
      showToast('Logged out successfully', 'success');
    } else {
      showToast('Logout failed', 'error');
    }
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Logout failed. Please try again later.', 'error');
  }
}

/**
 * Calculate password strength
 * @param {string} password - Password to check
 * @returns {number} - Strength score (0-4)
 */
function getPasswordStrength(password) {
  let score = 0;
  
  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Complexity checks
  if (/[A-Z]/.test(password)) score++; // Uppercase
  if (/[a-z]/.test(password)) score++; // Lowercase
  if (/[0-9]/.test(password)) score++; // Numbers
  if (/[^A-Za-z0-9]/.test(password)) score++; // Special characters
  
  return Math.min(4, score);
}

/**
 * Update password strength indicator
 */
function updatePasswordStrength() {
  const password = passwordInput.value;
  const score = getPasswordStrength(password);
  
  // Create strength bar
  const strengthBar = document.createElement('div');
  let strengthText = '';
  let color = '';
  
  // Set styles based on score
  switch (score) {
    case 0:
      strengthText = 'Very Weak';
      color = '#ff4d4d';
      strengthBar.style.width = '10%';
      break;
    case 1:
      strengthText = 'Weak';
      color = '#ffaa00';
      strengthBar.style.width = '25%';
      break;
    case 2:
      strengthText = 'Medium';
      color = '#ffdd00';
      strengthBar.style.width = '50%';
      break;
    case 3:
      strengthText = 'Strong';
      color = '#87c540';
      strengthBar.style.width = '75%';
      break;
    case 4:
      strengthText = 'Very Strong';
      color = '#23ad5c';
      strengthBar.style.width = '100%';
      break;
  }
  
  strengthBar.style.background = color;
  passwordStrength.innerHTML = '';
  passwordStrength.appendChild(strengthBar);
  passwordStrength.setAttribute('title', strengthText);
}

/**
 * Validate password match
 */
function validatePasswordMatch() {
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  
  if (password && confirmPassword) {
    if (password !== confirmPassword) {
      confirmPasswordInput.setCustomValidity('Passwords do not match');
    } else {
      confirmPasswordInput.setCustomValidity('');
    }
  }
}