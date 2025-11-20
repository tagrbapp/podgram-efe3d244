import { useEffect } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  faqs: FAQItem[];
}

const FAQSchema = ({ faqs }: FAQSchemaProps) => {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer,
        },
      })),
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema);
    script.id = "faq-schema";

    // Remove existing FAQ schema if any
    const existingScript = document.getElementById("faq-schema");
    if (existingScript) {
      existingScript.remove();
    }

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("faq-schema");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [faqs]);

  return null;
};

export default FAQSchema;
