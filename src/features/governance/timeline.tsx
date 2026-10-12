export type TimelineItem = { key: string; when: string; title: string; text: string };

/** A vertical timeline as an ordered list. */
export function Timeline({ items }: { items: readonly TimelineItem[] }) {
  return (
    <ol className="border-primary-100 space-y-8 border-l-2 pl-8">
      {items.map((item) => (
        <li key={item.key} className="relative">
          <span
            aria-hidden="true"
            className="bg-primary-700 absolute top-1.5 -left-[39px] size-3 rounded-full ring-4 ring-white"
          />
          <p className="text-eyebrow text-primary-700 font-semibold tracking-[0.08em] uppercase">
            {item.when}
          </p>
          <h3 className="font-heading text-primary-900 mt-1 text-xl font-semibold">{item.title}</h3>
          <p className="mt-1 max-w-xl text-neutral-600">{item.text}</p>
        </li>
      ))}
    </ol>
  );
}
