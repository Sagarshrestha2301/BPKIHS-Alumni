import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { howWeWork } from '@/content/about';

export function HowWeWorkAccordion() {
  return (
    <Accordion className="rounded-xl border border-neutral-300 bg-white px-6">
      {howWeWork.items.map((item) => (
        <AccordionItem key={item.value} value={item.value}>
          <AccordionTrigger className="text-primary-900 min-h-12 items-center py-4 text-base font-semibold">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-base text-neutral-600">
            {item.answer.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
