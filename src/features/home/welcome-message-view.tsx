import Image from 'next/image';

import { Section } from '@/components/layout/section';
import { Eyebrow } from '@/components/shared/eyebrow';
import { InitialsAvatar } from '@/components/shared/initials-avatar';
import { welcomeSection } from '@/content/home';
import type { WelcomeMessage } from '@/lib/api/types';

/**
 * Turns a YouTube or Vimeo link into something the page may embed. Anything else stays a
 * plain link: an arbitrary URL is never put in an iframe.
 */
function embedUrl(videoUrl: string): string | null {
  try {
    const url = new URL(videoUrl);
    if (url.hostname === 'youtu.be')
      return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
    if (url.hostname.endsWith('youtube.com')) {
      const id = url.searchParams.get('v');
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
      const shorts = url.pathname.match(/^\/(shorts|embed)\/([\w-]+)/);
      if (shorts?.[2]) return `https://www.youtube-nocookie.com/embed/${shorts[2]}`;
      return null;
    }
    if (url.hostname.endsWith('vimeo.com')) {
      const id = url.pathname.match(/^\/(\d+)/);
      if (id?.[1]) return `https://player.vimeo.com/video/${id[1]}`;
      return null;
    }
    return null;
  } catch {
    return null;
  }
}

/** The leadership's welcome message. It hides itself while the text is empty. */
export function WelcomeMessageView({ message }: { message: WelcomeMessage }) {
  const paragraphs = message.text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return null;

  const embed = message.videoUrl ? embedUrl(message.videoUrl) : null;

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
            {message.photoUrl ? (
              <Image
                src={message.photoUrl}
                alt=""
                width={64}
                height={64}
                unoptimized
                className="size-16 shrink-0 rounded-full border border-neutral-300 object-cover"
              />
            ) : (
              <InitialsAvatar name={message.author} size="lg" />
            )}
            <div>
              <p className="text-primary-900 font-semibold">{message.author}</p>
              <p className="text-sm text-neutral-600">{message.role}</p>
            </div>
          </figcaption>
        </figure>

        {embed ? (
          <div className="mt-6 aspect-video overflow-hidden rounded-xl border border-neutral-300 bg-black">
            <iframe
              src={embed}
              title={`Video message from ${message.author}`}
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        ) : message.videoUrl ? (
          <p className="mt-6">
            <a
              href={message.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-700 underline underline-offset-4"
            >
              Watch the video message
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        ) : null}
      </div>
    </Section>
  );
}
