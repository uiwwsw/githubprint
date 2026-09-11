import { serializeStructuredData } from "@/lib/seo";

export function StructuredData({ data }: { data: unknown[] }) {
  return data.map((entry, index) => (
    <script
      key={index}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeStructuredData(entry) }}
    />
  ));
}
