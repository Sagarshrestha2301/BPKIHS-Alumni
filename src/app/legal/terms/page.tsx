import type { Metadata } from 'next';

import { legalDocuments } from '@/content/legal';
import { LegalDocumentPage } from '@/features/legal/legal-document';

const document = legalDocuments.terms;

export const metadata: Metadata = {
  title: document.title,
  description: document.description,
  alternates: { canonical: '/legal/terms' },
};

export default function TermsPage() {
  return <LegalDocumentPage document={document} />;
}
