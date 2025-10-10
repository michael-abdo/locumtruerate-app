/**
 * Bug Reporter Widget for LocumCalc
 * Vanilla JavaScript bug reporting system
 */

class BugReporter {
    constructor() {
        this.isInitialized = false;
        this.modal = null;
        this.floating = null;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.createFloatingButton();
        this.createModal();
        this.attachEventListeners();
        this.isInitialized = true;
    }

    createFloatingButton() {
        this.floating = document.createElement('div');
        this.floating.id = 'bug-reporter-floating';
        this.floating.innerHTML = `
            <button id="bug-report-btn" title="Report a Bug">
                🐛
            </button>
        `;
        this.floating.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: inherit;
        `;

        const button = this.floating.querySelector('#bug-report-btn');
        button.style.cssText = `
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: var(--primary-color, #007bff);
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        });

        document.body.appendChild(this.floating);
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.id = 'bug-reporter-modal';
        this.modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: none;
            align-items: center;
            justify-content: center;
            font-family: inherit;
        `;

        this.modal.innerHTML = `
            <div class="bug-reporter-content" style="
                background: white;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 90%;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            ">
                <div style="padding: 1.5rem; border-bottom: 1px solid #eee;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0; color: var(--primary-color, #007bff);">🐛 Report a Bug</h2>
                        <button id="bug-reporter-close" style="
                            background: none;
                            border: none;
                            font-size: 24px;
                            cursor: pointer;
                            color: #666;
                            padding: 0;
                            width: 30px;
                            height: 30px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">×</button>
                    </div>
                </div>
                
                <form id="bug-report-form" style="padding: 1.5rem;">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                            Bug Title *
                        </label>
                        <input type="text" id="bug-title" required style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 2px solid #ddd;
                            border-radius: 6px;
                            font-size: 14px;
                            box-sizing: border-box;
                        " placeholder="Brief description of the issue">
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                            Bug Type
                        </label>
                        <select id="bug-type" style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 2px solid #ddd;
                            border-radius: 6px;
                            font-size: 14px;
                            box-sizing: border-box;
                        ">
                            <option value="ui">UI/Visual Issue</option>
                            <option value="functionality">Functionality Not Working</option>
                            <option value="performance">Performance Issue</option>
                            <option value="data">Data/Calculation Error</option>
                            <option value="security">Security Concern</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                            Priority
                        </label>
                        <select id="bug-priority" style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 2px solid #ddd;
                            border-radius: 6px;
                            font-size: 14px;
                            box-sizing: border-box;
                        ">
                            <option value="low">Low - Minor issue</option>
                            <option value="medium" selected>Medium - Affects some users</option>
                            <option value="high">High - Blocks important functionality</option>
                            <option value="critical">Critical - Site breaking</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                            Steps to Reproduce
                        </label>
                        <textarea id="bug-steps" rows="4" style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 2px solid #ddd;
                            border-radius: 6px;
                            font-size: 14px;
                            resize: vertical;
                            box-sizing: border-box;
                        " placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."></textarea>
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                            Expected vs Actual Behavior
                        </label>
                        <textarea id="bug-description" rows="4" required style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 2px solid #ddd;
                            border-radius: 6px;
                            font-size: 14px;
                            resize: vertical;
                            box-sizing: border-box;
                        " placeholder="Expected: The form should submit successfully...&#10;Actual: Got an error message..."></textarea>
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                            Additional Information
                        </label>
                        <textarea id="bug-additional" rows="3" style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 2px solid #ddd;
                            border-radius: 6px;
                            font-size: 14px;
                            resize: vertical;
                            box-sizing: border-box;
                        " placeholder="Browser, device, any error messages, etc."></textarea>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px; font-size: 13px; color: #666;">
                            <strong>System Info:</strong>
                            <div id="system-info" style="margin-top: 0.5rem; font-family: monospace;"></div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" id="bug-cancel" style="
                            padding: 0.75rem 1.5rem;
                            border: 2px solid #ddd;
                            background: white;
                            color: #666;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 600;
                        ">Cancel</button>
                        <button type="submit" style="
                            padding: 0.75rem 1.5rem;
                            border: none;
                            background: var(--primary-color, #007bff);
                            color: white;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 600;
                        ">Submit Bug Report</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(this.modal);
    }

