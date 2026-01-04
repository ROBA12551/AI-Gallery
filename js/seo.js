/**
 * SEO.js - Advanced SEO Optimization
 * Handles meta tags, structured data, analytics
 */

// Dynamic meta tag management
class SEOManager {
    constructor() {
        this.pageData = {
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.content || '',
            keywords: document.querySelector('meta[name="keywords"]')?.content || '',
            ogImage: document.querySelector('meta[property="og:image"]')?.content || ''
        };
    }

    updatePageMeta(data) {
        if (data.title) {
            document.title = data.title;
            this.updateMeta('og:title', data.title);
            this.updateMeta('twitter:title', data.title);
        }
        
        if (data.description) {
            this.updateMeta('description', data.description);
            this.updateMeta('og:description', data.description);
            this.updateMeta('twitter:description', data.description);
        }
        
        if (data.keywords) {
            this.updateMeta('keywords', data.keywords);
        }
        
        if (data.ogImage) {
            this.updateMeta('og:image', data.ogImage);
            this.updateMeta('twitter:image', data.ogImage);
        }
    }

    updateMeta(property, content) {
        let element = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
        
        if (!element) {
            element = document.createElement('meta');
            if (property.startsWith('og:') || property === 'twitter:card') {
                element.setAttribute('property', property);
            } else {
                element.setAttribute('name', property);
            }
            document.head.appendChild(element);
        }
        
        element.setAttribute('content', content);
    }

    // Structured data for search engines
    updateStructuredData(data) {
        let script = document.querySelector('script[type="application/ld+json"][data-dynamic="true"]');
        
        if (!script) {
            script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-dynamic', 'true');
            document.head.appendChild(script);
        }
        
        script.textContent = JSON.stringify(data);
    }

    // Track page views
    trackPageView(pageName, customMeta = {}) {
        if (typeof ga !== 'undefined') {
            ga('send', 'pageview', {
                'page': pageName,
                'title': document.title
            });
        }

        console.log(`📊 Page View: ${pageName}`, customMeta);
    }
}

// Initialize SEO Manager
const seoManager = new SEOManager();

// Expose globally for app.js
window.SEOManager = seoManager;

// Search Engine Optimization Utilities
const SEOUtils = {
    // Generate meta description from text
    generateDescription(text, maxLength = 160) {
        return text
            .replace(/<[^>]*>/g, '')
            .substring(0, maxLength)
            .trim() + '...';
    },

    // Extract keywords from content
    extractKeywords(text, limit = 5) {
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been'
        ]);

        return text
            .toLowerCase()
            .match(/\b\w+\b/g)
            .filter(word => !stopWords.has(word) && word.length > 3)
            .reduce((freq, word) => {
                freq[word] = (freq[word] || 0) + 1;
                return freq;
            }, {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([word]) => word);
    },

    // Generate canonical URL
    setCanonical(url) {
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = url;
    },

    // Add breadcrumb structured data
    setBreadcrumbs(items) {
        const structured = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': items.map((item, index) => ({
                '@type': 'ListItem',
                'position': index + 1,
                'name': item.name,
                'item': item.url
            }))
        };

        seoManager.updateStructuredData(structured);
    },

    // Track social shares
    trackShare(platform, url, title) {
        console.log(`📱 Shared on ${platform}: ${title}`);
        if (typeof ga !== 'undefined') {
            ga('send', 'social', platform, 'share', url);
        }
    }
};

// Expose SEOUtils globally
window.SEOUtils = SEOUtils;

// Performance monitoring
const PerformanceMonitor = {
    startTime: performance.now(),

    logMetrics() {
        const metrics = {
            'Time to Interactive': performance.now() - this.startTime,
            'Page Load Time': performance.timing.loadEventEnd - performance.timing.navigationStart,
            'DOM Ready Time': performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
            'Resource Count': performance.getEntriesByType('resource').length
        };

        console.table(metrics);
    }
};

// Log performance metrics on load
window.addEventListener('load', () => {
    PerformanceMonitor.logMetrics();
});

// Accessibility: Announce dynamic changes to screen readers
const Announcer = {
    announce(message, type = 'polite') {
        let announcer = document.querySelector('[role="status"]');
        
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.setAttribute('role', 'status');
            announcer.setAttribute('aria-live', type);
            announcer.style.position = 'absolute';
            announcer.style.left = '-9999px';
            document.body.appendChild(announcer);
        }

        announcer.textContent = message;
        announcer.setAttribute('aria-live', type);
    }
};

window.Announcer = Announcer;

// Analytics - Page tracking
document.addEventListener('DOMContentLoaded', () => {
    const pagePath = window.location.pathname;
    
    if (pagePath === '/' || pagePath === '/index.html') {
        seoManager.trackPageView('Gallery - Home');
    } else if (pagePath === '/upload.html') {
        seoManager.trackPageView('Upload - Share');
    } else if (pagePath === '/policy.html') {
        seoManager.trackPageView('Policy - Terms');
    }
});

// Sitemap & robots.txt info
console.log('%c✅ SEO Features Loaded', 'color: green; font-size: 14px;');
console.log('%cSitemap: /sitemap.xml', 'color: blue;');
console.log('%cRobots: /robots.txt', 'color: blue;');
console.log('%cSchema.org: Enabled', 'color: blue;');
console.log('%cOpen Graph: Enabled', 'color: blue;');