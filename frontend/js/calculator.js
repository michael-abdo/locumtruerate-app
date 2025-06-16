/**
 * Locum True Rate™ Calculator - Main JavaScript
 * This file handles the calculation logic and integration with the backend API
 */

// Global variables
const API_URL = 'https://api.locumtruerate.com'; // Will be replaced with your Cloudflare Worker URL
let board = []; // Array to store calculations for comparison
let currentUser = null; // Will store user info when logged in

// DOM Elements
const calculateButton = document.getElementById('calculate-button');
const closePopupButton = document.getElementById('close-popup-btn');
const saveCalculationButton = document.getElementById('save-calculation-btn');
const overlay = document.getElementById('overlay');
const resultsPopup = document.getElementById('resultsPopup');
const boardTable = document.getElementById('boardTable');

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication status
  checkAuthStatus();
  
  // Add event listeners
  calculateButton.addEventListener('click', calculateAndDisplay);
  closePopupButton.addEventListener('click', closePopup);
  saveCalculationButton.addEventListener('click', saveCalculation);
  
  // Load saved calculations from local storage if available
  loadLocalCalculations();
});

/**
 * Helper function to get value from input field
 * @param {string} id - Element ID
 * @returns {number} - Parsed value or 0 if invalid
 */
function val(id) {
  return parseFloat(document.getElementById(id).value) || 0;
}

/**
 * Calculate contract metrics based on form inputs
 * @returns {Object} - Calculation results
 */
function calculateContractMetrics() {
  // Get form values
  const state = document.getElementById('contractState').value;
  const type = document.getElementById('practitionerType').value;
  const h = val('hourly');
  const ot = val('otRate');
  const ws = val('weeklyStipend');
  const ds = val('dailyStipend');
  const wk = val('weeks');
  const pto = val('pto');
  const hpw = val('hoursPerWeek');
  const spw = val('shiftsPerWeek');
  const dm = val('dailyMiles');
  const bonus = val('completionBonus');
  const beeperRate = val('beeperRate');
  const beeperHours = val('beeperHoursPerMonth');
  
  // Calculate metrics
  const workedWeeks = wk - pto;
  const totalHours = hpw * workedWeeks;
  const regularHours = Math.min(hpw, 40);
  const overtimeHours = Math.max(hpw - 40, 0);
  const grossDaily = spw ? (regularHours * h + overtimeHours * ot) / spw : 0;
  const grossWeekly = grossDaily * spw;
  const grossMonthly = grossWeekly * 4;
  const grossYearly = grossWeekly * workedWeeks;
  const stipendTotal = ws * workedWeeks + ds * (workedWeeks * spw);
  const mileageReimbursement = dm * (workedWeeks * spw) * 0.67; // IRS mileage rate for 2025
  const months = workedWeeks / 4;
  const beeperComp = beeperRate * beeperHours * months;
  
  // Calculate total income and true rate
  const grossContractValue = grossYearly + stipendTotal + mileageReimbursement + bonus + beeperComp;
  const trueRate = totalHours ? grossContractValue / totalHours : 0;
  
  // Return complete calculation object
  return {
    state,
    type,
    hourlyRate: h,
    overtimeRate: ot,
    weeklyStipend: ws,
    dailyStipend: ds,
    weeks: wk,
    pto,
    hoursPerWeek: hpw,
    shiftsPerWeek: spw,
    dailyMiles: dm,
    completionBonus: bonus,
    beeperRate,
    beeperHours,
    workedWeeks,
    totalHours,
    grossDaily,
    grossWeekly,
    grossMonthly,
    grossYearly,
    stipendTotal,
    mileageReimbursement,
    beeperComp,
    grossContractValue,
    trueRate
  };
}

/**
 * Calculate and display results
 */
