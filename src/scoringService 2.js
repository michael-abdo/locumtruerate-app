// Application Scoring and Ranking Service
// This service analyzes job applications and provides intelligent scoring based on multiple criteria

class ApplicationScoringService {
  constructor(env) {
    this.env = env;
    
    // Scoring weights (can be customized per job category)
    this.defaultWeights = {
      experienceMatch: 0.25,      // How well experience matches job requirements
      skillsMatch: 0.30,          // Keyword matching and skill relevance
      educationMatch: 0.15,       // Education level and field relevance
      portfolioQuality: 0.10,     // Portfolio URL presence and quality indicators
      coverLetterQuality: 0.15,  // Cover letter length, professionalism, customization
      responseTime: 0.05          // How quickly they applied after job posting
    };
    
    // Skills keywords by category
    this.skillsDatabase = {
      engineering: {
        frontend: ['javascript', 'react', 'vue', 'angular', 'html', 'css', 'typescript', 'sass', 'webpack'],
        backend: ['node.js', 'python', 'java', 'php', 'ruby', 'go', 'rust', 'api', 'database', 'sql'],
        mobile: ['react native', 'flutter', 'ios', 'android', 'swift', 'kotlin', 'xamarin'],
        devops: ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins', 'git', 'ci/cd'],
        data: ['machine learning', 'ai', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'sql', 'nosql']
      },
      design: {
        ui: ['figma', 'sketch', 'adobe xd', 'prototyping', 'wireframing', 'user interface'],
        ux: ['user experience', 'user research', 'usability testing', 'persona', 'journey mapping'],
        graphic: ['photoshop', 'illustrator', 'indesign', 'branding', 'logo design', 'print design'],
        web: ['responsive design', 'mobile first', 'accessibility', 'design systems', 'component library']
      },
      marketing: {
        digital: ['seo', 'sem', 'google ads', 'facebook ads', 'social media', 'email marketing'],
        content: ['content strategy', 'copywriting', 'blog writing', 'social media content'],
        analytics: ['google analytics', 'conversion optimization', 'a/b testing', 'data analysis'],
        growth: ['growth hacking', 'user acquisition', 'retention', 'funnel optimization']
      },
      sales: {
        b2b: ['enterprise sales', 'lead generation', 'cold calling', 'crm', 'salesforce'],
        b2c: ['retail sales', 'customer service', 'relationship building', 'upselling'],
        inside: ['inside sales', 'phone sales', 'email outreach', 'lead qualification'],
        field: ['field sales', 'territory management', 'client visits', 'relationship management']
      }
    };
  }

