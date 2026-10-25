import { type JsonLdValue, serializeJsonLd } from '@/lib/seo/json-ld';

/**
 * Emits schema.org structured data. The payload is serialised by `serializeJsonLd`, which
 * escapes every `<`, so a database value can never close the script tag.
 */
export function JsonLd({ value }: { value: JsonLdValue }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(value) }}
    />
  );
}
