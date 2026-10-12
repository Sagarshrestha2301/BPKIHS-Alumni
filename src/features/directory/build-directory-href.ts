import type { DirectoryParams } from '@/features/directory/parse-directory-params';

/** The directory URL for the given state. Defaults are left out so links stay short. */
export function buildDirectoryHref(params: DirectoryParams): string {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.programme) query.set('programme', params.programme);
  if (params.batchYear) query.set('batch', String(params.batchYear));
  if (params.country) query.set('country', params.country);
  if (params.city) query.set('city', params.city);
  if (params.furtherStudies) query.set('further', '1');
  if (params.sort !== 'name') query.set('sort', params.sort);
  if (params.page > 1) query.set('page', String(params.page));
  const text = query.toString();
  return text ? '/directory?' + text : '/directory';
}
