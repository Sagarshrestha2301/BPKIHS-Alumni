import { cn } from '@/lib/utils';

export interface BarChartDatum {
  key: string;
  label: string;
  /** The total the bar represents. */
  value: number;
  /** Part of `value` that is still waiting; drawn as the lighter top segment. */
  secondary?: number;
}

export interface BarChartLabels {
  month: string;
  value: string;
  /** Only needed when the chart has a second, stacked series. */
  secondary?: string;
}

/**
 * Six months of one number, drawn with plain divs.
 *
 * Deliberately no chart library: the dashboard only needs bars, and a library would ship
 * client JavaScript for something the server can draw. The picture is hidden from assistive
 * technology and the same numbers are rendered as a real table underneath.
 */
export function AdminBarChart({
  data,
  title,
  description,
  formatValue,
  formatAxis = formatValue,
  empty,
  tableCaption,
  labels,
  primaryLabel,
  secondaryLabel,
  className,
}: {
  data: BarChartDatum[];
  title: string;
  description?: string;
  formatValue: (value: number) => string;
  /** Shorter form for the label above each bar. Falls back to `formatValue`. */
  formatAxis?: (value: number) => string;
  empty: string;
  tableCaption: string;
  labels: BarChartLabels;
  primaryLabel?: string;
  secondaryLabel?: string;
  className?: string;
}) {
  const maximum = Math.max(1, ...data.map((item) => item.value));
  const allZero = data.every((item) => item.value === 0);
  const columns = { gridTemplateColumns: `repeat(${Math.max(1, data.length)}, minmax(0, 1fr))` };
  const headingId = `chart-${tableCaption.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn('rounded-xl border border-neutral-300 bg-white p-5 shadow-sm', className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={headingId} className="text-primary-900 text-sm font-semibold">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-xs text-neutral-600">{description}</p> : null}
        </div>
        {secondaryLabel && data.some((item) => (item.secondary ?? 0) > 0) ? (
          <ul className="flex items-center gap-3 text-[0.6875rem] text-neutral-600">
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="bg-primary-700 size-2 rounded-full" />
              {primaryLabel}
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="bg-primary-500 size-2 rounded-full" />
              {secondaryLabel}
            </li>
          </ul>
        ) : null}
      </div>

      {allZero ? (
        <p className="mt-8 rounded-lg bg-neutral-100 px-4 py-8 text-center text-sm text-neutral-600">
          {empty}
        </p>
      ) : (
        <div className="mt-6" aria-hidden="true">
          <div
            className="grid gap-2 text-center text-[0.6875rem] font-medium text-neutral-600"
            style={columns}
          >
            {data.map((item) => (
              <span key={item.key}>{formatAxis(item.value)}</span>
            ))}
          </div>
          <div className="mt-2 grid h-40 items-end gap-2" style={columns}>
            {data.map((item) => {
              const total = Math.max(2, (item.value / maximum) * 100);
              const pendingShare = item.value > 0 ? (item.secondary ?? 0) / item.value : 0;
              return (
                <div
                  key={item.key}
                  className="flex h-full items-end"
                  title={`${item.label}: ${formatValue(item.value)}`}
                >
                  <div
                    className="bg-primary-700 w-full overflow-hidden rounded-t-md"
                    style={{ height: `${total}%`, minHeight: item.value === 0 ? 2 : undefined }}
                  >
                    {pendingShare > 0 ? (
                      <div
                        className="bg-primary-500 w-full"
                        style={{ height: `${Math.min(100, pendingShare * 100)}%` }}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 grid gap-2 text-center text-xs text-neutral-600" style={columns}>
            {data.map((item) => (
              <span key={item.key}>{item.label}</span>
            ))}
          </div>
        </div>
      )}

      <table className="sr-only">
        <caption>{tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{labels.month}</th>
            <th scope="col">{labels.value}</th>
            {secondaryLabel ? <th scope="col">{labels.secondary}</th> : null}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.key}>
              <th scope="row">{item.label}</th>
              <td>{formatValue(item.value)}</td>
              {secondaryLabel ? <td>{formatValue(item.secondary ?? 0)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
