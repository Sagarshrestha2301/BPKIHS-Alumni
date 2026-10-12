import { BoardTabs } from '@/features/governance/board-tabs';
import { getBoards } from '@/features/governance/get-board-data';

/** Server component: fetches the cached boards and renders the tabs. */
export async function BoardSection() {
  const { current, previous } = await getBoards();
  return <BoardTabs current={current} previous={previous} />;
}
