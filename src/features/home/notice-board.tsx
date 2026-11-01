import { getNotices } from '@/features/home/get-home-data';
import { NoticeBoardView } from '@/features/home/notice-board-view';

export async function NoticeBoard() {
  const notices = await getNotices();
  return <NoticeBoardView notices={notices} />;
}
