import { Section } from '@/components/layout/section';
import { Eyebrow } from '@/components/shared/eyebrow';
import { InitialsAvatar } from '@/components/shared/initials-avatar';
import { welcomeSection } from '@/content/home';
import type { WelcomeMessage } from '@/lib/api/types';

/** Text-only welcome message (no video, per the owner). Hides itself when there is no text. */
export function WelcomeMessageView({ message }: { message: WelcomeMessage }) {
  const paragraphs = message.text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return null;

  return (
    <Section tone="tint" aria-labelledby="welcome-heading">
      <div className="max-w-3xl">
        <Eyebrow>{welcomeSection.eyebrow}</Eyebrow>
        <h2 id="welcome-heading" className="font-heading mt-2">
          {welcomeSection.title}
        </h2>
        <figure className="mt-6">
          <blockquote className="space-y-4 text-lg text-neutral-900">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </blockquote>
          <figcaption className="mt-6 flex items-center gap-4">
            <InitialsAvatar name={message.author} size="lg" />
            <div>
              <p className="text-primary-900 font-semibold">{message.author}</p>
              <p className="text-sm text-neutral-600">{message.role}</p>
              {message.placeholder ? <p className="text-sm text-neutral-600">Sample data</p> : null}
            </div>
          </figcaption>
        </figure>
      </div>
    </Section>
  );
}
