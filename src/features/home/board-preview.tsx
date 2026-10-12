import { BoardPreviewView } from '@/features/home/board-preview-view';
import { getBoardPreview } from '@/features/home/get-home-data';

export async function BoardPreview() {
  const members = await getBoardPreview();
  return <BoardPreviewView members={members} />;
}
