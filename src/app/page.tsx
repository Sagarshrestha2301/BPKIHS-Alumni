import { Button } from '@/components/ui/button';

const swatches = [
  { name: 'primary-900', className: 'bg-primary-900' },
  { name: 'primary-700', className: 'bg-primary-700' },
  { name: 'primary-500', className: 'bg-primary-500' },
  { name: 'primary-100', className: 'bg-primary-100' },
  { name: 'accent-600', className: 'bg-accent-600' },
  { name: 'accent-500', className: 'bg-accent-500' },
  { name: 'success-600', className: 'bg-success-600' },
  { name: 'warning-600', className: 'bg-warning-600' },
  { name: 'danger-600', className: 'bg-danger-600' },
];

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 p-6">
      <header className="space-y-2">
        <p className="text-primary-700 text-xs font-semibold tracking-widest uppercase">
          Token check (temporary page)
        </p>
        <h1 className="text-primary-900 text-4xl font-bold">BPKIHS Alumni Association</h1>
        <p className="text-neutral-600">
          This heading is Source Serif 4. This paragraph is Inter. If both look different, the fonts
          work.
        </p>
        <p lang="ne" className="text-lg">
          बी.पी. कोइराला स्वास्थ्य विज्ञान प्रतिष्ठान
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <a
            href="#"
            className="bg-accent-600 hover:bg-accent-700 inline-flex h-8 items-center rounded-lg px-4 text-sm font-medium text-white"
          >
            Give now
          </a>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Colours</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {swatches.map((s) => (
            <div key={s.name} className="space-y-1">
              <div className={`h-12 rounded-lg ${s.className}`} />
              <p className="text-xs text-neutral-600">{s.name}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
