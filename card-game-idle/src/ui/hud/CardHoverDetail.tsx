/**
 * CardHoverDetail
 *
 * Wraps any card element rendered during a turn (hand, board, angel drawer).
 * After 1.5 s of continuous hover the full CollectionCardDetail modal is shown
 * via a React portal, exactly as in the Deck Builder / Card Collection screen.
 * Moving the mouse away before 1.5 s cancels the timer and nothing appears.
 */
import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore, selectProgress } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import CollectionCardDetail from '@/ui/store/CollectionCardDetail';
import type { CardFinish } from '@/types/cards';

interface Props {
  definitionId: string;
  finish: CardFinish;
  /** Suppress the hover timer (e.g. while dragging or attack panel open). */
  disabled?: boolean;
  /** Optional CTA label shown as a primary button inside the hover detail modal. */
  actionLabel?: string;
  /** Called when the CTA button is pressed. Modal will close after calling. */
  onAction?: () => void;
  /** When true the CTA button is rendered but greyed out. */
  actionDisabled?: boolean;
  children: React.ReactNode;
}

const HOVER_DELAY_MS = 1500;

export default function CardHoverDetail({ definitionId, finish, disabled = false, actionLabel, onAction, actionDisabled, children }: Props) {
  const progress = useStore(selectProgress);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      setOpen(true);
    }, HOVER_DELAY_MS);
  }, [disabled, clearTimer]);

  const handleMouseLeave = useCallback(() => {
    clearTimer();
    // Don't close the modal on mouse-leave — the modal handles its own close button
    // and the user may want to move into it. We only cancel the pending open.
  }, [clearTimer]);

  const handleClose = useCallback(() => {
    setOpen(false);
    clearTimer();
  }, [clearTimer]);

  const card = CardRegistry.get(definitionId);
  const owned = progress.collection[definitionId] ?? 0;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ display: 'contents' }}
    >
      {children}
      {open && card && createPortal(
        <CollectionCardDetail
          card={card}
          finish={finish}
          owned={owned}
          onClose={handleClose}
          actionLabel={actionLabel}
          onAction={onAction}
          actionDisabled={actionDisabled}
        />,
        document.body,
      )}
    </div>
  );
}
