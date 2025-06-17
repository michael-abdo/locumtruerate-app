import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://locumtruerate.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/private/',
          '/user/settings/',
          '/auth/',
          '/preview/',
          '/_next/',
          '/tmp/',
          '*.json',
          '/search?*',  // Don't index search result pages with query params
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',  // Disallow AI scraping
      },
      {
        userAgent: 'Google-Extended',
        disallow: '/',  // Disallow Bard scraping
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',  // Disallow ChatGPT scraping
      },
      {
        userAgent: 'CCBot',
        disallow: '/',  // Disallow Common Crawl for AI training
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',  // Disallow Anthropic scraping
      },
      {
        userAgent: 'Claude-Web',
        disallow: '/',  // Disallow Claude scraping
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}