import type { Metadata } from 'next';

import { legalDocuments } from '@/content/legal';
import { LegalDocumentPage } from '@/features/legal/legal-document';

const document = legalDocuments.privacy;

export const metadata: Metadata = {
  title: document.title,
  description: document.description,
  alternates: { canonical: '/legal/privacy' },
};

export default function PrivacyPage() {
  return <LegalDocumentPage document={document} />;
}
