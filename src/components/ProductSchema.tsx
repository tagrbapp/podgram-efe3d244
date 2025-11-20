import { useEffect } from 'react';

interface ProductSchemaProps {
  name: string;
  description?: string;
  image?: string[];
  price: number;
  priceCurrency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  condition?: 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition';
  category?: string;
  brand?: string;
  url: string;
  seller?: {
    name: string;
    url?: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  offers?: {
    priceValidUntil?: string;
    priceSpecification?: {
      minPrice?: number;
      maxPrice?: number;
    };
  };
}

const ProductSchema = ({
  name,
  description,
  image = [],
  price,
  priceCurrency = "SAR",
  availability = "InStock",
  condition = "UsedCondition",
  category,
  brand,
  url,
  seller,
  aggregateRating,
  offers,
}: ProductSchemaProps) => {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": name,
      "description": description || `منتج فاخر: ${name}`,
      "image": image.length > 0 ? image : undefined,
      "brand": brand ? {
        "@type": "Brand",
        "name": brand
      } : undefined,
      "offers": {
        "@type": "Offer",
        "url": url,
        "priceCurrency": priceCurrency,
        "price": price.toFixed(2),
        "priceValidUntil": offers?.priceValidUntil,
        "availability": `https://schema.org/${availability}`,
        "itemCondition": `https://schema.org/${condition}`,
        "seller": seller ? {
          "@type": "Organization",
          "name": seller.name,
          "url": seller.url
        } : undefined,
        ...(offers?.priceSpecification && {
          "priceSpecification": {
            "@type": "PriceSpecification",
            "minPrice": offers.priceSpecification.minPrice,
            "maxPrice": offers.priceSpecification.maxPrice,
            "priceCurrency": priceCurrency
          }
        })
      },
      "category": category,
      ...(aggregateRating && aggregateRating.reviewCount > 0 && {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": aggregateRating.ratingValue.toFixed(1),
          "reviewCount": aggregateRating.reviewCount
        }
      })
    };

    // Remove undefined fields
    const cleanSchema = JSON.parse(JSON.stringify(schema));

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(cleanSchema);
    script.id = "product-schema";

    // Remove existing product schema if any
    const existingScript = document.getElementById("product-schema");
    if (existingScript) {
      existingScript.remove();
    }

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("product-schema");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [name, description, image, price, priceCurrency, availability, condition, category, brand, url, seller, aggregateRating, offers]);

  return null;
};

export default ProductSchema;
