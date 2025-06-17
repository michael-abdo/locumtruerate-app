// Enterprise Multi-Company Support Service
// This service provides organizational management, team roles, and permissions for enterprise clients

class EnterpriseService {
  constructor(env) {
    this.env = env;
    
    // Role definitions with permissions
    this.roles = {
      ORGANIZATION_OWNER: {
        name: 'Organization Owner',
        permissions: [
          'manage_organization',
          'manage_companies',
          'manage_all_jobs',
          'manage_all_users',
          'view_all_analytics',
          'manage_billing',
          'manage_settings'
        ]
      },
      COMPANY_ADMIN: {
        name: 'Company Admin',
        permissions: [
          'manage_company',
          'manage_company_jobs',
          'manage_company_users',
          'view_company_analytics',
          'manage_company_settings'
        ]
      },
      HIRING_MANAGER: {
        name: 'Hiring Manager',
        permissions: [
          'create_jobs',
          'edit_own_jobs',
          'view_applications',
          'manage_applications',
          'view_job_analytics'
        ]
      },
      RECRUITER: {
        name: 'Recruiter',
        permissions: [
          'view_jobs',
          'view_applications',
          'comment_applications',
          'export_applications'
        ]
      },
      VIEWER: {
        name: 'Viewer',
        permissions: [
          'view_jobs',
          'view_basic_analytics'
        ]
      }
    };
    
    // Activity types for audit logging
    this.activityTypes = {
      ORGANIZATION_CREATED: 'organization_created',
      COMPANY_ADDED: 'company_added',
      USER_INVITED: 'user_invited',
      USER_ROLE_CHANGED: 'user_role_changed',
      JOB_CREATED: 'job_created',
      JOB_UPDATED: 'job_updated',
      JOB_DELETED: 'job_deleted',
      APPLICATION_VIEWED: 'application_viewed',
      APPLICATION_STATUS_CHANGED: 'application_status_changed',
      SETTINGS_UPDATED: 'settings_updated'
    };
    
    // Enterprise features
    this.features = {
      SSO_INTEGRATION: 'sso_integration',
      CUSTOM_BRANDING: 'custom_branding',
      API_ACCESS: 'api_access',
      ADVANCED_ANALYTICS: 'advanced_analytics',
      BULK_OPERATIONS: 'bulk_operations',
      CUSTOM_WORKFLOWS: 'custom_workflows',
      DEDICATED_SUPPORT: 'dedicated_support'
    };
  }