    attachEventListeners() {
        // Open modal
        document.getElementById('bug-report-btn').addEventListener('click', () => {
            this.openModal();
        });

        // Close modal
        document.getElementById('bug-reporter-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('bug-cancel').addEventListener('click', () => {
            this.closeModal();
        });

        // Close on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Handle form submission
        document.getElementById('bug-report-form').addEventListener('submit', (e) => {
            this.submitBug(e);
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.populateSystemInfo();
        this.modal.style.display = 'flex';
        document.getElementById('bug-title').focus();
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.resetForm();
    }

    resetForm() {
        document.getElementById('bug-report-form').reset();
    }

    populateSystemInfo() {
        const systemInfo = {
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            screen: `${screen.width}x${screen.height}`,
            referrer: document.referrer || 'Direct'
        };

        const systemInfoEl = document.getElementById('system-info');
        systemInfoEl.innerHTML = Object.entries(systemInfo)
            .map(([key, value]) => `${key}: ${value}`)
            .join('<br>');
    }

    async submitBug(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            const formData = {
                title: document.getElementById('bug-title').value,
                type: document.getElementById('bug-type').value,
                priority: document.getElementById('bug-priority').value,
                steps: document.getElementById('bug-steps').value,
                description: document.getElementById('bug-description').value,
                additional: document.getElementById('bug-additional').value,
                systemInfo: {
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                    viewport: `${window.innerWidth}x${window.innerHeight}`,
                    screen: `${screen.width}x${screen.height}`,
                    referrer: document.referrer || 'Direct'
                },
                userInfo: this.getUserInfo()
            };

            const result = await this.sendBugReport(formData);
            
            if (result.success) {
                this.showToast('Bug report submitted successfully! Thank you for helping improve the platform.', 'success');
                this.closeModal();
            } else {
                throw new Error(result.error || 'Failed to submit bug report');
            }
        } catch (error) {
            console.error('Bug report submission error:', error);
            this.showToast('Failed to submit bug report. Please try again or contact support.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    async sendBugReport(formData) {
        try {
            // Check if we have the API base URL
            const apiBase = window.AUTH_CONFIG?.API_BASE || 'https://locumtruerate-staging-66ba3177c382.herokuapp.com';
            
            const response = await fetch(`${apiBase}/api/v1/bugs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Include auth token if available
                    ...(this.getAuthToken() && { 'Authorization': `Bearer ${this.getAuthToken()}` })
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            return { success: response.ok, data, error: data.error };
        } catch (error) {
            // Fallback: send via email or store locally
            console.warn('Bug report API not available, using fallback method');
            return this.fallbackBugReport(formData);
        }
    }

    fallbackBugReport(formData) {
        // Store in localStorage as fallback
        const bugs = JSON.parse(localStorage.getItem('pending_bug_reports') || '[]');
        bugs.push({
            id: Date.now(),
            ...formData,
            submitted: false,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('pending_bug_reports', JSON.stringify(bugs));
        
        console.log('Bug report stored locally:', formData);
        return { success: true, data: { message: 'Bug report stored locally for later submission' } };
    }

    getUserInfo() {
        try {
            // Try to get user info from auth system
            if (typeof getUserInfo === 'function') {
                return getUserInfo();
            }
            
            // Fallback to localStorage
            const userInfo = localStorage.getItem('locum_user_data');
            return userInfo ? JSON.parse(userInfo) : { anonymous: true };
        } catch (error) {
            return { anonymous: true };
        }
    }

    getAuthToken() {
        try {
            return localStorage.getItem('locum_auth_token');
        } catch (error) {
            return null;
        }
    }

    showToast(message, type = 'info') {
        // Use existing toast function if available
        if (typeof showToast === 'function') {
            showToast(message, type);
            return;
        }

        // Fallback toast
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10001;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }
}

// Initialize bug reporter when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.bugReporter = new BugReporter();
    });
} else {
    window.bugReporter = new BugReporter();
}