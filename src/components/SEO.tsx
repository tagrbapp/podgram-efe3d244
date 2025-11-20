import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
  canonicalUrl?: string;
}

const SEO = ({
  title = "Podgram - منصة السوق الفاخرة الأولى",
  description = "اكتشف أفضل منصة لبيع وشراء المنتجات الفاخرة في السعودية. ساعات، حقائب، مجوهرات، سيارات وعقارات.",
  keywords = "مزادات فاخرة, ساعات فاخرة, حقائب فاخرة, مجوهرات, السعودية",
  image = "https://lovable.dev/opengraph-image-p98pqg.png",
  type = "website",
  canonicalUrl,
}: SEOProps) => {
  const location = useLocation();
  const baseUrl = "https://podgram.lovable.app";
  const currentUrl = canonicalUrl || `${baseUrl}${location.pathname}`;

  useEffect(() => {
    // Update title
    document.title = title;

    // Update meta tags
    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'keywords', keywords);
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:image', image);
    updateMetaTag('property', 'og:url', currentUrl);
    updateMetaTag('property', 'og:type', type);
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', image);

    // Update canonical link
    updateCanonicalLink(currentUrl);
  }, [title, description, keywords, image, type, currentUrl]);

  return null;
};

const updateMetaTag = (attr: string, attrValue: string, content: string) => {
  let element = document.querySelector(`meta[${attr}="${attrValue}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, attrValue);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
};

const updateCanonicalLink = (url: string) => {
  let link = document.querySelector('link[rel="canonical"]');
  
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  
  link.setAttribute('href', url);
};

export default SEO;
