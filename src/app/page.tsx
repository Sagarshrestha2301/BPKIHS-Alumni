import { Section } from '@/components/layout/section';
import { DonateButton } from '@/components/shared/donate-button';
import { Eyebrow } from '@/components/shared/eyebrow';
import { SectionHeading } from '@/components/shared/section-heading';
import { Button } from '@/components/ui/button';

const swatches = [
  { name: 'primary-900', className: 'bg-primary-900' },
  { name: 'primary-700', className: 'bg-primary-700' },
  { name: 'primary-500', className: 'bg-primary-500' },
  { name: 'primary-100', className: 'bg-primary-100' },
  { name: 'accent-700', className: 'bg-accent-700' },
  { name: 'accent-600', className: 'bg-accent-600' },
  { name: 'accent-500', className: 'bg-accent-500' },
  { name: 'success-600', className: 'bg-success-600' },
  { name: 'warning-600', className: 'bg-warning-600' },
  { name: 'danger-600', className: 'bg-danger-600' },
];

export default function HomePage() {
  return (
    <main>
      <Section>
        <SectionHeading
          as="h1"
          eyebrow="Design check (temporary page)"
          title="BPKIHS Alumni Association"
          description="This page only proves the type scale, spacing and components. Phase 4 replaces it with the real home page."
        />
        <p lang="ne" className="text-body-l mt-4">
          बी.पी. कोइराला स्वास्थ्य विज्ञान प्रतिष्ठान
        </p>
      </Section>

      <Section tone="tint">
        <SectionHeading
          title="Type scale"
          description="Resize the window past 1024px: sizes step up."
        />
        <div className="mt-8 space-y-5">
          <p className="font-heading text-display lg:text-display-lg leading-[1.1] font-bold">
            Display: Once BPKIHS, always BPKIHS
          </p>
          <h1>H1: Alumni directory</h1>
          <h2>H2: Featured giving goals</h2>
          <h3>H3: Upcoming events</h3>
          <p className="text-body-l leading-relaxed">
            Body L: a short, plain-English introduction.
          </p>
          <p>Body: the default text size for paragraphs and forms.</p>
          <p className="text-sm text-neutral-600">Small: captions and helper text.</p>
          <Eyebrow>Eyebrow label</Eyebrow>
        </div>
      </Section>

      <Section>
        <SectionHeading title="Buttons and colours" />
        <div className="mt-8 flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <DonateButton>Give now</DonateButton>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {swatches.map((s) => (
            <div key={s.name} className="space-y-1">
              <div className={`h-12 rounded-lg ${s.className}`} />
              <p className="text-xs text-neutral-600">{s.name}</p>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