function calculateAndDisplay() {
  // Calculate metrics
  const metrics = calculateContractMetrics();
  
  // Add to board for comparison
  addToBoard(metrics);
  
  // Update and show results popup
  showResultsPopup(metrics);
  
  // Show save button if user is logged in
  if (currentUser) {
    saveCalculationButton.style.display = 'block';
  }
}

/**
 * Add calculation to comparison board
 * @param {Object} metrics - Calculation metrics
 */
function addToBoard(metrics) {
  // Add to global board array
  board.push({
    state: metrics.state,
    type: metrics.type,
    trueRate: metrics.trueRate,
    grossValue: metrics.grossContractValue,
    metrics: metrics // Store full metrics for reference
  });
  
  // Render the updated board
  renderBoard();
  
  // Save to local storage
  localStorage.setItem('locumCalculatorBoard', JSON.stringify(board));
}

/**
 * Render the comparison board
 */
function renderBoard() {
  const tbody = boardTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  // Find highest true rate for highlighting
  const bestRate = Math.max(...board.map(c => c.trueRate));
  
  // Create table rows
  board.forEach((calc, index) => {
    const tr = document.createElement('tr');
    
    // Highlight best rate
    if (calc.trueRate === bestRate) {
      tr.classList.add('best');
    }
    
    // Format numbers
    const trueRateFormatted = calc.trueRate.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    const grossValueFormatted = calc.grossValue.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    // Build table row
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${calc.state || 'N/A'}</td>
      <td>${calc.type}</td>
      <td>${trueRateFormatted}/hr</td>
      <td>${grossValueFormatted}</td>
      <td>
        <div class="table-actions">
          <button class="action-btn view-btn" data-index="${index}" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn delete-btn" data-index="${index}" title="Remove">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
  
  // Add event listeners to the new buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      viewSavedCalculation(index);
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      removeFromBoard(index);
    });
  });
}

/**
 * View a saved calculation from the board
 * @param {number} index - Index in the board array
 */
function viewSavedCalculation(index) {
  const calculation = board[index].metrics;
  showResultsPopup(calculation);
}

/**
 * Remove a calculation from the board
 * @param {number} index - Index in the board array
 */
function removeFromBoard(index) {
  if (confirm('Are you sure you want to remove this calculation?')) {
    board.splice(index, 1);
    renderBoard();
    localStorage.setItem('locumCalculatorBoard', JSON.stringify(board));
  }
}

/**
 * Display the results popup
 * @param {Object} metrics - Calculation metrics
 */
function showResultsPopup(metrics) {
  // Format numbers for display
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  // Update popup content
  document.getElementById('trueBubble').textContent = `True Rate: ${formatter.format(metrics.trueRate)}/hr`;
  document.getElementById('grossContractValue').textContent = `Gross Contract Value: ${formatter.format(metrics.grossContractValue)}`;
  document.getElementById('grossDaily').textContent = `Gross Daily: ${formatter.format(metrics.grossDaily)}`;
  document.getElementById('grossWeekly').textContent = `Gross Weekly: ${formatter.format(metrics.grossWeekly)}`;
  document.getElementById('grossMonthly').textContent = `Gross Monthly: ${formatter.format(metrics.grossMonthly)}`;
  document.getElementById('grossYearly').textContent = `Gross Yearly: ${formatter.format(metrics.grossYearly)}`;
  document.getElementById('stipendTotal').textContent = `Total Stipend: ${formatter.format(metrics.stipendTotal)}`;
  document.getElementById('mileageReimbursement').textContent = `Mileage Reimbursement: ${formatter.format(metrics.mileageReimbursement)}`;
  document.getElementById('beeperCompDisplay').textContent = `Beeper Compensation: ${formatter.format(metrics.beeperComp)}`;
  document.getElementById('totalHours').textContent = `Total Hours: ${metrics.totalHours}`;
  document.getElementById('completionBonusDisplay').textContent = `Completion Bonus: ${formatter.format(metrics.completionBonus)}`;
  document.getElementById('trueRateDisplay').textContent = `True Rate: ${formatter.format(metrics.trueRate)}/hr`;
  
  // Show popup
  overlay.style.display = 'block';
  resultsPopup.style.display = 'block';
}

