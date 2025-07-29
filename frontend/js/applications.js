// Applications tracking functionality
(function() {
    'use strict';

    // State management
    let currentPage = 1;
    let totalPages = 1;
    let currentApplications = [];
    let currentFilters = {
        status: '',
        search: '',
        sort_by: 'created_at',
        sort_order: 'DESC'
    };

    // Status display mapping
    const statusDisplayMap = {
        'draft': 'Draft',
        'submitted': 'Submitted',
        'under_review': 'Under Review',
        'interview_scheduled': 'Interview Scheduled',
        'interviewed': 'Interviewed',
        'offer_extended': 'Offer Extended',
        'accepted': 'Accepted',
        'rejected': 'Rejected',
        'withdrawn': 'Withdrawn',
        'expired': 'Expired'
    };

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        // Check authentication
        if (!window.AuthManager || !window.AuthManager.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        // Initialize filters
        initializeFilters();
        
        // Load applications
        loadApplications();
        
        // Load statistics
        loadStatistics();
    });

    // Initialize filter event listeners
    function initializeFilters() {
        const statusFilter = document.getElementById('statusFilter');
        const sortBy = document.getElementById('sortBy');
        const searchInput = document.getElementById('searchInput');

        statusFilter.addEventListener('change', function() {
            currentFilters.status = this.value;
            currentPage = 1;
            loadApplications();
        });

        sortBy.addEventListener('change', function() {
            const [field, order] = this.value.split(':');
            currentFilters.sort_by = field;
            currentFilters.sort_order = order;
            currentPage = 1;
            loadApplications();
        });

        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.search = this.value;
                currentPage = 1;
                loadApplications();
            }, 300);
        });
    }

    // Load applications from API
    async function loadApplications() {
        const container = document.getElementById('applicationsList');
        container.innerHTML = '<div class="loading-spinner">Loading applications...</div>';

        try {
            const user = window.AuthManager.getUser();
            const params = new URLSearchParams({
                user_id: user.id,
                page: currentPage,
                limit: 10,
                sort_by: currentFilters.sort_by,
                sort_order: currentFilters.sort_order
            });

            if (currentFilters.status) {
                params.append('status', currentFilters.status);
            }
            if (currentFilters.search) {
                params.append('search', currentFilters.search);
            }

            const response = await window.apiClient.get(`/applications?${params}`);
            
            if (response.applications && response.applications.length > 0) {
                currentApplications = response.applications;
                renderApplications(response.applications);
                renderPagination(response.pagination);
            } else {
                renderEmptyState();
            }
        } catch (error) {
            console.error('Error loading applications:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <p style="color: #dc2626;">Failed to load applications. Please try again.</p>
                </div>
            `;
        }
    }

    // Render applications list
    function renderApplications(applications) {
        const container = document.getElementById('applicationsList');
        container.innerHTML = applications.map(app => `
            <div class="application-card" data-id="${app.id}">
                <div class="application-header">
                    <div class="application-title">
                        <h3>${app.job_title || 'Position'}</h3>
                        <div class="application-company">${app.job_company || 'Company'}</div>
                    </div>
                    <span class="application-status status-${app.application_status}">
                        ${statusDisplayMap[app.application_status] || app.application_status}
                    </span>
                </div>
                <div class="application-details">
                    <div class="detail-item">
                        <span class="detail-label">Location</span>
                        <span class="detail-value">${app.job_location || 'Not specified'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Applied</span>
                        <span class="detail-value">${formatDate(app.created_at)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Rate Expectation</span>
                        <span class="detail-value">
                            ${app.hourly_rate_expectation ? `$${app.hourly_rate_expectation}/hr` : 'Not specified'}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Last Updated</span>
                        <span class="detail-value">${formatDate(app.updated_at)}</span>
                    </div>
                </div>
                <div class="application-actions">
                    <button type="button" class="btn btn-primary" onclick="viewApplicationDetails(${app.id})">
                        View Details
                    </button>
                    ${app.application_status === 'draft' ? `
                        <button type="button" class="btn btn-secondary" onclick="editApplication(${app.id})">
                            Edit Draft
                        </button>
                    ` : ''}
                    ${['submitted', 'under_review'].includes(app.application_status) ? `
                        <button type="button" class="btn btn-danger" onclick="withdrawApplication(${app.id})">
                            Withdraw
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // Render empty state
    function renderEmptyState() {
        const container = document.getElementById('applicationsList');
        const filterActive = currentFilters.status || currentFilters.search;
        
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>${filterActive ? 'No matching applications found' : 'No applications yet'}</h3>
                <p>${filterActive ? 'Try adjusting your filters' : 'Start applying to jobs to track your applications here'}</p>
                ${!filterActive ? '<a href="job-board.html" class="btn btn-primary">Browse Jobs</a>' : ''}
            </div>
        `;
    }

    // Render pagination
    function renderPagination(pagination) {
        const container = document.getElementById('paginationContainer');
        
        if (pagination.total_pages <= 1) {
            container.innerHTML = '';
            return;
        }

        totalPages = pagination.total_pages;
        currentPage = pagination.current_page;

        let html = '';
        
        // Previous button
        html += `
            <button type="button" ${!pagination.has_prev ? 'disabled' : ''} 
                    onclick="changePage(${currentPage - 1})">
                Previous
            </button>
        `;

        // Page numbers
        const maxButtons = 5;
        let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let end = Math.min(totalPages, start + maxButtons - 1);
        
        if (end - start + 1 < maxButtons) {
            start = Math.max(1, end - maxButtons + 1);
        }

        for (let i = start; i <= end; i++) {
            html += `
                <button type="button" class="${i === currentPage ? 'active' : ''}"
                        onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        }

        // Next button
        html += `
            <button type="button" ${!pagination.has_next ? 'disabled' : ''} 
                    onclick="changePage(${currentPage + 1})">
                Next
            </button>
        `;

        // Page info
        html += `<span class="page-info">Page ${currentPage} of ${totalPages}</span>`;

        container.innerHTML = html;
    }

    // Load statistics
    async function loadStatistics() {
        try {
            const user = window.AuthManager.getUser();
            const response = await window.apiClient.get(`/applications/stats?user_id=${user.id}`);
            
            if (response) {
                document.getElementById('totalApplications').textContent = response.total_applications || 0;
                document.getElementById('activeApplications').textContent = 
                    (response.submitted_count || 0) + (response.under_review_count || 0);
                document.getElementById('interviewApplications').textContent = 
                    (response.interview_scheduled_count || 0) + (response.interviewed_count || 0);
                document.getElementById('offerApplications').textContent = response.offer_extended_count || 0;
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    // View application details
    window.viewApplicationDetails = async function(applicationId) {
        try {
            const response = await window.apiClient.get(`/applications/${applicationId}`);
            
            if (response) {
                showApplicationDetailsModal(response);
            }
        } catch (error) {
            console.error('Error loading application details:', error);
            window.showNotification('Failed to load application details', 'error');
        }
    };

    // Show application details modal
    function showApplicationDetailsModal(application) {
        const modal = document.getElementById('applicationDetailsModal');
        const content = document.getElementById('applicationDetailsContent');
        
        content.innerHTML = `
            <div class="details-grid">
                <div class="details-section">
                    <h3>Job Information</h3>
                    <div class="details-row">
                        <div class="detail-label">Position</div>
                        <div class="detail-value">${application.job_title || 'Not specified'}</div>
                    </div>
                    <div class="details-row">
                        <div class="detail-label">Company</div>
                        <div class="detail-value">${application.job_company || 'Not specified'}</div>
                    </div>
                    <div class="details-row">
                        <div class="detail-label">Location</div>
                        <div class="detail-value">${application.job_location || 'Not specified'}</div>
                    </div>
                    <div class="details-row">
                        <div class="detail-label">Job Rate</div>
                        <div class="detail-value">${application.job_hourly_rate ? `$${application.job_hourly_rate}/hr` : 'Not specified'}</div>
                    </div>
                </div>
                
                <div class="details-section">
                    <h3>Application Information</h3>
                    <div class="details-row">
                        <div class="detail-label">Status</div>
                        <div class="detail-value">
                            <span class="application-status status-${application.application_status}">
                                ${statusDisplayMap[application.application_status]}
                            </span>
                        </div>
                    </div>
                    <div class="details-row">
                        <div class="detail-label">Applied On</div>
                        <div class="detail-value">${formatDate(application.created_at)}</div>
                    </div>
                    <div class="details-row">
                        <div class="detail-label">Last Updated</div>
                        <div class="detail-value">${formatDate(application.updated_at)}</div>
                    </div>
                    ${application.submitted_at ? `
                        <div class="details-row">
                            <div class="detail-label">Submitted On</div>
                            <div class="detail-value">${formatDate(application.submitted_at)}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            ${application.cover_letter ? `
                <div class="details-section">
                    <h3>Cover Letter</h3>
                    <p>${application.cover_letter.replace(/\n/g, '<br>')}</p>
                </div>
            ` : ''}
            
            ${application.status_history && application.status_history.length > 0 ? `
                <div class="status-history">
                    <h3>Status History</h3>
                    <div class="status-timeline">
                        ${application.status_history.map(entry => `
                            <div class="status-entry">
                                <div class="status-entry-content">
                                    <div class="status-change">
                                        ${entry.previous_status ? 
                                            `${statusDisplayMap[entry.previous_status]} → ${statusDisplayMap[entry.new_status]}` :
                                            statusDisplayMap[entry.new_status]
                                        }
                                    </div>
                                    <div class="status-date">${formatDate(entry.created_at)}</div>
                                    ${entry.notes ? `<div class="status-notes">${entry.notes}</div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
        
        // Show modal
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
        
        // Add close handler
        const closeBtn = modal.querySelector('.modal-close');
        const backdrop = modal.querySelector('.modal-backdrop');
        
        const closeModal = () => {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        };
        
        closeBtn.onclick = closeModal;
        backdrop.onclick = closeModal;
    }

    // Withdraw application
    window.withdrawApplication = function(applicationId) {
        const modal = document.getElementById('withdrawModal');
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
        
        const confirmBtn = document.getElementById('confirmWithdraw');
        const cancelBtn = document.getElementById('cancelWithdraw');
        const closeBtn = modal.querySelector('.modal-close');
        const backdrop = modal.querySelector('.modal-backdrop');
        
        const closeModal = () => {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        };
        
        // Remove existing listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.onclick = async () => {
            try {
                await window.apiClient.put(`/applications/${applicationId}`, {
                    application_status: 'withdrawn',
                    status_change_reason: 'Withdrawn by applicant'
                });
                
                window.showNotification('Application withdrawn successfully', 'success');
                closeModal();
                loadApplications();
                loadStatistics();
            } catch (error) {
                console.error('Error withdrawing application:', error);
                window.showNotification('Failed to withdraw application', 'error');
            }
        };
        
        cancelBtn.onclick = closeModal;
        closeBtn.onclick = closeModal;
        backdrop.onclick = closeModal;
    };

    // Edit draft application
    window.editApplication = function(applicationId) {
        // For now, redirect to job board with application ID
        // In a full implementation, this would open an edit modal
        window.location.href = `job-board.html?edit_application=${applicationId}`;
    };

    // Change page
    window.changePage = function(page) {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            currentPage = page;
            loadApplications();
        }
    };

    // Utility function to format dates
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }
})();