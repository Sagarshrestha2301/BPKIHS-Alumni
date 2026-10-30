'use client';

import { adminPostsPage as copy } from '@/content/admin';
import type { AdminPost } from '@/lib/api/admin';
import { adminPostInputSchema } from '@/lib/api/admin-schemas';

import { type FieldDef, RecordEditor } from './content/record-editor';

const staffFields: FieldDef[] = [
  {
    name: 'type',
    label: copy.staff.fields.type,
    kind: 'select',
    options: Object.entries(copy.staff.typeLabels).map(([value, label]) => ({ value, label })),
  },
  { name: 'title', label: copy.staff.fields.title, required: true },
  { name: 'author', label: copy.staff.fields.author, required: true },
  { name: 'imageUrl', label: copy.staff.fields.imageUrl },
  {
    name: 'body',
    label: copy.staff.fields.body,
    kind: 'textarea',
    full: true,
    required: true,
  },
];

/** Staff-written news, notices and announcements: created already published. */
export function StaffPostEditor({ posts }: { posts: AdminPost[] }) {
  return (
    <RecordEditor<AdminPost>
      section="staff-posts"
      items={posts}
      fields={staffFields}
      schema={adminPostInputSchema}
      endpoint="/api/v1/admin/posts"
      emptyLabel={copy.staff.empty}
      description={copy.staff.description}
      newDefaults={{ type: 'news' }}
      sortItems={(items) => [...items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))}
      toDefaults={(post) => ({
        type: post.type,
        title: post.title,
        body: post.body,
        author: post.author,
        imageUrl: post.imageUrl ?? '',
      })}
      display={(post) => ({
        title: post.title,
        detail: `${copy.staff.typeLabels[post.type] ?? post.type} · ${post.author}`,
      })}
    />
  );
}
