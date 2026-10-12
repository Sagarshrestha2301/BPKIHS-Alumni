import { InitialsAvatar } from '@/components/shared/initials-avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { boardPage } from '@/content/board';
import type { BoardMember } from '@/lib/api/types';

type BoardMemberDialogProps = {
  member: BoardMember | null;
  onClose: () => void;
};

/** Bio and vision statement for one board member. Closed when member is null. */
export function BoardMemberDialog({ member, onClose }: BoardMemberDialogProps) {
  const { dialog } = boardPage;

  return (
    <Dialog
      open={member !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {member ? (
        <DialogContent>
          <DialogHeader>
            <InitialsAvatar name={member.name} size="lg" />
            <DialogTitle>{member.name}</DialogTitle>
            <DialogDescription>
              {[member.role, member.term, member.batch].filter(Boolean).join(', ')}
            </DialogDescription>
          </DialogHeader>
          {member.bio ? (
            <section>
              <h3 className="font-heading text-primary-900 text-lg font-semibold">
                {dialog.bioHeading}
              </h3>
              <p className="mt-1 text-neutral-600">{member.bio}</p>
            </section>
          ) : null}
          {member.visionStatement ? (
            <section>
              <h3 className="font-heading text-primary-900 text-lg font-semibold">
                {dialog.visionHeading}
              </h3>
              <p className="mt-1 text-neutral-600">{member.visionStatement}</p>
            </section>
          ) : null}
          {!member.bio && !member.visionStatement ? (
            <p className="text-neutral-600">{dialog.noDetails}</p>
          ) : null}
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
