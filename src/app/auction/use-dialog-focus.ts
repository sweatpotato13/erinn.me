import type { RefObject } from "react";
import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(dialog: HTMLElement) {
    return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

function handleDialogKeyDown(
    event: KeyboardEvent,
    dialog: HTMLElement,
    onClose: () => void
) {
    if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
    }
    if (event.key !== "Tab") return;
    const elements = getFocusableElements(dialog);
    const first = elements[0];
    const last = elements.at(-1);
    if (!first || !last) {
        event.preventDefault();
        dialog.focus();
    } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function getFocusRestoreTarget(
    previousFocus: Element | null,
    fallbackFocusId?: string
) {
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        return previousFocus;
    }
    return fallbackFocusId ? document.getElementById(fallbackFocusId) : null;
}

export function useDialogFocus(
    onClose: () => void,
    triggerRef?: RefObject<HTMLElement | null>,
    fallbackFocusId?: string,
    preventInitialScroll = false
) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const previousFocus = triggerRef?.current ?? document.activeElement;
        const focusable = getFocusableElements(dialog);
        (focusable[0] ?? dialog).focus({ preventScroll: preventInitialScroll });

        const handleKeyDown = (event: KeyboardEvent) =>
            handleDialogKeyDown(event, dialog, onCloseRef.current);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            getFocusRestoreTarget(previousFocus, fallbackFocusId)?.focus();
        };
    }, [fallbackFocusId, preventInitialScroll, triggerRef]);

    return dialogRef;
}
