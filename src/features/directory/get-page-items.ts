export type PageItem = number | 'ellipsis';

/** Page numbers to show: first, last, and the current page with its neighbours. */
export function getPageItems(current: number, total: number): PageItem[] {
  const wanted = new Set([1, total, current - 1, current, current + 1]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const items: PageItem[] = [];
  pages.forEach((n, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && n - previous > 1) items.push('ellipsis');
    items.push(n);
  });
  return items;
}