/**
 * Close the results popup
 */
function closePopup() {
  overlay.style.display = 'none';
  resultsPopup.style.display = 'none';
}

/**
 * Save calculation to server (if logged in) or prompt login
 */
async function saveCalculation() {
  // Check if user is logged in
  if (!currentUser) {
    showLoginModal();
    return;
  }
  
  // Calculate metrics
  const metrics = calculateContractMetrics();
  
  try {
    // Save to server
    const response = await fetch(`${API_URL}/api/calculations/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({
        contract_state: metrics.state,
        practitioner_type: metrics.type,
        hourly_rate: metrics.hourlyRate,
        overtime_rate: metrics.overtimeRate,
        beeper_rate: metrics.beeperRate,
        beeper_hours_per_month: metrics.beeperHours,
        weekly_stipend: metrics.weeklyStipend,
        daily_stipend: metrics.dailyStipend,
        weeks: metrics.weeks,
        pto: metrics.pto,
        hours_per_week: metrics.hoursPerWeek,
        shifts_per_week: metrics.shiftsPerWeek,
        daily_miles: metrics.dailyMiles,
        completion_bonus: metrics.completionBonus,
        true_rate: metrics.trueRate,
        gross_contract_value: metrics.grossContractValue,
        is_public: false // Private by default
      })
    });
    
    if (response.ok) {
      // Show success message
      showToast('Calculation saved successfully!', 'success');
      closePopup();
    } else {
      const error = await response.json();
      showToast(error.error || 'Failed to save calculation', 'error');
    }
  } catch (error) {
    console.error('Error saving calculation:', error);
    showToast('Failed to connect to server', 'error');
  }
}

/**
 * Load saved calculations from local storage
 */
function loadLocalCalculations() {
  const savedBoard = localStorage.getItem('locumCalculatorBoard');
  if (savedBoard) {
    try {
      board = JSON.parse(savedBoard);
      renderBoard();
    } catch (error) {
      console.error('Error loading saved calculations:', error);
    }
  }
}

/**
 * Check authentication status
 */
async function checkAuthStatus() {
  try {
    const response = await fetch(`${API_URL}/api/auth/status`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.authenticated) {
        // User is authenticated
        currentUser = data.user;
        updateUIForLoggedInUser();
      } else {
        // User is not authenticated
        currentUser = null;
        updateUIForGuest();
      }
    } else {
      // Error checking auth status
      currentUser = null;
      updateUIForGuest();
    }
  } catch (error) {
    console.error('Error checking authentication status:', error);
    currentUser = null;
    updateUIForGuest();
  }
}

/**
 * Update UI for logged in user
 */
function updateUIForLoggedInUser() {
  // Hide login bar and show user menu
  document.querySelector('.login-bar').style.display = 'none';
  
  const userMenu = document.querySelector('.user-menu');
  userMenu.style.display = 'flex';
  
  // Update user name
  document.getElementById('user-name').textContent = currentUser.first_name || currentUser.email;
  
  // Show save button in popup
  saveCalculationButton.style.display = 'block';
}

/**
 * Update UI for guest (not logged in)
 */
function updateUIForGuest() {
  // Show login bar and hide user menu
  document.querySelector('.login-bar').style.display = 'flex';
  document.querySelector('.user-menu').style.display = 'none';
  
  // Hide save button in popup
  saveCalculationButton.style.display = 'none';
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, info, warning)
 */
function showToast(message, type = 'info') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Set icon based on type
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  
  toast.innerHTML = `<i class="fas fa-${icon}"></i>${message}`;
  
  // Add to container
  const container = document.getElementById('toast-container');
  container.appendChild(toast);
  
  // Remove after delay
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateContractMetrics,
    val
  };
}