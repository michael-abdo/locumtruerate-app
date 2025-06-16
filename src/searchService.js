// Advanced Search and AI-Powered Job Matching Service
// This service provides intelligent job search, semantic matching, and personalized recommendations

class AdvancedSearchService {
  constructor(env) {
    this.env = env;
    
    // Skill categories and synonyms for semantic matching
    this.skillSynonyms = {
      // Programming languages
      'javascript': ['js', 'node.js', 'nodejs', 'react', 'vue', 'angular', 'typescript'],
      'python': ['django', 'flask', 'fastapi', 'numpy', 'pandas', 'tensorflow'],
      'java': ['spring', 'hibernate', 'maven', 'gradle'],
      'php': ['laravel', 'symfony', 'wordpress', 'drupal'],
      'ruby': ['rails', 'sinatra'],
      'go': ['golang'],
      'rust': ['rustlang'],
      
      // Frontend technologies
      'react': ['reactjs', 'jsx', 'redux', 'hooks'],
      'vue': ['vuejs', 'nuxt'],
      'angular': ['angularjs', 'typescript'],
      'html': ['html5', 'markup'],
      'css': ['css3', 'sass', 'scss', 'less', 'stylus'],
      
      // Backend technologies
      'node.js': ['nodejs', 'express', 'nestjs'],
      'database': ['sql', 'mysql', 'postgresql', 'mongodb', 'nosql'],
      'api': ['rest', 'restful', 'graphql', 'microservices'],
      
      // Cloud & DevOps
      'aws': ['amazon web services', 'ec2', 's3', 'lambda'],
      'docker': ['containerization', 'kubernetes'],
      'devops': ['ci/cd', 'jenkins', 'github actions'],
      
      // Design
      'ui': ['user interface', 'interface design'],
      'ux': ['user experience', 'usability'],
      'figma': ['sketch', 'adobe xd', 'prototyping'],
      
      // Marketing
      'seo': ['search engine optimization'],
      'sem': ['search engine marketing', 'google ads'],
      'social media': ['facebook', 'twitter', 'instagram', 'linkedin'],
      
      // General skills
      'management': ['leadership', 'team lead', 'project management'],
      'communication': ['presentation', 'writing', 'public speaking'],
      'analysis': ['analytics', 'data analysis', 'research']
    };
    
    // Job categories and their typical requirements
    this.categoryProfiles = {
      engineering: {
        coreSkills: ['programming', 'software development', 'coding'],
        commonTools: ['git', 'github', 'vscode', 'ide'],
        experienceLevels: {
          junior: { minYears: 0, maxYears: 2 },
          mid: { minYears: 2, maxYears: 5 },
          senior: { minYears: 5, maxYears: 10 },
          lead: { minYears: 8, maxYears: 20 }
        }
      },
      design: {
        coreSkills: ['design', 'creativity', 'visual design'],
        commonTools: ['figma', 'sketch', 'photoshop', 'illustrator'],
        experienceLevels: {
          junior: { minYears: 0, maxYears: 2 },
          mid: { minYears: 2, maxYears: 5 },
          senior: { minYears: 5, maxYears: 15 }
        }
      },
      marketing: {
        coreSkills: ['marketing', 'promotion', 'campaigns'],
        commonTools: ['google analytics', 'facebook ads', 'mailchimp'],
        experienceLevels: {
          junior: { minYears: 0, maxYears: 2 },
          mid: { minYears: 2, maxYears: 5 },
          senior: { minYears: 5, maxYears: 15 }
        }
      },
      sales: {
        coreSkills: ['sales', 'negotiation', 'customer relations'],
        commonTools: ['crm', 'salesforce', 'hubspot'],
        experienceLevels: {
          junior: { minYears: 0, maxYears: 2 },
          mid: { minYears: 2, maxYears: 5 },
          senior: { minYears: 5, maxYears: 20 }
        }
      }
    };
    
    // Location aliases and variations
    this.locationAliases = {
      'san francisco': ['sf', 'bay area', 'silicon valley'],
      'new york': ['nyc', 'ny', 'new york city', 'manhattan'],
      'los angeles': ['la', 'los angeles county'],
      'seattle': ['seattle metro'],
      'austin': ['austin tx'],
      'remote': ['work from home', 'telecommute', 'distributed', 'anywhere']
    };
  }

