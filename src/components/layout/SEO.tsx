/**
 * SEO Component
 *
 * Comprehensive SEO optimization with:
 * - Meta tags (title, description, keywords)
 * - Open Graph (Facebook, LinkedIn)
 * - Twitter Cards
 * - JSON-LD Structured Data
 * - Canonical URLs
 */

import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  structuredData?: object;
}

const DEFAULT_SEO = {
  siteName: 'Partners CRM',
  title: 'CRM para Parceiros | Plataforma Completa de Vendas Online',
  description: 'A melhor plataforma de parceiros que sua empresa pode ter, simples e completa. Gerencie vendas, clientes e comissões em um só lugar.',
  keywords: 'crm parceiros, plataforma vendas, gestão parceiros, comissões, vendas online, checkout',
  image: '/og-image.jpg',
  twitterHandle: '@partnerscrm',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://partnerscrm.com',
};

export function SEO({
  title,
  description = DEFAULT_SEO.description,
  keywords = DEFAULT_SEO.keywords,
  image = DEFAULT_SEO.image,
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  noindex = false,
  structuredData,
}: SEOProps) {
  const fullTitle = title
    ? `${title} | ${DEFAULT_SEO.siteName}`
    : DEFAULT_SEO.title;

  const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : DEFAULT_SEO.url);
  const imageUrl = image.startsWith('http') ? image : `${DEFAULT_SEO.url}${image}`;

  // Default structured data (Organization)
  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: DEFAULT_SEO.siteName,
    description: DEFAULT_SEO.description,
    url: DEFAULT_SEO.url,
    logo: `${DEFAULT_SEO.url}/logo.png`,
    sameAs: [
      'https://www.facebook.com/partnerscrm',
      'https://twitter.com/partnerscrm',
      'https://www.linkedin.com/company/partnerscrm',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+55-11-9999-9999',
      contactType: 'Customer Service',
      availableLanguage: ['Portuguese', 'English'],
    },
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {author && <meta name="author" content={author} />}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={DEFAULT_SEO.siteName} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={imageUrl} />
      <meta property="twitter:site" content={DEFAULT_SEO.twitterHandle} />
      <meta property="twitter:creator" content={DEFAULT_SEO.twitterHandle} />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="pt-BR" />
      <meta name="language" content="Portuguese" />
      <meta name="revisit-after" content="7 days" />
      <meta name="rating" content="general" />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>

      {/* Performance & Security */}
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="format-detection" content="telephone=no" />
    </Helmet>
  );
}

/**
 * Helper function to generate Product structured data
 */
export function generateProductSchema(product: {
  name: string;
  description: string;
  price: number;
  currency?: string;
  image?: string;
  brand?: string;
  sku?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image || DEFAULT_SEO.image,
    brand: {
      '@type': 'Brand',
      name: product.brand || DEFAULT_SEO.siteName,
    },
    sku: product.sku || 'PCRM-001',
    offers: {
      '@type': 'Offer',
      url: DEFAULT_SEO.url,
      priceCurrency: product.currency || 'BRL',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: DEFAULT_SEO.siteName,
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
    },
  };
}

/**
 * Helper function to generate FAQ structured data
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export default SEO;
