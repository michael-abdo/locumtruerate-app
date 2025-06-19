/**
 * Knowledge base system for customer support
 */

import { z } from 'zod';
import { logger } from '@locumtruerate/shared';
import { PrismaClient } from '@locumtruerate/database';

export const ArticleCategorySchema = z.enum([
  'getting_started',
  'account_management',
  'job_posting',
  'applications',
  'billing',
  'technical_issues',
  'mobile_app',
  'integrations',
  'policies',
  'troubleshooting'
]);

export type ArticleCategory = z.infer<typeof ArticleCategorySchema>;

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: ArticleCategory;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
  helpful: number;
  notHelpful: number;
  views: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchQuery {
  query: string;
  category?: ArticleCategory;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  limit?: number;
}

export class KnowledgeBaseService {
  private prisma: PrismaClient;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  // Search knowledge base articles
  async searchArticles(searchQuery: SearchQuery): Promise<KnowledgeArticle[]> {
    try {
      const where: any = {
        published: true,
        OR: [
          { title: { contains: searchQuery.query, mode: 'insensitive' } },
          { content: { contains: searchQuery.query, mode: 'insensitive' } },
          { tags: { has: searchQuery.query.toLowerCase() } },
        ],
      };
      
      if (searchQuery.category) {
        where.category = searchQuery.category;
      }
      
      if (searchQuery.difficulty) {
        where.difficulty = searchQuery.difficulty;
      }
      
      if (searchQuery.tags && searchQuery.tags.length > 0) {
        where.tags = { hasEvery: searchQuery.tags };
      }
      
      const articles = await this.prisma.knowledgeArticle.findMany({
        where,
        orderBy: [
          { helpful: 'desc' },
          { views: 'desc' },
          { updatedAt: 'desc' },
        ],
        take: searchQuery.limit || 20,
      });
      
      // Log search query for analytics
      await this.logSearch(searchQuery);
      
      return articles;
    } catch (error) {
      logger.error('Failed to search knowledge base', error instanceof Error ? error : new Error(String(error)), { searchQuery });
      return [];
    }
  }
  
  // Get article by ID and increment view count
  async getArticle(articleId: string): Promise<KnowledgeArticle | null> {
    try {
      const article = await this.prisma.knowledgeArticle.findUnique({
        where: { id: articleId, published: true },
      });
      
      if (article) {
        // Increment view count
        await this.prisma.knowledgeArticle.update({
          where: { id: articleId },
          data: { views: { increment: 1 } },
        });
      }
      
      return article;
    } catch (error) {
      logger.error('Failed to get knowledge article', error instanceof Error ? error : new Error(String(error)), { articleId });
      return null;
    }
  }
  
  // Get articles by category
  async getArticlesByCategory(category: ArticleCategory): Promise<KnowledgeArticle[]> {
    try {
      return await this.prisma.knowledgeArticle.findMany({
        where: { category, published: true },
        orderBy: [
          { helpful: 'desc' },
          { views: 'desc' },
        ],
      });
    } catch (error) {
      logger.error('Failed to get articles by category', error instanceof Error ? error : new Error(String(error)), { category });
      return [];
    }
  }
  