  // Main search function with AI-powered matching
  async searchJobs(query, filters = {}) {
    try {
      // Get all active jobs
      const jobs = await this.getAllActiveJobs();
      
      if (!query && Object.keys(filters).length === 0) {
        return this.rankJobs(jobs, '');
      }
      
      // Parse and enhance the search query
      const enhancedQuery = this.enhanceSearchQuery(query);
      
      // Score each job against the query and filters
      const scoredJobs = jobs.map(job => ({
        ...job,
        searchScore: this.calculateJobSearchScore(job, enhancedQuery, filters),
        matchReasons: this.getMatchReasons(job, enhancedQuery, filters)
      }));
      
      // Filter out low-scoring jobs and sort by relevance
      const relevantJobs = scoredJobs
        .filter(job => job.searchScore > 0.1) // Minimum relevance threshold
        .sort((a, b) => b.searchScore - a.searchScore);
      
      return {
        jobs: relevantJobs,
        query: enhancedQuery,
        totalResults: relevantJobs.length,
        searchTime: Date.now(),
        suggestions: this.generateSearchSuggestions(query, relevantJobs)
      };
    } catch (error) {
      console.error('Search error:', error);
      return {
        jobs: [],
        error: 'Search failed',
        query,
        totalResults: 0
      };
    }
  }