  // Create a new organization
  async createOrganization(data) {
    try {
      const organizationId = crypto.randomUUID();
      
      const organization = {
        id: organizationId,
        name: data.name,
        domain: data.domain,
        logo: data.logo || null,
        description: data.description || '',
        website: data.website || '',
        industry: data.industry || 'technology',
        size: data.size || 'medium', // small, medium, large, enterprise
        plan: data.plan || 'professional', // professional, enterprise, custom
        features: this.getFeaturesByPlan(data.plan || 'professional'),
        settings: {
          allowPublicProfiles: true,
          requireApprovalForJobs: false,
          enableSSOLogin: false,
          customBranding: {},
          notificationPreferences: {
            newApplications: true,
            jobExpiring: true,
            weeklyReport: true
          }
        },
        createdAt: new Date().toISOString(),
        createdBy: data.createdBy,
        status: 'active',
        billingInfo: {
          plan: data.plan || 'professional',
          billingCycle: 'monthly',
          nextBillingDate: this.getNextBillingDate(),
          paymentMethod: null
        }
      };
      
      await this.env.ORGANIZATIONS.put(organizationId, JSON.stringify(organization));
      
      // Create the first company under the organization
      const companyId = await this.addCompanyToOrganization(organizationId, {
        name: data.companyName || data.name,
        description: data.companyDescription || '',
        isHeadquarters: true
      });
      
      // Add the creator as organization owner
      await this.addUserToOrganization(organizationId, {
        userId: data.createdBy,
        email: data.creatorEmail,
        name: data.creatorName,
        role: 'ORGANIZATION_OWNER',
        companyIds: [companyId]
      });
      
      // Log activity
      await this.logActivity({
        organizationId,
        type: this.activityTypes.ORGANIZATION_CREATED,
        userId: data.createdBy,
        metadata: { organizationName: data.name }
      });
      
      return {
        success: true,
        organizationId,
        companyId,
        organization
      };
    } catch (error) {
      console.error('Error creating organization:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Add a company to an organization
  async addCompanyToOrganization(organizationId, companyData) {
    try {
      const companyId = crypto.randomUUID();
      
      const company = {
        id: companyId,
        organizationId,
        name: companyData.name,
        description: companyData.description || '',
        logo: companyData.logo || null,
        website: companyData.website || '',
        location: companyData.location || '',
        industry: companyData.industry || '',
        size: companyData.size || '',
        isHeadquarters: companyData.isHeadquarters || false,
        settings: {
          jobPostingApproval: false,
          defaultJobDuration: 30,
          autoRenewalEnabled: true,
          customFields: []
        },
        createdAt: new Date().toISOString(),
        status: 'active',
        stats: {
          totalJobs: 0,
          activeJobs: 0,
          totalApplications: 0,
          totalHires: 0
        }
      };
      
      await this.env.COMPANIES.put(companyId, JSON.stringify(company));
      
      // Update organization with new company
      await this.updateOrganizationCompanies(organizationId, companyId);
      
      // Log activity
      await this.logActivity({
        organizationId,
        companyId,
        type: this.activityTypes.COMPANY_ADDED,
        metadata: { companyName: companyData.name }
      });
      
      return companyId;
    } catch (error) {
      console.error('Error adding company:', error);
      throw error;
    }
  }

  // Add user to organization with role and permissions
  async addUserToOrganization(organizationId, userData) {
    try {
      const userId = userData.userId || crypto.randomUUID();
      
      const user = {
        id: userId,
        organizationId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        companyIds: userData.companyIds || [],
        permissions: this.roles[userData.role]?.permissions || [],
        avatar: userData.avatar || null,
        title: userData.title || '',
        department: userData.department || '',
        status: 'active',
        invitedAt: new Date().toISOString(),
        invitedBy: userData.invitedBy || null,
        lastActiveAt: null,
        settings: {
          emailNotifications: true,
          twoFactorAuth: false,
          timezone: 'UTC'
        }
      };
      
      await this.env.ORGANIZATION_USERS.put(`${organizationId}_${userId}`, JSON.stringify(user));
      
      // Send invitation email if new user
      if (!userData.userId) {
        await this.sendInvitationEmail(user, organizationId);
      }
      
      // Log activity
      await this.logActivity({
        organizationId,
        type: this.activityTypes.USER_INVITED,
        userId: userData.invitedBy,
        metadata: { 
          invitedUserEmail: userData.email,
          role: userData.role 
        }
      });
      
      return {
        success: true,
        userId,
        user
      };
    } catch (error) {
      console.error('Error adding user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get organization dashboard data
  async getOrganizationDashboard(organizationId, userId) {
    try {
      // Verify user has permission
      const hasPermission = await this.checkPermission(organizationId, userId, 'view_all_analytics');
      if (!hasPermission) {
        throw new Error('Insufficient permissions');
      }
      
      const organization = await this.getOrganization(organizationId);
      const companies = await this.getOrganizationCompanies(organizationId);
      const users = await this.getOrganizationUsers(organizationId);
      
      // Aggregate statistics
      const stats = {
        totalCompanies: companies.length,
        totalUsers: users.length,
        totalJobs: 0,
        activeJobs: 0,
        totalApplications: 0,
        applicationsThisMonth: 0,
        averageTimeToHire: 0,
        topPerformingJobs: []
      };
      
      // Collect stats from all companies
      for (const company of companies) {
        const companyStats = await this.getCompanyStats(company.id);
        stats.totalJobs += companyStats.totalJobs;
        stats.activeJobs += companyStats.activeJobs;
        stats.totalApplications += companyStats.totalApplications;
      }
      
      // Get recent activity
      const recentActivity = await this.getRecentActivity(organizationId, 20);
      
      // Get user breakdown by role
      const usersByRole = {};
      Object.keys(this.roles).forEach(role => {
        usersByRole[role] = users.filter(u => u.role === role).length;
      });
      
      return {
        organization,
        companies,
        stats,
        usersByRole,
        recentActivity,
        features: organization.features,
        billingInfo: organization.billingInfo
      };
    } catch (error) {
      console.error('Error getting organization dashboard:', error);
      throw error;
    }
  }

  // Manage company-specific operations
  async createJobForCompany(companyId, jobData, userId) {
    try {
      // Verify user has permission
      const company = await this.getCompany(companyId);
      const hasPermission = await this.checkPermission(
        company.organizationId,
        userId,
        'create_jobs'
      );
      
      if (!hasPermission) {
        throw new Error('Insufficient permissions to create jobs');
      }
      
      // Check if approval is required
      if (company.settings.jobPostingApproval) {
        jobData.status = 'pending_approval';
        jobData.requiresApproval = true;
      }
      
      // Add company and organization info
      jobData.companyId = companyId;
      jobData.organizationId = company.organizationId;
      jobData.createdBy = userId;
      
      // Create the job
      const jobId = crypto.randomUUID();
      const job = {
        ...jobData,
        id: jobId,
        createdAt: new Date().toISOString()
      };
      
      await this.env.JOBS.put(jobId, JSON.stringify(job));
      
      // Update company stats
      await this.updateCompanyStats(companyId, { totalJobs: 1, activeJobs: 1 });
      
      // Log activity
      await this.logActivity({
        organizationId: company.organizationId,
        companyId,
        type: this.activityTypes.JOB_CREATED,
        userId,
        metadata: { jobId, jobTitle: jobData.title }
      });
      
      return {
        success: true,
        jobId,
        job
      };
    } catch (error) {
      console.error('Error creating job for company:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Permission checking
  async checkPermission(organizationId, userId, permission) {
    try {
      const userKey = `${organizationId}_${userId}`;
      const userData = await this.env.ORGANIZATION_USERS.get(userKey);
      
      if (!userData) {
        return false;
      }
      
      const user = JSON.parse(userData);
      return user.permissions.includes(permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Get user's accessible companies
  async getUserCompanies(organizationId, userId) {
    try {
      const user = await this.getOrganizationUser(organizationId, userId);
      
      if (!user) {
        return [];
      }
      
      // Organization owners can access all companies
      if (user.role === 'ORGANIZATION_OWNER') {
        return await this.getOrganizationCompanies(organizationId);
      }
      
      // Other users can only access assigned companies
      const companies = [];
      for (const companyId of user.companyIds) {
        const company = await this.getCompany(companyId);
        if (company) {
          companies.push(company);
        }
      }
      
      return companies;
    } catch (error) {
      console.error('Error getting user companies:', error);
      return [];
    }
  }

  // Advanced analytics for enterprise
  async getEnterpriseAnalytics(organizationId, options = {}) {
    try {
      const { startDate, endDate, groupBy = 'day' } = options;
      
      const analytics = {
        overview: {
          totalCompanies: 0,
          totalJobs: 0,
          totalApplications: 0,
          totalHires: 0,
          averageTimeToHire: 0,
          applicationConversionRate: 0
        },
        byCompany: [],
        byCategory: {},
        byLocation: {},
        trends: {
          applications: [],
          jobs: [],
          hires: []
        },
        topPerformers: {
          jobs: [],
          companies: [],
          recruiters: []
        }
      };
      
      // Get all companies
      const companies = await this.getOrganizationCompanies(organizationId);
      analytics.overview.totalCompanies = companies.length;
      
      // Aggregate data from all companies
      for (const company of companies) {
        const companyAnalytics = await this.getCompanyAnalytics(company.id, options);
        
        analytics.overview.totalJobs += companyAnalytics.totalJobs;
        analytics.overview.totalApplications += companyAnalytics.totalApplications;
        analytics.overview.totalHires += companyAnalytics.totalHires;
        
        analytics.byCompany.push({
          companyId: company.id,
          companyName: company.name,
          metrics: companyAnalytics
        });
      }
      
      // Calculate conversion rate
      if (analytics.overview.totalApplications > 0) {
        analytics.overview.applicationConversionRate = 
          (analytics.overview.totalHires / analytics.overview.totalApplications) * 100;
      }
      
      return analytics;
    } catch (error) {
      console.error('Error getting enterprise analytics:', error);
      throw error;
    }
  }

  // Team collaboration features
  async addCommentToApplication(applicationId, userId, comment) {
    try {
      const commentId = crypto.randomUUID();
      
      const commentData = {
        id: commentId,
        applicationId,
        userId,
        text: comment,
        createdAt: new Date().toISOString(),
        mentions: this.extractMentions(comment),
        attachments: []
      };
      
      await this.env.APPLICATION_COMMENTS.put(
        `${applicationId}_${commentId}`,
        JSON.stringify(commentData)
      );
      
      // Notify mentioned users
      for (const mentionedUserId of commentData.mentions) {
        await this.notifyUser(mentionedUserId, {
          type: 'mention_in_comment',
          applicationId,
          commentId,
          mentionedBy: userId
        });
      }
      
      return {
        success: true,
        comment: commentData
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper methods
  async getOrganization(organizationId) {
    const data = await this.env.ORGANIZATIONS.get(organizationId);
    return data ? JSON.parse(data) : null;
  }

  async getCompany(companyId) {
    const data = await this.env.COMPANIES.get(companyId);
    return data ? JSON.parse(data) : null;
  }

  async getOrganizationCompanies(organizationId) {
    const companies = [];
    const list = await this.env.COMPANIES.list();
    
    for (const key of list.keys) {
      const companyData = await this.env.COMPANIES.get(key.name);
      if (companyData) {
        const company = JSON.parse(companyData);
        if (company.organizationId === organizationId) {
          companies.push(company);
        }
      }
    }
    
    return companies;
  }

  async getOrganizationUsers(organizationId) {
    const users = [];
    const list = await this.env.ORGANIZATION_USERS.list();
    
    for (const key of list.keys) {
      if (key.name.startsWith(organizationId)) {
        const userData = await this.env.ORGANIZATION_USERS.get(key.name);
        if (userData) {
          users.push(JSON.parse(userData));
        }
      }
    }
    
    return users;
  }

  async getOrganizationUser(organizationId, userId) {
    const key = `${organizationId}_${userId}`;
    const data = await this.env.ORGANIZATION_USERS.get(key);
    return data ? JSON.parse(data) : null;
  }

  async updateOrganizationCompanies(organizationId, companyId) {
    const org = await this.getOrganization(organizationId);
    if (org) {
      if (!org.companyIds) {
        org.companyIds = [];
      }
      org.companyIds.push(companyId);
      await this.env.ORGANIZATIONS.put(organizationId, JSON.stringify(org));
    }
  }

  async updateCompanyStats(companyId, updates) {
    const company = await this.getCompany(companyId);
    if (company) {
      Object.keys(updates).forEach(key => {
        if (company.stats[key] !== undefined) {
          company.stats[key] += updates[key];
        }
      });
      await this.env.COMPANIES.put(companyId, JSON.stringify(company));
    }
  }

  async getCompanyStats(companyId) {
    const company = await this.getCompany(companyId);
    return company ? company.stats : {
      totalJobs: 0,
      activeJobs: 0,
      totalApplications: 0,
      totalHires: 0
    };
  }

  async getCompanyAnalytics(companyId, options) {
    // Mock implementation - in production, would aggregate real data
    return {
      totalJobs: Math.floor(Math.random() * 50) + 10,
      totalApplications: Math.floor(Math.random() * 200) + 50,
      totalHires: Math.floor(Math.random() * 20) + 5,
      averageTimeToHire: Math.floor(Math.random() * 30) + 10
    };
  }

  async logActivity(activity) {
    const activityId = crypto.randomUUID();
    const activityData = {
      id: activityId,
      ...activity,
      timestamp: new Date().toISOString()
    };
    
    await this.env.ACTIVITY_LOG.put(
      `${activity.organizationId}_${activityId}`,
      JSON.stringify(activityData)
    );
  }

  async getRecentActivity(organizationId, limit = 20) {
    const activities = [];
    const list = await this.env.ACTIVITY_LOG.list();
    
    for (const key of list.keys) {
      if (key.name.startsWith(organizationId)) {
        const activityData = await this.env.ACTIVITY_LOG.get(key.name);
        if (activityData) {
          activities.push(JSON.parse(activityData));
        }
      }
    }
    
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  async sendInvitationEmail(user, organizationId) {
    // Mock implementation - would integrate with email service
    console.log(`Invitation email sent to ${user.email} for organization ${organizationId}`);
  }

  async notifyUser(userId, notification) {
    // Mock implementation - would integrate with notification service
    console.log(`Notification sent to user ${userId}:`, notification);
  }

  extractMentions(text) {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }

  getFeaturesByPlan(plan) {
    const features = {
      professional: [
        this.features.BULK_OPERATIONS,
        this.features.ADVANCED_ANALYTICS
      ],
      enterprise: [
        this.features.BULK_OPERATIONS,
        this.features.ADVANCED_ANALYTICS,
        this.features.SSO_INTEGRATION,
        this.features.CUSTOM_BRANDING,
        this.features.API_ACCESS,
        this.features.DEDICATED_SUPPORT
      ],
      custom: Object.values(this.features)
    };
    
    return features[plan] || features.professional;
  }

  getNextBillingDate() {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString();
  }
}

export { EnterpriseService };