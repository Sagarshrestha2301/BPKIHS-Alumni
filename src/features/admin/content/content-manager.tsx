'use client';

import { type FormEvent, type KeyboardEvent, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { adminContentPage as copy } from '@/content/admin-content';
import type {
  AdminBoardMember,
  AdminEvent,
  AdminFaqItem,
  AdminFundRow,
  AdminGoal,
  AdminGoalUpdate,
  AdminWelcomeMessage,
  ContentOverview,
} from '@/lib/api/admin';
import {
  adminBoardInputSchema,
  adminEventInputSchema,
  adminFaqInputSchema,
  adminFundInputSchema,
  adminGoalInputSchema,
  adminGoalUpdateInputSchema,
  adminWelcomeInputSchema,
} from '@/lib/api/admin-schemas';
import { isApiError } from '@/lib/api/errors';
import { formatDate, formatDateRange } from '@/lib/format/dates';
import { formatNpr } from '@/lib/format/money';

import { adminRequest } from '../admin-request';
import { AdminPageHeader } from '../page-header';
import { areaClass, controlClass, type FieldDef, RecordEditor } from './record-editor';
import { paisaToRupees, toDateTimeLocal, toJsonText } from './values';

type Tab = keyof typeof copy.tabs;

const TABS: Tab[] = ['events', 'goals', 'updates', 'funds', 'board', 'faq', 'welcome'];

const eventFields = (goals: AdminGoal[]): FieldDef[] => [
  { name: 'slug', label: copy.fields.slug, required: true },
  { name: 'title', label: copy.fields.title, required: true },
  { name: 'summary', label: copy.fields.summary, kind: 'textarea', full: true, required: true },
  {
    name: 'description',
    label: copy.fields.description,
    kind: 'textarea',
    full: true,
    required: true,
  },
  { name: 'startsAt', label: copy.fields.startsAt, kind: 'datetime', required: true },
  { name: 'endsAt', label: copy.fields.endsAt, kind: 'datetime' },
  { name: 'venue', label: copy.fields.venue, required: true },
  { name: 'city', label: copy.fields.city, required: true },
  {
    name: 'mode',
    label: copy.fields.mode,
    kind: 'select',
    options: Object.entries(copy.eventModes).map(([value, label]) => ({ value, label })),
  },
  { name: 'capacity', label: copy.fields.capacity, kind: 'number' },
  { name: 'imageUrl', label: copy.fields.imageUrl },
  {
    name: 'status',
    label: copy.fields.status,
    kind: 'select',
    options: Object.entries(copy.eventStatuses).map(([value, label]) => ({ value, label })),
  },
  {
    name: 'goalId',
    label: copy.fields.goal,
    kind: 'select',
    options: goals.map((goal) => ({ value: goal.id, label: goal.title })),
  },
  {
    name: 'gallery',
    label: copy.fields.gallery,
    kind: 'json',
    full: true,
    hint: 'Array of {"type":"photo","url":"https://…","alt":"…"}. Leave empty for none.',
  },
];

const goalFields: FieldDef[] = [
  { name: 'title', label: copy.fields.title, required: true },
  {
    name: 'description',
    label: copy.fields.description,
    kind: 'textarea',
    full: true,
    required: true,
  },
  { name: 'targetMinor', label: copy.fields.target, kind: 'money', required: true },
  { name: 'raisedMinor', label: copy.fields.raised, kind: 'money' },
  { name: 'deadline', label: copy.fields.deadline, kind: 'datetime' },
  { name: 'imageUrl', label: copy.fields.imageUrl },
  { name: 'sortOrder', label: copy.fields.sortOrder, kind: 'number' },
  { name: 'active', label: copy.fields.active, kind: 'checkbox', hint: copy.fields.active },
];

const updateFields = (goals: AdminGoal[]): FieldDef[] => [
  {
    name: 'goalId',
    label: copy.fields.updateGoal,
    kind: 'select',
    options: goals.map((goal) => ({ value: goal.id, label: goal.title })),
    required: true,
  },
  {
    name: 'body',
    label: copy.fields.updateBody,
    kind: 'textarea',
    full: true,
    required: true,
  },
];

const fundFields: FieldDef[] = [
  { name: 'category', label: copy.fields.category, required: true },
  { name: 'sharePercent', label: copy.fields.sharePercent, kind: 'number', required: true },
  { name: 'period', label: copy.fields.period },
  { name: 'sortOrder', label: copy.fields.sortOrder, kind: 'number' },
];

const boardFields: FieldDef[] = [
  { name: 'name', label: copy.fields.name, required: true },
  { name: 'role', label: copy.fields.role, required: true },
  { name: 'term', label: copy.fields.term, required: true },
  { name: 'batch', label: copy.fields.batch },
  { name: 'photoUrl', label: copy.fields.photoUrl },
  { name: 'sortOrder', label: copy.fields.sortOrder, kind: 'number' },
  { name: 'bio', label: copy.fields.bio, kind: 'textarea', full: true },
  { name: 'visionStatement', label: copy.fields.vision, kind: 'textarea', full: true },
  { name: 'isCurrent', label: copy.fields.current, kind: 'checkbox', hint: copy.fields.current },
];

const faqFields: FieldDef[] = [
  { name: 'category', label: copy.fields.category, required: true },
  { name: 'sortOrder', label: copy.fields.sortOrder, kind: 'number' },
  { name: 'question', label: copy.fields.question, required: true, full: true },
  { name: 'answer', label: copy.fields.answer, kind: 'textarea', full: true, required: true },
];

function byOrder<T extends { sortOrder: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function ContentManager({ initial }: { initial: ContentOverview }) {
  const [tab, setTab] = useState<Tab>('events');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = TABS.length - 1;
    let next: number | null = null;
    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = last;
    if (next === null) return;
    event.preventDefault();
    const target = TABS[next];
    if (!target) return;
    setTab(target);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title={copy.title} description={copy.description} />

      <div role="tablist" aria-label={copy.title} className="flex flex-wrap gap-2">
        {TABS.map((value, index) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`content-tab-${value}`}
            aria-selected={tab === value}
            aria-controls="content-tabpanel"
            tabIndex={tab === value ? 0 : -1}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            onClick={() => setTab(value)}
            onKeyDown={(event) => moveTab(event, index)}
            className={
              tab === value
                ? 'border-primary-700 bg-primary-100 text-primary-900 inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium'
                : 'hover:text-primary-900 inline-flex h-9 items-center rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-600'
            }
          >
            {copy.tabs[value]}
          </button>
        ))}
      </div>

      <div
        id="content-tabpanel"
        role="tabpanel"
        aria-labelledby={`content-tab-${tab}`}
        tabIndex={0}
      >
        {tab === 'events' && (
          <RecordEditor<AdminEvent>
            section="events"
            items={initial.events}
            fields={eventFields(initial.goals)}
            schema={adminEventInputSchema}
            endpoint="/api/v1/admin/content/events"
            emptyLabel={copy.empty.events}
            newDefaults={{ mode: 'in_person', status: 'upcoming' }}
            sortItems={(items) => [...items].sort((a, b) => a.startsAt.localeCompare(b.startsAt))}
            toDefaults={(event) => ({
              slug: event.slug,
              title: event.title,
              summary: event.summary,
              description: event.description,
              startsAt: toDateTimeLocal(event.startsAt),
              endsAt: toDateTimeLocal(event.endsAt),
              venue: event.venue,
              city: event.city,
              mode: event.mode,
              capacity: event.capacity === undefined ? '' : String(event.capacity),
              imageUrl: event.imageUrl ?? '',
              status: event.status,
              goalId: event.goalId ?? '',
              gallery: toJsonText(event.gallery),
            })}
            display={(event) => ({
              title: event.title,
              detail: `${formatDateRange(event.startsAt, event.endsAt)} · ${event.venue}, ${event.city} · ${copy.eventStatuses[event.status] ?? event.status}`,
            })}
          />
        )}

        {tab === 'goals' && (
          <RecordEditor<AdminGoal>
            section="goals"
            items={initial.goals}
            fields={goalFields}
            schema={adminGoalInputSchema}
            endpoint="/api/v1/admin/content/goals"
            emptyLabel={copy.empty.goals}
            newDefaults={{ active: true, sortOrder: '0', raisedMinor: '0' }}
            sortItems={byOrder}
            toDefaults={(goal) => ({
              title: goal.title,
              description: goal.description,
              targetMinor: paisaToRupees(goal.targetMinor),
              raisedMinor: paisaToRupees(goal.raisedMinor),
              deadline: toDateTimeLocal(goal.deadline),
              imageUrl: goal.imageUrl ?? '',
              sortOrder: String(goal.sortOrder),
              active: goal.active,
            })}
            display={(goal) => ({
              title: goal.title,
              detail: `${formatNpr(goal.raisedMinor)} raised of ${formatNpr(goal.targetMinor)} · ${goal.active ? copy.goalStatus.active : copy.goalStatus.inactive}`,
            })}
          />
        )}

        {tab === 'updates' && (
          <RecordEditor<AdminGoalUpdate>
            section="updates"
            items={initial.updates}
            fields={updateFields(initial.goals)}
            schema={adminGoalUpdateInputSchema}
            endpoint="/api/v1/admin/content/updates"
            emptyLabel={copy.empty.updates}
            newDefaults={{ goalId: '' }}
            // Newest first, matching the order donors see on the goal's own page.
            sortItems={(items) => [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))}
            toDefaults={(update) => ({
              goalId: update.goalId,
              body: update.body,
            })}
            display={(update) => {
              const goal = initial.goals.find((item) => item.id === update.goalId);
              return {
                title: goal?.title ?? update.goalId,
                detail: `${formatDate(update.createdAt)} · ${update.body.slice(0, 60)}`,
              };
            }}
          />
        )}

        {tab === 'funds' && (
          <RecordEditor<AdminFundRow>
            section="funds"
            items={initial.funds}
            fields={fundFields}
            schema={adminFundInputSchema}
            endpoint="/api/v1/admin/content/funds"
            emptyLabel={copy.empty.funds}
            newDefaults={{ period: 'current', sortOrder: '0' }}
            sortItems={byOrder}
            toDefaults={(row) => ({
              category: row.category,
              sharePercent: String(row.sharePercent),
              period: row.period,
              sortOrder: String(row.sortOrder),
            })}
            display={(row) => ({
              title: row.category,
              detail: `${row.sharePercent}% · ${row.period}`,
            })}
          />
        )}

        {tab === 'board' && (
          <RecordEditor<AdminBoardMember>
            section="board"
            items={initial.board}
            fields={boardFields}
            schema={adminBoardInputSchema}
            endpoint="/api/v1/admin/content/board"
            emptyLabel={copy.empty.board}
            newDefaults={{ isCurrent: true, sortOrder: '0' }}
            sortItems={byOrder}
            toDefaults={(member) => ({
              name: member.name,
              role: member.role,
              term: member.term,
              batch: member.batch ?? '',
              photoUrl: member.photoUrl ?? '',
              bio: member.bio ?? '',
              visionStatement: member.visionStatement ?? '',
              sortOrder: String(member.sortOrder),
              isCurrent: member.isCurrent,
            })}
            display={(member) => ({
              title: `${member.name}: ${member.role}`,
              detail: `${member.term}${member.isCurrent ? ' · Current board' : ' · Former board'}`,
            })}
          />
        )}

        {tab === 'faq' && (
          <RecordEditor<AdminFaqItem>
            section="faq"
            items={initial.faq}
            fields={faqFields}
            schema={adminFaqInputSchema}
            endpoint="/api/v1/admin/content/faq"
            emptyLabel={copy.empty.faq}
            newDefaults={{ sortOrder: '0' }}
            sortItems={byOrder}
            toDefaults={(item) => ({
              category: item.category,
              question: item.question,
              answer: item.answer,
              sortOrder: String(item.sortOrder),
            })}
            display={(item) => ({ title: item.question, detail: item.category })}
          />
        )}

        {tab === 'welcome' && <WelcomeEditor initial={initial.welcome} />}
      </div>
    </div>
  );
}

