# Claude Development Guidelines

## Project Overview
This is a locum tenens job board platform with vanilla JavaScript implementation (no frameworks). The project includes multiple dashboard interfaces for different user types and utility tools.

## User Interface Guidelines

### ❌ NEVER Use Confirmation Dialogs
- **NEVER** use `confirm()` dialogs for any actions
- **NEVER** use `alert()` for user notifications
- **NEVER** interrupt user workflow with blocking dialogs

### ✅ Use Non-Blocking Feedback Instead
- **Use toast notifications** via `showToast()` function for user feedback
- **Use notification systems** via `showNotification()` function where available
- **Use visual state changes** (button text, colors, icons) to indicate actions
- **Use progress indicators** for long-running operations

### Implementation Examples

**❌ Wrong:**
```javascript
function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        // delete logic
        alert('Item deleted successfully');
    }
}
```

**✅ Correct:**
```javascript
function deleteItem(id) {
    // delete logic
    showToast('Item deleted successfully', 'success');
}
```

## Architecture Guidelines

### Technology Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **No frameworks**: React, Vue, Angular not used
- **Styling**: CSS Grid, Flexbox for layouts
- **State Management**: LocalStorage for client-side persistence

### Code Organization
- All functionality in single HTML files with embedded CSS and JavaScript
- Modular function organization within script tags
- Consistent naming conventions and event handling patterns

### User Experience Principles
- **Immediate feedback**: Actions should provide instant visual feedback
- **Progressive disclosure**: Show information as needed, not all at once
- **Error handling**: Graceful degradation with helpful error messages
- **Accessibility**: ARIA labels and keyboard navigation support

## Testing Guidelines
- QA test files are located in `/qa/ux-tests/`
- Test files use OpenAI Operator format for systematic testing
- All tests include explicit safety notices for demo environments
- Tests validate functionality without requiring actual backend services

## Deployment
- Staging deployment via `staging-deploy` branch
- Automatic Heroku deployment configured
- All changes should be committed with descriptive messages
- Test locally before pushing changes

## Key Functions Available
- `showToast(message, type)` - Non-blocking notifications
- `showNotification(message, type)` - Alternative notification system
- `updateDashboard()` - Refresh dashboard data
- `filterData()` - Generic filtering functionality
- `exportData()` - Data export capabilities

## File Structure
- `index.html` - Main landing page
- `locum-dashboard.html` - Locum tenens user dashboard
- `recruiter-dashboard.html` - Recruiter interface
- `admin-dashboard.html` - Administrative controls
- `contract-calculator.html` - Contract calculation tool
- `paycheck-calculator.html` - Paycheck calculation tool
- `job-board.html` - Job listing interface

## Important Notes
- All user interactions should be smooth and non-interrupting
- Maintain consistent UX patterns across all interfaces
- Use existing toast/notification systems for user feedback
- Test all functionality thoroughly before deployment
- Follow existing code patterns and naming conventions