import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "../i18n/LocaleProvider";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Props = {
  /** Heading text; the dialog is labelled by it. */
  title: string;
  /** Optional supporting sentence naming the object and the consequence. */
  description?: string;
  children?: ReactNode;
  /** Label of the action that proceeds, e.g. "Delete". Never "OK". */
  confirmLabel: string;
  /** Label of the safe choice; defaults to the localised "Cancel". */
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** A destructive dialog ignores Escape and outside clicks. */
  destructive?: boolean;
  /** True while the confirmed action is in flight; both actions are disabled. */
  busy?: boolean;
};

/**
 * A centred, blocking dialog for a short decision (frontend page guide,
 * "Confirmations and destructive actions"). Focus moves to the safe choice,
 * Tab is trapped inside, focus returns to the trigger on close, and the page
 * behind is inert for pointer and keyboard users. Destructive dialogs close
 * only through an explicit choice — Escape and outside clicks are ignored.
 */
export function Dialog({
  title,
  description,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
  busy = false,
}: Props) {
  const { t } = useLocale();
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const dismissible = !destructive;
  const dismissibleRef = useRef(dismissible);
  dismissibleRef.current = dismissible;
  const busyRef = useRef(busy);
  busyRef.current = busy;

  useEffect(() => {
    restoreRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Destructive dialogs put initial focus on the safe choice; a
    // non-destructive dialog with a field focuses the field so the user can
    // type immediately.
    const field = destructive
      ? null
      : dialogRef.current?.querySelector<HTMLElement>("input, select, textarea");
    (field ?? cancelRef.current)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (event.key === "Escape") {
        if (dismissibleRef.current && !busyRef.current) onCancelRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus();
    };
  }, []);

  const onBackdrop = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (dismissibleRef.current && !busyRef.current) onCancelRef.current();
  }, []);

  return createPortal(
    <div className="dialog-backdrop" onMouseDown={onBackdrop}>
      <div
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <h2 id={titleId} className="dialog__title">
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className="dialog__description">
            {description}
          </p>
        ) : null}
        {children ? <div className="dialog__body">{children}</div> : null}
        <div className="dialog__actions">
          <button
            ref={cancelRef}
            type="button"
            className="btn btn--secondary"
            onClick={onCancel}
            disabled={busy}
            data-testid="dialog-cancel"
          >
            {cancelLabel ?? t("cancel")}
          </button>
          <button
            type="button"
            className={destructive ? "btn btn--danger" : "btn btn--primary"}
            onClick={onConfirm}
            disabled={busy}
            data-testid="dialog-confirm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
