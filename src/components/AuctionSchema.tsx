import { useEffect } from 'react';

interface AuctionSchemaProps {
  name: string;
  description?: string;
  image?: string[];
  startingPrice: number;
  currentBid?: number;
  priceCurrency?: string;
  auctionStart: string;
  auctionEnd: string;
  category?: string;
  url: string;
  seller?: {
    name: string;
    url?: string;
  };
  status: 'active' | 'ended';
}

const AuctionSchema = ({
  name,
  description,
  image = [],
  startingPrice,
  currentBid,
  priceCurrency = "SAR",
  auctionStart,
  auctionEnd,
  category,
  url,
  seller,
  status,
}: AuctionSchemaProps) => {
  useEffect(() => {
    const isActive = status === 'active' && new Date(auctionEnd) > new Date();
    
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": name,
      "description": description || `مزاد مباشر: ${name}`,
      "image": image && image.length > 0 ? image : undefined,
      "category": category,
      "offers": {
        "@type": "AggregateOffer",
        "url": url,
        "priceCurrency": priceCurrency,
        "lowPrice": startingPrice.toFixed(2),
        "highPrice": (currentBid || startingPrice).toFixed(2),
        "price": (currentBid || startingPrice).toFixed(2),
        "availability": isActive ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "priceValidUntil": auctionEnd,
        "seller": seller ? {
          "@type": "Organization",
          "name": seller.name,
          "url": seller.url
        } : undefined,
        "auctionStart": auctionStart,
        "auctionEnd": auctionEnd,
        "validFrom": auctionStart,
        "validThrough": auctionEnd
      },
      "additionalType": "Auction",
      "potentialAction": isActive ? {
        "@type": "BuyAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": url,
          "actionPlatform": [
            "http://schema.org/DesktopWebPlatform",
            "http://schema.org/MobileWebPlatform"
          ]
        }
      } : undefined
    };

    // Remove undefined fields
    const cleanSchema = JSON.parse(JSON.stringify(schema));

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(cleanSchema);
    script.id = "auction-schema";

    // Remove existing auction schema if any
    const existingScript = document.getElementById("auction-schema");
    if (existingScript) {
      existingScript.remove();
    }

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("auction-schema");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [name, description, image, startingPrice, currentBid, priceCurrency, auctionStart, auctionEnd, category, url, seller, status]);

  return null;
};

export default AuctionSchema;