function WelcomeEditor({ initial }: { initial: AdminWelcomeMessage | null }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const parsed = adminWelcomeInputSchema.safeParse({
      author: String(form.get('author') ?? '').trim(),
      role: String(form.get('role') ?? '').trim(),
      text: String(form.get('text') ?? '').trim(),
      videoUrl: String(form.get('videoUrl') ?? '').trim() || undefined,
      photoUrl: String(form.get('photoUrl') ?? '').trim() || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? copy.errors.checkFields);
      return;
    }

    setPending(true);
    setError(null);
    setNotice(null);
    try {
      await adminRequest('/api/v1/admin/content/welcome', { method: 'PUT', body: parsed.data });
      setNotice(copy.saved);
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : copy.errors.actionFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="welcome-heading" className="space-y-4">
      <h2 id="welcome-heading" className="font-heading text-primary-900 text-xl font-semibold">
        {copy.sections.welcome}
      </h2>
      {!initial ? <p className="text-sm text-neutral-600">{copy.empty.welcome}</p> : null}
      {(error || notice) && (
        <p
          role={error ? 'alert' : 'status'}
          className={error ? 'text-danger-600 text-sm' : 'text-primary-700 text-sm'}
        >
          {error ?? notice}
        </p>
      )}
      <form
        onSubmit={onSubmit}
        noValidate
        className="grid gap-4 rounded-xl border border-neutral-300 bg-white p-5 sm:grid-cols-2"
      >
        <div>
          <label
            htmlFor="welcome-author"
            className="text-primary-900 mb-1 block text-sm font-medium"
          >
            {copy.fields.author}
          </label>
          <input
            id="welcome-author"
            name="author"
            defaultValue={initial?.author ?? ''}
            required
            className={controlClass}
          />
        </div>
        <div>
          <label htmlFor="welcome-role" className="text-primary-900 mb-1 block text-sm font-medium">
            {copy.fields.authorRole}
          </label>
          <input
            id="welcome-role"
            name="role"
            defaultValue={initial?.role ?? ''}
            required
            className={controlClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="welcome-text" className="text-primary-900 mb-1 block text-sm font-medium">
            {copy.fields.text}
          </label>
          <textarea
            id="welcome-text"
            name="text"
            defaultValue={initial?.text ?? ''}
            required
            rows={6}
            className={areaClass}
          />
        </div>
        <div>
          <label
            htmlFor="welcome-video"
            className="text-primary-900 mb-1 block text-sm font-medium"
          >
            {copy.fields.videoUrl}
          </label>
          <input
            id="welcome-video"
            name="videoUrl"
            defaultValue={initial?.videoUrl ?? ''}
            className={controlClass}
          />
        </div>
        <div>
          <label
            htmlFor="welcome-photo"
            className="text-primary-900 mb-1 block text-sm font-medium"
          >
            {copy.fields.photoUrl}
          </label>
          <input
            id="welcome-photo"
            name="photoUrl"
            defaultValue={initial?.photoUrl ?? ''}
            className={controlClass}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending} className="h-10">
            {pending ? copy.saving : copy.save}
          </Button>
        </div>
      </form>
    </section>
  );
}
