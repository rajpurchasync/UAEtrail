import { useEffect } from 'react';

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
  id?: string;
}

/** Injects schema.org JSON-LD into document head for SEO. */
export function JsonLd({ data, id = 'json-ld-primary' }: JsonLdProps) {
  useEffect(() => {
    const scriptId = `json-ld-${id}`;
    let el = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.id = scriptId;
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);

    return () => {
      el?.remove();
    };
  }, [data, id]);

  return null;
}