  // Main scoring function for an application
  async scoreApplication(application, job) {
    try {
      const scores = {
        experienceMatch: this.scoreExperienceMatch(application, job),
        skillsMatch: this.scoreSkillsMatch(application, job),
        educationMatch: this.scoreEducationMatch(application, job),
        portfolioQuality: this.scorePortfolioQuality(application),
        coverLetterQuality: this.scoreCoverLetterQuality(application, job),
        responseTime: this.scoreResponseTime(application, job)
      };

      // Calculate weighted total score
      const weights = this.getWeightsForJobCategory(job.category);
      const totalScore = Object.keys(scores).reduce((total, criterion) => {
        return total + (scores[criterion] * weights[criterion]);
      }, 0);

      // Generate detailed analysis
      const analysis = this.generateAnalysis(scores, application, job);
      
      // Determine overall recommendation
      const recommendation = this.getRecommendation(totalScore, scores);

      return {
        totalScore: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
        maxScore: 100,
        scores,
        weights,
        analysis,
        recommendation,
        calculatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error scoring application:', error);
      return {
        totalScore: 0,
        error: 'Scoring failed',
        calculatedAt: new Date().toISOString()
      };
    }
  }

  // Score experience match (0-100)
  scoreExperienceMatch(application, job) {
    const requiredExperience = this.extractExperienceFromJob(job);
    const candidateExperience = parseInt(application.experience) || 0;

    if (requiredExperience === 0) return 85; // No specific requirement

    if (candidateExperience >= requiredExperience) {
      // Perfect match or overqualified
      const overqualification = candidateExperience - requiredExperience;
      if (overqualification <= 2) return 100; // Perfect range
      if (overqualification <= 5) return 90;  // Slightly overqualified
      return 70; // Significantly overqualified (might be flight risk)
    } else {
      // Underqualified
      const gap = requiredExperience - candidateExperience;
      if (gap <= 1) return 80; // Close enough
      if (gap <= 2) return 60; // Somewhat close
      if (gap <= 3) return 40; // Significant gap
      return 20; // Large gap
    }
  }

  // Score skills match based on keyword analysis (0-100)
  scoreSkillsMatch(application, job) {
    const jobSkills = this.extractSkillsFromJob(job);
    const applicationSkills = this.extractSkillsFromApplication(application);

    if (jobSkills.length === 0) return 75; // No specific skills mentioned

    const matches = jobSkills.filter(skill => 
      applicationSkills.some(appSkill => 
        appSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(appSkill.toLowerCase())
      )
    );

    const matchPercentage = matches.length / jobSkills.length;
    
    // Bonus for additional relevant skills
    const categorySkills = this.getCategorySkills(job.category);
    const bonusSkills = applicationSkills.filter(skill =>
      categorySkills.some(catSkill => 
        skill.toLowerCase().includes(catSkill.toLowerCase())
      )
    );

    const bonusPoints = Math.min(bonusSkills.length * 5, 20);
    
    return Math.min(matchPercentage * 80 + bonusPoints, 100);
  }

  // Score education match (0-100)
  scoreEducationMatch(application, job) {
    const jobEducation = this.extractEducationFromJob(job);
    const appEducation = application.education || '';

    if (!jobEducation) return 80; // No specific requirement

    const educationLevels = {
      'high school': 1,
      'associate': 2,
      'bachelor': 3,
      'master': 4,
      'phd': 5,
      'doctorate': 5
    };

    const requiredLevel = this.getEducationLevel(jobEducation, educationLevels);
    const candidateLevel = this.getEducationLevel(appEducation, educationLevels);

    if (candidateLevel >= requiredLevel) return 100;
    if (candidateLevel === requiredLevel - 1) return 75;
    if (candidateLevel === requiredLevel - 2) return 50;
    return 25;
  }

  // Score portfolio quality (0-100)
  scorePortfolioQuality(application) {
    const portfolio = application.portfolio || '';
    
    if (!portfolio) return 30; // No portfolio provided

    // Check for valid URL
    try {
      new URL(portfolio);
    } catch {
      return 20; // Invalid URL
    }

    // Analyze URL quality indicators
    const qualityIndicators = [
      portfolio.includes('github.com'),
      portfolio.includes('behance.net'),
      portfolio.includes('dribbble.com'),
      portfolio.includes('linkedin.com'),
      portfolio.includes('portfolio'),
      portfolio.includes('projects'),
      !portfolio.includes('facebook.com'), // Negative indicator
      !portfolio.includes('instagram.com'), // Negative indicator
      portfolio.length > 20 // Substantial URL
    ];

    const qualityScore = qualityIndicators.filter(Boolean).length;
    return Math.min(50 + (qualityScore * 8), 100);
  }

  // Score cover letter quality (0-100)
  scoreCoverLetterQuality(application, job) {
    const coverLetter = application.coverLetter || '';
    
    if (!coverLetter) return 20;

    let score = 40; // Base score for having a cover letter

    // Length analysis
    const wordCount = coverLetter.split(' ').length;
    if (wordCount >= 100 && wordCount <= 300) score += 15; // Good length
    else if (wordCount >= 50) score += 10; // Acceptable length
    else if (wordCount < 20) score -= 10; // Too short

    // Personalization checks
    const companyName = job.company.toLowerCase();
    const jobTitle = job.title.toLowerCase();
    const letterLower = coverLetter.toLowerCase();

    if (letterLower.includes(companyName)) score += 15;
    if (letterLower.includes(jobTitle)) score += 10;

    // Professional language indicators
    const professionalTerms = [
      'experience', 'skills', 'qualified', 'contribute', 'team',
      'passionate', 'excited', 'opportunity', 'role', 'position'
    ];
    
    const professionalCount = professionalTerms.filter(term => 
      letterLower.includes(term)
    ).length;
    score += Math.min(professionalCount * 2, 15);

    // Grammar and structure (basic checks)
    const sentences = coverLetter.split(/[.!?]+/).length;
    if (sentences >= 3) score += 5; // Multiple sentences

    return Math.min(score, 100);
  }

  // Score response time (0-100)
  scoreResponseTime(application, job) {
    const jobPosted = new Date(job.createdAt);
    const applicationTime = new Date(application.appliedAt);
    const hoursDiff = (applicationTime - jobPosted) / (1000 * 60 * 60);

    if (hoursDiff <= 24) return 100;  // Applied within 24 hours
    if (hoursDiff <= 72) return 85;   // Applied within 3 days
    if (hoursDiff <= 168) return 70;  // Applied within 1 week
    if (hoursDiff <= 336) return 55;  // Applied within 2 weeks
    return 40; // Applied later than 2 weeks
  }

  // Rank applications for a specific job
  async rankApplicationsForJob(jobId) {
    try {
      // Get job details
      const jobData = await this.env.JOBS.get(jobId);
      if (!jobData) {
        throw new Error('Job not found');
      }
      const job = JSON.parse(jobData);

      // Get all applications for this job
      const applications = await this.env.APPLICATIONS.list();
      const jobApplications = [];

      for (const key of applications.keys) {
        const application = await this.env.APPLICATIONS.get(key.name);
        if (application) {
          const appData = JSON.parse(application);
          if (appData.jobId === jobId) {
            jobApplications.push(appData);
          }
        }
      }

      // Score each application
      const scoredApplications = [];
      for (const application of jobApplications) {
        const scoring = await this.scoreApplication(application, job);
        scoredApplications.push({
          ...application,
          scoring
        });
      }

      // Sort by score (highest first)
      scoredApplications.sort((a, b) => b.scoring.totalScore - a.scoring.totalScore);

      // Add ranking
      return scoredApplications.map((app, index) => ({
        ...app,
        rank: index + 1,
        rankCategory: this.getRankCategory(app.scoring.totalScore)
      }));

    } catch (error) {
      console.error('Error ranking applications:', error);
      return [];
    }
  }

  // Helper methods
  extractExperienceFromJob(job) {
    const description = (job.description || '').toLowerCase();
    const title = (job.title || '').toLowerCase();
    const combined = `${title} ${description}`;

    // Look for experience patterns
    const patterns = [
      /(\d+)\+?\s*years?\s*of?\s*experience/,
      /(\d+)\+?\s*years?\s*experience/,
      /experience\s*of?\s*(\d+)\+?\s*years?/,
      /minimum\s*(\d+)\s*years?/,
      /at\s*least\s*(\d+)\s*years?/
    ];

    for (const pattern of patterns) {
      const match = combined.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    // Check for seniority levels
    if (combined.includes('senior') || combined.includes('lead')) return 5;
    if (combined.includes('mid') || combined.includes('intermediate')) return 3;
    if (combined.includes('junior') || combined.includes('entry')) return 1;

    return 0; // No specific requirement found
  }

  extractSkillsFromJob(job) {
    const text = `${job.title} ${job.description} ${job.tags || ''}`.toLowerCase();
    const allSkills = Object.values(this.skillsDatabase).flatMap(category => 
      Object.values(category).flat()
    );

    return allSkills.filter(skill => text.includes(skill.toLowerCase()));
  }

  extractSkillsFromApplication(application) {
    const text = `${application.coverLetter || ''} ${application.resume || ''} ${application.skills || ''}`.toLowerCase();
    const skills = [];

    // Extract from common skill patterns
    const skillPatterns = [
      /skills?\s*:?\s*([^.!?]+)/gi,
      /experienced?\s*in\s*([^.!?]+)/gi,
      /proficient\s*in\s*([^.!?]+)/gi,
      /knowledge\s*of\s*([^.!?]+)/gi
    ];

    skillPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          skills.push(...match.split(/[,;]/).map(s => s.trim()));
        });
      }
    });

    return skills;
  }

  extractEducationFromJob(job) {
    const text = `${job.title} ${job.description}`.toLowerCase();
    
    const educationKeywords = [
      'bachelor', 'master', 'phd', 'doctorate', 'degree',
      'university', 'college', 'education', 'graduate'
    ];

    return educationKeywords.some(keyword => text.includes(keyword)) ? text : '';
  }

  getEducationLevel(text, levels) {
    const textLower = text.toLowerCase();
    
    for (const [level, value] of Object.entries(levels)) {
      if (textLower.includes(level)) {
        return value;
      }
    }
    return 0;
  }

  getCategorySkills(category) {
    const cat = category?.toLowerCase() || 'other';
    const categoryData = this.skillsDatabase[cat];
    
    if (!categoryData) return [];
    
    return Object.values(categoryData).flat();
  }

  getWeightsForJobCategory(category) {
    // Customize weights based on job category
    const customWeights = {
      engineering: {
        ...this.defaultWeights,
        skillsMatch: 0.35,
        experienceMatch: 0.30,
        portfolioQuality: 0.15
      },
      design: {
        ...this.defaultWeights,
        portfolioQuality: 0.25,
        skillsMatch: 0.30,
        coverLetterQuality: 0.20
      },
      sales: {
        ...this.defaultWeights,
        experienceMatch: 0.35,
        coverLetterQuality: 0.25,
        skillsMatch: 0.20
      }
    };

    return customWeights[category?.toLowerCase()] || this.defaultWeights;
  }

  getRankCategory(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Strong';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Weak';
  }

  getRecommendation(totalScore, scores) {
    if (totalScore >= 85) {
      return {
        action: 'strong_consider',
        message: 'Highly recommended candidate with excellent qualifications',
        priority: 'high'
      };
    } else if (totalScore >= 75) {
      return {
        action: 'consider',
        message: 'Good candidate worth interviewing',
        priority: 'medium'
      };
    } else if (totalScore >= 60) {
      return {
        action: 'review',
        message: 'Moderate fit, review carefully for potential',
        priority: 'low'
      };
    } else {
      return {
        action: 'pass',
        message: 'Below threshold, likely not a good fit',
        priority: 'low'
      };
    }
  }

  generateAnalysis(scores, application, job) {
    const analysis = {
      strengths: [],
      weaknesses: [],
      notes: []
    };

    // Analyze each score component
    if (scores.experienceMatch >= 80) {
      analysis.strengths.push('Experience level aligns well with job requirements');
    } else if (scores.experienceMatch <= 40) {
      analysis.weaknesses.push('Experience gap may require additional training');
    }

    if (scores.skillsMatch >= 80) {
      analysis.strengths.push('Strong technical skills match for this role');
    } else if (scores.skillsMatch <= 50) {
      analysis.weaknesses.push('Limited relevant technical skills demonstrated');
    }

    if (scores.portfolioQuality >= 80) {
      analysis.strengths.push('Professional portfolio demonstrates capabilities');
    } else if (scores.portfolioQuality <= 40) {
      analysis.weaknesses.push('No portfolio or limited work samples provided');
    }

    if (scores.coverLetterQuality >= 80) {
      analysis.strengths.push('Well-written, personalized cover letter');
    } else if (scores.coverLetterQuality <= 40) {
      analysis.weaknesses.push('Cover letter lacks personalization or detail');
    }

    if (scores.responseTime >= 90) {
      analysis.notes.push('Applied quickly, showing strong interest');
    }

    return analysis;
  }

  // Batch scoring for analytics
  async generateJobApplicationAnalytics(jobId) {
    try {
      const rankedApplications = await this.rankApplicationsForJob(jobId);
      
      const analytics = {
        totalApplications: rankedApplications.length,
        averageScore: rankedApplications.reduce((sum, app) => sum + app.scoring.totalScore, 0) / rankedApplications.length || 0,
        scoreDistribution: {
          excellent: rankedApplications.filter(app => app.scoring.totalScore >= 90).length,
          strong: rankedApplications.filter(app => app.scoring.totalScore >= 80 && app.scoring.totalScore < 90).length,
          good: rankedApplications.filter(app => app.scoring.totalScore >= 70 && app.scoring.totalScore < 80).length,
          fair: rankedApplications.filter(app => app.scoring.totalScore >= 60 && app.scoring.totalScore < 70).length,
          weak: rankedApplications.filter(app => app.scoring.totalScore < 60).length
        },
        topCandidates: rankedApplications.slice(0, 5),
        scoringBreakdown: this.calculateAverageScores(rankedApplications)
      };

      return analytics;
    } catch (error) {
      console.error('Error generating analytics:', error);
      return null;
    }
  }

  calculateAverageScores(applications) {
    if (applications.length === 0) return {};

    const breakdown = {
      experienceMatch: 0,
      skillsMatch: 0,
      educationMatch: 0,
      portfolioQuality: 0,
      coverLetterQuality: 0,
      responseTime: 0
    };

    applications.forEach(app => {
      Object.keys(breakdown).forEach(key => {
        breakdown[key] += app.scoring.scores[key] || 0;
      });
    });

    Object.keys(breakdown).forEach(key => {
      breakdown[key] = breakdown[key] / applications.length;
    });

    return breakdown;
  }
}

export { ApplicationScoringService };