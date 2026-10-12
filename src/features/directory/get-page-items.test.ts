import { describe, expect, it } from 'vitest';

import { getPageItems } from '@/features/directory/get-page-items';

describe('getPageItems', () => {
  it('lists every page when there are few', () => {
    expect(getPageItems(1, 3)).toEqual([1, 2, 3]);
  });

  it('adds an ellipsis for gaps at the end', () => {
    expect(getPageItems(1, 10)).toEqual([1, 2, 'ellipsis', 10]);
    expect(getPageItems(10, 10)).toEqual([1, 'ellipsis', 9, 10]);
  });

  it('shows the neighbours of a middle page', () => {
    expect(getPageItems(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
  });
});
