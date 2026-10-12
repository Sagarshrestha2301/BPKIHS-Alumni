import { CommunityPostsView } from '@/features/home/community-posts-view';
import { getLatestPosts } from '@/features/home/get-home-data';

export async function CommunityPosts() {
  const posts = await getLatestPosts();
  return <CommunityPostsView posts={posts} />;
}
