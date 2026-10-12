import { Section } from '@/components/layout/section';
import { SectionHeading } from '@/components/shared/section-heading';

export default function HomePage() {
  return (
    <Section>
      <SectionHeading
        as="h1"
        eyebrow="Temporary page"
        title="BPKIHS Alumni Association"
        description="Phase 4 replaces this with the real home page. Developers: see /styleguide for every component."
      />
      <p lang="ne" className="text-body-l mt-4">
        बी.पी. कोइराला स्वास्थ्य विज्ञान प्रतिष्ठान
      </p>
    </Section>
  );
}
