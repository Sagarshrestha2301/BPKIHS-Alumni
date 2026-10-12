import {
  DIRECTORY_PAGE_SIZE,
  type DirectoryParams,
} from '@/features/directory/parse-directory-params';
import type { AlumniListParams } from '@/lib/api/types';

/** Turns the URL state into the API call. Unset filters are left out. */
export function toAlumniListParams(params: DirectoryParams): AlumniListParams {
  return {
    sort: params.sort,
    page: params.page,
    pageSize: DIRECTORY_PAGE_SIZE,
    ...(params.q ? { q: params.q } : {}),
    ...(params.programme ? { programme: params.programme } : {}),
    ...(params.batchYear ? { batchYear: params.batchYear } : {}),
    ...(params.country ? { country: params.country } : {}),
    ...(params.city ? { city: params.city } : {}),
    ...(params.furtherStudies ? { furtherStudies: true } : {}),
  };
}
