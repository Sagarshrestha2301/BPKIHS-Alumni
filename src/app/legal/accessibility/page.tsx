import type { Metadata } from 'next';

import { legalDocuments } from '@/content/legal';
import { LegalDocumentPage } from '@/features/legal/legal-document';

const document = legalDocuments.accessibility;

export const metadata: Metadata = {
  title: document.title,
  description: document.description,
  alternates: { canonical: '/legal/accessibility' },
};

export default function AccessibilityPage() {
  return <LegalDocumentPage document={document} />;
}
