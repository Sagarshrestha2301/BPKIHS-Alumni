'use client';

import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { boardPage } from '@/content/board';
import { BoardMemberCard } from '@/features/governance/board-member-card';
import { BoardMemberDialog } from '@/features/governance/board-member-dialog';
import { groupByTerm } from '@/features/governance/group-board-terms';
import type { BoardMember } from '@/lib/api/types';

type BoardTabsProps = {
  current: BoardMember[];
  previous: BoardMember[];
};

function MemberList({
  members,
  onSelect,
}: {
  members: BoardMember[];
  onSelect: (member: BoardMember) => void;
}) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <li key={member.id}>
          <BoardMemberCard member={member} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}

/** Current and previous boards in tabs. Selecting a member opens their dialog. */
export function BoardTabs({ current, previous }: BoardTabsProps) {
  const [selected, setSelected] = useState<BoardMember | null>(null);
  const groups = groupByTerm(previous);
  const sample = [...current, ...previous].some((member) => member.placeholder);

  return (
    <>
      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">{boardPage.tabs.current}</TabsTrigger>
          <TabsTrigger value="previous">{boardPage.tabs.previous}</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-8">
          <h2 className="sr-only">{boardPage.tabs.current}</h2>
          {current.length === 0 ? (
            <p className="text-neutral-600">{boardPage.emptyCurrent}</p>
          ) : (
            <MemberList members={current} onSelect={setSelected} />
          )}
        </TabsContent>

        <TabsContent value="previous" className="mt-8">
          <h2 className="sr-only">{boardPage.tabs.previous}</h2>
          {groups.length === 0 ? (
            <p className="text-neutral-600">{boardPage.emptyPrevious}</p>
          ) : (
            <div className="space-y-10">
              {groups.map((group) => (
                <div key={group.term}>
                  <h3 className="font-heading text-primary-900 mb-4 text-xl font-semibold">
                    {group.term}
                  </h3>
                  <MemberList members={group.members} onSelect={setSelected} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {sample ? <p className="mt-6 text-sm text-neutral-600">{boardPage.sampleNote}</p> : null}

      <BoardMemberDialog member={selected} onClose={() => setSelected(null)} />
    </>
  );
}