  // Get popular articles
  async getPopularArticles(limit: number = 10): Promise<KnowledgeArticle[]> {
    try {
      return await this.prisma.knowledgeArticle.findMany({
        where: { published: true },
        orderBy: [
          { views: 'desc' },
          { helpful: 'desc' },
        ],
        take: limit,
      });
    } catch (error) {
      logger.error('Failed to get popular articles', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }
  
  // Get recently updated articles
  async getRecentArticles(limit: number = 10): Promise<KnowledgeArticle[]> {
    try {
      return await this.prisma.knowledgeArticle.findMany({
        where: { published: true },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error('Failed to get recent articles', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }
  
  // Rate article helpfulness
  async rateArticle(articleId: string, helpful: boolean): Promise<void> {
    try {
      const updateData = helpful 
        ? { helpful: { increment: 1 } }
        : { notHelpful: { increment: 1 } };
      
      await this.prisma.knowledgeArticle.update({
        where: { id: articleId },
        data: updateData,
      });
      
      logger.info('Article rated', { articleId, helpful });
    } catch (error) {
      logger.error('Failed to rate article', error instanceof Error ? error : new Error(String(error)), { articleId, helpful });
    }
  }
  
  // Get knowledge base statistics
  async getKnowledgeBaseStats(): Promise<any> {
    try {
      const [
        totalArticles,
        publishedArticles,
        totalViews,
        totalRatings,
        categoryBreakdown,
        topArticles,
        recentSearches,
      ] = await Promise.all([
        this.prisma.knowledgeArticle.count(),
        this.prisma.knowledgeArticle.count({ where: { published: true } }),
        this.prisma.knowledgeArticle.aggregate({
          _sum: { views: true },
        }),
        this.prisma.knowledgeArticle.aggregate({
          _sum: { helpful: true, notHelpful: true },
        }),
        this.getCategoryBreakdown(),
        this.getTopPerformingArticles(),
        this.getRecentSearchQueries(),
      ]);
      
      return {
        totalArticles,
        publishedArticles,
        totalViews: totalViews._sum.views || 0,
        totalRatings: (totalRatings._sum.helpful || 0) + (totalRatings._sum.notHelpful || 0),
        helpfulRatio: this.calculateHelpfulRatio(totalRatings._sum.helpful || 0, totalRatings._sum.notHelpful || 0),
        categoryBreakdown,
        topArticles,
        recentSearches,
      };
    } catch (error) {
      logger.error('Failed to get knowledge base stats', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }
  
  // Suggest articles based on support ticket content
  async suggestArticles(ticketContent: string, category?: string): Promise<KnowledgeArticle[]> {
    try {
      // Extract keywords from ticket content
      const keywords = this.extractKeywords(ticketContent);
      
      // Search for relevant articles
      const suggestions = await this.searchArticles({
        query: keywords.join(' '),
        category: category as ArticleCategory,
        limit: 5,
      });
      
      return suggestions;
    } catch (error) {
      logger.error('Failed to suggest articles', error instanceof Error ? error : new Error(String(error)), { ticketContent });
      return [];
    }
  }
  
  // Get article analytics
  async getArticleAnalytics(articleId: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const [article, viewHistory, searchHistory] = await Promise.all([
        this.prisma.knowledgeArticle.findUnique({
          where: { id: articleId },
        }),
        this.getArticleViewHistory(articleId, startDate),
        this.getArticleSearchHistory(articleId, startDate),
      ]);
      
      if (!article) {
        return null;
      }
      
      return {
        article: {
          id: article.id,
          title: article.title,
          category: article.category,
          views: article.views,
          helpful: article.helpful,
          notHelpful: article.notHelpful,
          helpfulRatio: this.calculateHelpfulRatio(article.helpful, article.notHelpful),
        },
        viewHistory,
        searchHistory,
        performance: {
          avgViewsPerDay: viewHistory.reduce((sum: number, day: any) => sum + day.views, 0) / days,
          peakDay: viewHistory.reduce((max: any, day: any) => day.views > max.views ? day : max, { views: 0 }),
        },
      };
    } catch (error) {
      logger.error('Failed to get article analytics', error instanceof Error ? error : new Error(String(error)), { articleId });
      return null;
    }
  }
  
  // Create or update FAQ from common support tickets
  async generateFAQFromTickets(): Promise<any[]> {
    try {
      // Get common ticket categories and their patterns
      const commonIssues = await this.prisma.supportTicket.groupBy({
        by: ['category', 'subject'],
        where: {
          status: 'resolved',
          createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
        },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 20,
      });
      
      const faqSuggestions = commonIssues.map((issue: any) => ({
        question: issue.subject,
        category: issue.category,
        frequency: issue._count.category,
        suggested: true,
        needsArticle: true,
      }));
      
      logger.info('Generated FAQ suggestions from tickets', { count: faqSuggestions.length });
      
      return faqSuggestions;
    } catch (error) {
      logger.error('Failed to generate FAQ from tickets', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }
  
  // Get content gaps (searches with no good results)
  async getContentGaps(): Promise<any[]> {
    try {
      const searches = await this.prisma.knowledgeSearch.findMany({
        where: {
          resultsCount: { lt: 3 }, // Searches with fewer than 3 results
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      
      // Group similar searches
      const gaps = this.groupSimilarSearches(searches);
      
      return gaps.map(gap => ({
        searchTerms: gap.terms,
        frequency: gap.count,
        category: gap.category,
        needsArticle: true,
      }));
    } catch (error) {
      logger.error('Failed to get content gaps', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }
  
  // Private helper methods
  private async logSearch(searchQuery: SearchQuery): Promise<void> {
    try {
      await this.prisma.knowledgeSearch.create({
        data: {
          query: searchQuery.query,
          category: searchQuery.category,
          tags: searchQuery.tags || [],
          resultsCount: 0, // This would be updated with actual results count
          createdAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to log search', error instanceof Error ? error : new Error(String(error)), { searchQuery });
    }
  }
  
  private async getCategoryBreakdown(): Promise<any[]> {
    return await this.prisma.knowledgeArticle.groupBy({
      by: ['category'],
      where: { published: true },
      _count: { category: true },
      _sum: { views: true },
    });
  }
  
  private async getTopPerformingArticles(): Promise<any[]> {
    return await this.prisma.knowledgeArticle.findMany({
      where: { published: true },
      orderBy: [
        { views: 'desc' },
        { helpful: 'desc' },
      ],
      take: 10,
      select: {
        id: true,
        title: true,
        category: true,
        views: true,
        helpful: true,
        notHelpful: true,
      },
    });
  }
  
  private async getRecentSearchQueries(): Promise<any[]> {
    return await this.prisma.knowledgeSearch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        query: true,
        category: true,
        resultsCount: true,
        createdAt: true,
      },
    });
  }
  
  private calculateHelpfulRatio(helpful: number, notHelpful: number): number {
    const total = helpful + notHelpful;
    return total > 0 ? (helpful / total) * 100 : 0;
  }
  
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['that', 'this', 'with', 'have', 'will', 'been', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'].includes(word));
    
    // Return top 5 most relevant keywords
    return [...new Set(words)].slice(0, 5);
  }
  
  private async getArticleViewHistory(articleId: string, startDate: Date): Promise<any[]> {
    // This would track daily views - placeholder implementation
    const days = [];
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 50), // Placeholder data
      });
    }
    return days.reverse();
  }
  
  private async getArticleSearchHistory(articleId: string, startDate: Date): Promise<any[]> {
    // This would track which searches led to this article
    return [
      { query: 'how to post job', count: 15 },
      { query: 'job posting help', count: 8 },
    ];
  }
  
  private groupSimilarSearches(searches: any[]): any[] {
    // Simple grouping by similar terms - more sophisticated implementation would use NLP
    const groups: { [key: string]: any } = {};
    
    searches.forEach(search => {
      const key = search.query.toLowerCase().split(' ').sort().join(' ');
      if (!groups[key]) {
        groups[key] = {
          terms: [search.query],
          count: 1,
          category: search.category,
        };
      } else {
        groups[key].count++;
        if (!groups[key].terms.includes(search.query)) {
          groups[key].terms.push(search.query);
        }
      }
    });
    
    return Object.values(groups)
      .filter(group => group.count > 2) // Only gaps that appear multiple times
      .sort((a, b) => b.count - a.count);
  }
}

// Pre-built knowledge base articles for common issues
export const DEFAULT_ARTICLES = [
  {
    title: "Getting Started: How to Create Your First Job Posting",
    category: "getting_started" as ArticleCategory,
    content: `
# Getting Started: How to Create Your First Job Posting

Welcome to LocumTrueRate! This guide will walk you through creating your first job posting.

## Step 1: Access the Job Posting Dashboard
1. Log into your employer account
2. Navigate to "Post a Job" from the main menu
3. Click "Create New Job Posting"

## Step 2: Fill in Job Details
- **Job Title**: Be specific (e.g., "Emergency Medicine Physician - Night Shift")
- **Location**: Include city, state, and facility name
- **Duration**: Specify start and end dates
- **Schedule**: Include shift times and any call requirements

## Step 3: Compensation Details
- Use our True Rate Calculator for competitive pricing
- Include base hourly rate, call pay, and benefits
- Specify if housing/travel is provided

## Step 4: Requirements
- Medical license requirements
- Board certification needs
- Experience level preferred
- Any special skills or certifications

## Step 5: Review and Publish
- Preview your posting
- Check all details for accuracy
- Publish to make it live

Your job posting will be visible to qualified candidates immediately!
    `,
    tags: ["job-posting", "getting-started", "employer"],
    difficulty: "beginner" as const,
    estimatedReadTime: 3,
  },
  
  {
    title: "Troubleshooting: Why Isn't My Job Posting Getting Applications?",
    category: "troubleshooting" as ArticleCategory,
    content: `
# Troubleshooting: Why Isn't My Job Posting Getting Applications?

If your job posting isn't attracting candidates, here are common issues and solutions:

## 1. Compensation Issues
- **Problem**: Below-market rates
- **Solution**: Use our True Rate Calculator to ensure competitive pricing
- **Tip**: Include total compensation (base + call + benefits)

## 2. Incomplete Job Description
- **Problem**: Missing key details
- **Solution**: Include all essential information:
  - Specific location and facility
  - Exact dates and duration
  - Call requirements
  - Housing/travel arrangements

## 3. Unrealistic Requirements
- **Problem**: Too many requirements for the compensation offered
- **Solution**: Prioritize must-have vs. nice-to-have qualifications

## 4. Poor Location Appeal
- **Problem**: Difficult location without adequate compensation
- **Solution**: Highlight location benefits or increase compensation

## 5. Timing Issues
- **Problem**: Posting too close to start date
- **Solution**: Post at least 4-6 weeks in advance for best results

## Quick Fixes to Try:
1. Update your compensation package
2. Add more location details and amenities
3. Reduce unnecessary requirements
4. Add photos of the facility/area
5. Highlight unique benefits

Need help? Contact our support team for a personalized review of your posting.
    `,
    tags: ["troubleshooting", "job-posting", "applications", "employer"],
    difficulty: "intermediate" as const,
    estimatedReadTime: 4,
  },
  
  {
    title: "Account Management: How to Update Your Profile Information",
    category: "account_management" as ArticleCategory,
    content: `
# Account Management: How to Update Your Profile Information

Keep your profile up to date for better job matching and communication.

## Accessing Your Profile
1. Click your name in the top right corner
2. Select "Profile Settings" from the dropdown
3. Choose the section you want to update

## Profile Sections

### Personal Information
- Name and contact details
- Professional credentials
- License information

### Professional Details
- Specialties and subspecialties
- Years of experience
- Preferred assignment types

### Preferences
- Desired locations
- Schedule preferences
- Compensation expectations

### Documents
- CV/Resume upload
- License documents
- Certifications

## Tips for a Strong Profile
- Keep all information current
- Upload a professional photo
- Complete all relevant sections
- Update your availability status regularly

## Privacy Settings
Control what information is visible to employers:
- Contact information visibility
- Profile photo sharing
- Experience level details

## Notification Preferences
Customize how and when you receive:
- Job match alerts
- Application updates
- System notifications

Remember: Complete profiles receive 3x more job matches than incomplete ones!
    `,
    tags: ["account", "profile", "settings", "candidate"],
    difficulty: "beginner" as const,
    estimatedReadTime: 3,
  },
];