  // Get personalized job recommendations based on user profile
  async getPersonalizedRecommendations(userProfile, limit = 10) {
    try {
      const jobs = await this.getAllActiveJobs();
      
      // Score jobs based on user profile
      const scoredJobs = jobs.map(job => ({
        ...job,
        recommendationScore: this.calculateRecommendationScore(job, userProfile),
        matchReasons: this.getRecommendationReasons(job, userProfile)
      }));
      
      // Sort by recommendation score and apply limit
      const recommendations = scoredJobs
        .filter(job => job.recommendationScore > 0.3)
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);
      
      return {
        recommendations,
        userProfile,
        generatedAt: new Date().toISOString(),
        totalCandidates: jobs.length
      };
    } catch (error) {
      console.error('Recommendation error:', error);
      return {
        recommendations: [],
        error: 'Failed to generate recommendations'
      };
    }
  }

  // Enhanced search with autocomplete and suggestions
  async getSearchSuggestions(partialQuery, limit = 10) {
    try {
      const jobs = await this.getAllActiveJobs();
      const suggestions = new Set();
      
      // Extract common terms from job titles and descriptions
      jobs.forEach(job => {
        const text = `${job.title} ${job.description} ${job.tags || ''}`.toLowerCase();
        const words = text.match(/\b\w+\b/g) || [];
        
        words.forEach(word => {
          if (word.length > 2 && word.toLowerCase().includes(partialQuery.toLowerCase())) {
            suggestions.add(word);
          }
        });
      });
      
      // Add skill suggestions
      Object.keys(this.skillSynonyms).forEach(skill => {
        if (skill.includes(partialQuery.toLowerCase())) {
          suggestions.add(skill);
        }
      });
      
      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      console.error('Suggestion error:', error);
      return [];
    }
  }

  // Smart job filtering with semantic understanding
  async filterJobsIntelligently(jobs, filters) {
    return jobs.filter(job => {
      // Experience level matching with flexibility
      if (filters.experience) {
        const jobExperience = this.extractExperience(job);
        const userExperience = parseInt(filters.experience);
        
        // Allow some flexibility in experience matching
        const experienceMatch = Math.abs(jobExperience - userExperience) <= 2;
        if (!experienceMatch && jobExperience > userExperience + 3) {
          return false; // Too senior
        }
      }
      
      // Location matching with semantic understanding
      if (filters.location && filters.location !== 'remote') {
        const locationMatch = this.isLocationMatch(job.location, filters.location);
        if (!locationMatch) return false;
      }
      
      // Salary range matching
      if (filters.minSalary || filters.maxSalary) {
        const jobSalary = this.extractSalary(job);
        if (jobSalary) {
          if (filters.minSalary && jobSalary.max < parseInt(filters.minSalary)) return false;
          if (filters.maxSalary && jobSalary.min > parseInt(filters.maxSalary)) return false;
        }
      }
      
      // Job type matching
      if (filters.jobType) {
        if (!job.type || job.type.toLowerCase() !== filters.jobType.toLowerCase()) {
          return false;
        }
      }
      
      return true;
    });
  }

  // Calculate search relevance score for a job
  calculateJobSearchScore(job, enhancedQuery, filters) {
    let score = 0;
    const { originalQuery, expandedTerms, skillTerms, locationTerms } = enhancedQuery;
    
    // Title matching (highest weight)
    score += this.calculateTextMatch(job.title, originalQuery) * 0.4;
    score += this.calculateTextMatch(job.title, skillTerms.join(' ')) * 0.3;
    
    // Description matching
    score += this.calculateTextMatch(job.description, originalQuery) * 0.2;
    score += this.calculateTextMatch(job.description, expandedTerms.join(' ')) * 0.15;
    
    // Skills/tags matching
    if (job.tags) {
      score += this.calculateTextMatch(job.tags, skillTerms.join(' ')) * 0.25;
    }
    
    // Location bonus
    if (locationTerms.length > 0) {
      const locationMatch = locationTerms.some(term => 
        job.location.toLowerCase().includes(term.toLowerCase())
      );
      if (locationMatch) score += 0.2;
    }
    
    // Category matching
    if (filters.category && job.category === filters.category) {
      score += 0.15;
    }
    
    // Recency bonus (newer jobs get slight boost)
    const daysOld = (Date.now() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24);
    const recencyBonus = Math.max(0, (30 - daysOld) / 30) * 0.1;
    score += recencyBonus;
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  // Calculate recommendation score based on user profile
  calculateRecommendationScore(job, userProfile) {
    let score = 0;
    
    // Skills matching
    if (userProfile.skills && userProfile.skills.length > 0) {
      const skillMatch = this.calculateSkillsMatch(job, userProfile.skills);
      score += skillMatch * 0.35;
    }
    
    // Experience level matching
    if (userProfile.experience) {
      const experienceMatch = this.calculateExperienceMatch(job, userProfile.experience);
      score += experienceMatch * 0.25;
    }
    
    // Location preference
    if (userProfile.preferredLocations) {
      const locationMatch = this.calculateLocationMatch(job, userProfile.preferredLocations);
      score += locationMatch * 0.15;
    }
    
    // Industry/category preference
    if (userProfile.preferredCategories) {
      const categoryMatch = userProfile.preferredCategories.includes(job.category);
      if (categoryMatch) score += 0.15;
    }
    
    // Salary expectations
    if (userProfile.salaryExpectations) {
      const salaryMatch = this.calculateSalaryMatch(job, userProfile.salaryExpectations);
      score += salaryMatch * 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  // Text matching with fuzzy search capabilities
  calculateTextMatch(text, query) {
    if (!text || !query) return 0;
    
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    
    let matches = 0;
    let totalWords = queryWords.length;
    
    queryWords.forEach(word => {
      if (textLower.includes(word)) {
        matches++;
      } else {
        // Check for partial matches and synonyms
        const synonyms = this.findSynonyms(word);
        if (synonyms.some(synonym => textLower.includes(synonym))) {
          matches += 0.8; // Slightly lower score for synonym matches
        } else if (this.calculateLevenshteinDistance(word, textLower) / word.length < 0.3) {
          matches += 0.6; // Even lower for fuzzy matches
        }
      }
    });
    
    return matches / totalWords;
  }

  // Enhanced query processing with semantic expansion
  enhanceSearchQuery(query) {
    if (!query) return { originalQuery: '', expandedTerms: [], skillTerms: [], locationTerms: [] };
    
    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/);
    
    const skillTerms = [];
    const locationTerms = [];
    const expandedTerms = [...words];
    
    // Identify and expand skill terms
    words.forEach(word => {
      const synonyms = this.findSynonyms(word);
      if (synonyms.length > 0) {
        skillTerms.push(word, ...synonyms);
        expandedTerms.push(...synonyms);
      }
      
      // Check if it's a location term
      Object.keys(this.locationAliases).forEach(location => {
        if (location.includes(word) || this.locationAliases[location].includes(word)) {
          locationTerms.push(location, ...this.locationAliases[location]);
        }
      });
    });
    
    return {
      originalQuery: query,
      expandedTerms: [...new Set(expandedTerms)],
      skillTerms: [...new Set(skillTerms)],
      locationTerms: [...new Set(locationTerms)]
    };
  }

  // Find synonyms for a given term
  findSynonyms(term) {
    const termLower = term.toLowerCase();
    
    // Direct lookup
    if (this.skillSynonyms[termLower]) {
      return this.skillSynonyms[termLower];
    }
    
    // Reverse lookup (find terms that have this as a synonym)
    const synonyms = [];
    Object.keys(this.skillSynonyms).forEach(key => {
      if (this.skillSynonyms[key].includes(termLower)) {
        synonyms.push(key, ...this.skillSynonyms[key]);
      }
    });
    
    return [...new Set(synonyms)];
  }

  // Helper functions
  async getAllActiveJobs() {
    const jobs = await this.env.JOBS.list();
    const jobList = [];
    const now = new Date();
    
    for (const key of jobs.keys) {
      const job = await this.env.JOBS.get(key.name);
      if (job) {
        const jobData = JSON.parse(job);
        
        // Check if job is still active and not expired
        const isActive = jobData.status === 'active';
        const isNotExpired = !jobData.expiresAt || new Date(jobData.expiresAt) > now;
        
        if (isActive && isNotExpired) {
          jobList.push(jobData);
        }
      }
    }
    
    return jobList;
  }

  extractExperience(job) {
    const text = `${job.title} ${job.description}`.toLowerCase();
    
    // Look for experience patterns
    const patterns = [
      /(\d+)\+?\s*years?\s*of?\s*experience/,
      /(\d+)\+?\s*years?\s*experience/,
      /experience\s*of?\s*(\d+)\+?\s*years?/,
      /minimum\s*(\d+)\s*years?/,
      /at\s*least\s*(\d+)\s*years?/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }
    
    // Check for seniority keywords
    if (text.includes('senior') || text.includes('lead')) return 5;
    if (text.includes('mid') || text.includes('intermediate')) return 3;
    if (text.includes('junior') || text.includes('entry')) return 1;
    
    return 2; // Default assumption
  }

  extractSalary(job) {
    const text = `${job.salary || ''} ${job.description}`;
    
    // Look for salary patterns
    const patterns = [
      /\$(\d{1,3}(?:,?\d{3})*)\s*-\s*\$(\d{1,3}(?:,?\d{3})*)/,
      /\$(\d{1,3}(?:,?\d{3})*)\s*to\s*\$(\d{1,3}(?:,?\d{3})*)/,
      /(\d{1,3}(?:,?\d{3})*)\s*-\s*(\d{1,3}(?:,?\d{3})*)\s*k/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let min = parseInt(match[1].replace(/,/g, ''));
        let max = parseInt(match[2].replace(/,/g, ''));
        
        // Handle 'k' suffix
        if (text.toLowerCase().includes('k')) {
          min *= 1000;
          max *= 1000;
        }
        
        return { min, max };
      }
    }
    
    return null;
  }

  isLocationMatch(jobLocation, searchLocation) {
    const jobLoc = jobLocation.toLowerCase();
    const searchLoc = searchLocation.toLowerCase();
    
    // Direct match
    if (jobLoc.includes(searchLoc) || searchLoc.includes(jobLoc)) {
      return true;
    }
    
    // Check aliases
    for (const [canonical, aliases] of Object.entries(this.locationAliases)) {
      if (canonical.includes(searchLoc) || aliases.includes(searchLoc)) {
        if (jobLoc.includes(canonical) || aliases.some(alias => jobLoc.includes(alias))) {
          return true;
        }
      }
    }
    
    return false;
  }

  calculateSkillsMatch(job, userSkills) {
    const jobText = `${job.title} ${job.description} ${job.tags || ''}`.toLowerCase();
    let matches = 0;
    
    userSkills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (jobText.includes(skillLower)) {
        matches++;
      } else {
        const synonyms = this.findSynonyms(skillLower);
        if (synonyms.some(synonym => jobText.includes(synonym))) {
          matches += 0.8;
        }
      }
    });
    
    return Math.min(matches / userSkills.length, 1.0);
  }

  calculateExperienceMatch(job, userExperience) {
    const jobExperience = this.extractExperience(job);
    const diff = Math.abs(jobExperience - userExperience);
    
    if (diff === 0) return 1.0;
    if (diff <= 1) return 0.9;
    if (diff <= 2) return 0.7;
    if (diff <= 3) return 0.5;
    return 0.2;
  }

  calculateLocationMatch(job, preferredLocations) {
    return preferredLocations.some(location => 
      this.isLocationMatch(job.location, location)
    ) ? 1.0 : 0.0;
  }

  calculateSalaryMatch(job, salaryExpectations) {
    const jobSalary = this.extractSalary(job);
    if (!jobSalary) return 0.5; // Neutral if no salary info
    
    const { min: expectedMin, max: expectedMax } = salaryExpectations;
    const { min: jobMin, max: jobMax } = jobSalary;
    
    // Check for overlap
    if (jobMax >= expectedMin && jobMin <= expectedMax) {
      return 1.0;
    }
    
    // Calculate distance if no overlap
    const distanceBelow = Math.max(0, expectedMin - jobMax);
    const distanceAbove = Math.max(0, jobMin - expectedMax);
    const maxDistance = Math.max(distanceBelow, distanceAbove);
    
    // Normalize based on expected range
    const expectedRange = expectedMax - expectedMin;
    const normalizedDistance = maxDistance / expectedRange;
    
    return Math.max(0, 1 - normalizedDistance);
  }

  calculateLevenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  getMatchReasons(job, enhancedQuery, filters) {
    const reasons = [];
    const { originalQuery, skillTerms } = enhancedQuery;
    
    // Check title matches
    if (this.calculateTextMatch(job.title, originalQuery) > 0.3) {
      reasons.push(`Title matches "${originalQuery}"`);
    }
    
    // Check skill matches
    skillTerms.forEach(skill => {
      if (job.description.toLowerCase().includes(skill.toLowerCase()) || 
          (job.tags && job.tags.toLowerCase().includes(skill.toLowerCase()))) {
        reasons.push(`Requires ${skill}`);
      }
    });
    
    // Check filters
    if (filters.category && job.category === filters.category) {
      reasons.push(`${job.category} category`);
    }
    
    return reasons.slice(0, 3); // Limit to top 3 reasons
  }

  getRecommendationReasons(job, userProfile) {
    const reasons = [];
    
    if (userProfile.skills) {
      const skillsMatch = this.calculateSkillsMatch(job, userProfile.skills);
      if (skillsMatch > 0.5) {
        reasons.push(`${Math.round(skillsMatch * 100)}% skills match`);
      }
    }
    
    if (userProfile.experience) {
      const expMatch = this.calculateExperienceMatch(job, userProfile.experience);
      if (expMatch > 0.7) {
        reasons.push('Experience level fits');
      }
    }
    
    if (userProfile.preferredCategories && userProfile.preferredCategories.includes(job.category)) {
      reasons.push(`Matches ${job.category} preference`);
    }
    
    return reasons.slice(0, 3);
  }

  generateSearchSuggestions(query, results) {
    if (!query || results.length === 0) return [];
    
    const suggestions = [];
    
    // Related skills suggestions
    const relatedSkills = new Set();
    results.slice(0, 10).forEach(job => {
      const jobText = `${job.title} ${job.description} ${job.tags || ''}`.toLowerCase();
      Object.keys(this.skillSynonyms).forEach(skill => {
        if (jobText.includes(skill) && !query.toLowerCase().includes(skill)) {
          relatedSkills.add(skill);
        }
      });
    });
    
    Array.from(relatedSkills).slice(0, 3).forEach(skill => {
      suggestions.push(`${query} ${skill}`);
    });
    
    return suggestions;
  }

  rankJobs(jobs, query) {
    // Default ranking when no specific query
    return {
      jobs: jobs.sort((a, b) => {
        // Sort by recency and view count
        const aScore = (new Date(a.createdAt).getTime() / 1000000) + (a.viewCount || 0);
        const bScore = (new Date(b.createdAt).getTime() / 1000000) + (b.viewCount || 0);
        return bScore - aScore;
      }),
      query: '',
      totalResults: jobs.length,
      searchTime: Date.now()
    };
  }
}

export { AdvancedSearchService };