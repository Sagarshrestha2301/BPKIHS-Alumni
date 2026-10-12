import { getWelcome } from '@/features/home/get-home-data';
import { WelcomeMessageView } from '@/features/home/welcome-message-view';

export async function WelcomeMessageSection() {
  const message = await getWelcome();
  return <WelcomeMessageView message={message} />;
}
