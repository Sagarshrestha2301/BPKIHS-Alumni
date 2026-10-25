import { getWelcome } from '@/features/home/get-home-data';
import { WelcomeMessageView } from '@/features/home/welcome-message-view';

export async function WelcomeMessageSection() {
  const message = await getWelcome();
  if (!message) return null;
  return <WelcomeMessageView message={message} />;
}
