import { useEffect, useRef, useState } from "react";

import type { AuctionResultFilters } from "@/app/auction/use-auction-search";
import { useDialogFocus } from "@/app/auction/use-dialog-focus";

type AuctionResultControlsProps = {
    exactItemNames: string[];
    filters: AuctionResultFilters;
    onApply: (filters: AuctionResultFilters) => void;
    onClear: () => void;
};

function readUnitPrice(input: HTMLInputElement) {
    const raw = input.value.trim();
    if (raw === "" && !input.validity.badInput) return undefined;
    const value = Number(raw);
    return input.validity.badInput ||
        !/^\d+$/.test(raw) ||
        !Number.isSafeInteger(value) ||
        value <= 0
        ? null
        : value;
}

function parseFilters(
    form: HTMLFormElement,
    exactItemNames: string[]
): { filters: AuctionResultFilters } | { error: string } {
    const data = new FormData(form);
    const rawItemName = data.get("exactItemName");
    const exactItemName = typeof rawItemName === "string" ? rawItemName : "";
    const minUnitPrice = readUnitPrice(
        form.elements.namedItem("minUnitPrice") as HTMLInputElement
    );
    const maxUnitPrice = readUnitPrice(
        form.elements.namedItem("maxUnitPrice") as HTMLInputElement
    );

    if (exactItemName && !exactItemNames.includes(exactItemName)) {
        return { error: "선택한 아이템을 현재 결과에서 찾을 수 없습니다." };
    }
    if (minUnitPrice === null || maxUnitPrice === null) {
        return { error: "단가는 1 이상의 정수로 입력해주세요." };
    }
    if (
        minUnitPrice !== undefined &&
        maxUnitPrice !== undefined &&
        minUnitPrice > maxUnitPrice
    ) {
        return { error: "최소 단가는 최대 단가보다 클 수 없습니다." };
    }
    return {
        filters: {
            ...(exactItemName && { exactItemName }),
            ...(minUnitPrice !== undefined && { minUnitPrice }),
            ...(maxUnitPrice !== undefined && { maxUnitPrice }),
        },
    };
}

function activeFilterCount(filters: AuctionResultFilters) {
    return (
        Number(Boolean(filters.exactItemName)) +
        Number(
            filters.minUnitPrice !== undefined ||
                filters.maxUnitPrice !== undefined
        )
    );
}

export function AuctionResultControls({
    exactItemNames,
    filters,
    onApply,
    onClear,
}: AuctionResultControlsProps): React.JSX.Element {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const activeCount = activeFilterCount(filters);

    return (
        <div className="relative flex items-center gap-2">
            <ResultFilterButtons
                activeCount={activeCount}
                open={open}
                onOpen={() => setOpen(true)}
                onClear={onClear}
                triggerRef={triggerRef}
            />
            {open && (
                <ResultFilterDialog
                    exactItemNames={exactItemNames}
                    filters={filters}
                    onApply={onApply}
                    onClose={() => setOpen(false)}
                    triggerRef={triggerRef}
                />
            )}
        </div>
    );
}

type ResultFilterDialogProps = Pick<
    AuctionResultControlsProps,
    "exactItemNames" | "filters" | "onApply"
> & {
    onClose: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
};

function ResultFilterButtons({
    activeCount,
    open,
    onOpen,
    onClear,
    triggerRef,
}: {
    activeCount: number;
    open: boolean;
    onOpen: () => void;
    onClear: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                className="btn btn-outline btn-sm min-h-11"
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label={
                    activeCount > 0
                        ? `결과 필터, ${activeCount}개 적용`
                        : "결과 필터"
                }
                onClick={onOpen}
            >
                결과 필터
                {activeCount > 0 && (
                    <span className="badge badge-primary badge-sm">
                        {activeCount}
                    </span>
                )}
            </button>
            {activeCount > 0 && (
                <button
                    type="button"
                    className="btn btn-ghost btn-sm min-h-11"
                    aria-label="결과 필터 전체 해제"
                    onClick={onClear}
                >
                    전체 해제
                </button>
            )}
        </>
    );
}

function useMobileDialogScrollLock() {
    useEffect(() => {
        const mediaQuery = window.matchMedia?.("(max-width: 639px)");
        if (!mediaQuery) return;
        const rootStyle = document.documentElement.style;
        const bodyStyle = document.body.style;
        let lock: {
            x: number;
            y: number;
            rootOverflow: string;
            bodyOverflow: string;
        } | null = null;
        let frame: number | null = null;

        const release = () => {
            if (frame !== null) cancelAnimationFrame(frame);
            frame = null;
            if (!lock) return;
            rootStyle.overflow = lock.rootOverflow;
            bodyStyle.overflow = lock.bodyOverflow;
            window.scrollTo(lock.x, lock.y);
            lock = null;
        };
        const update = () => {
            if (!mediaQuery.matches) {
                release();
                return;
            }
            if (lock) return;
            lock = {
                x: window.scrollX,
                y: window.scrollY,
                rootOverflow: rootStyle.overflow,
                bodyOverflow: bodyStyle.overflow,
            };
            frame = requestAnimationFrame(() => {
                frame = null;
                if (!lock) return;
                window.scrollTo(lock.x, lock.y);
                rootStyle.overflow = "hidden";
                bodyStyle.overflow = "hidden";
            });
        };

        update();
        mediaQuery.addEventListener("change", update);
        return () => {
            mediaQuery.removeEventListener("change", update);
            release();
        };
    }, []);
}

function ResultFilterDialog({
    exactItemNames,
    filters,
    onApply,
    onClose,
    triggerRef,
}: ResultFilterDialogProps) {
    const dialogRef = useDialogFocus(onClose, triggerRef, undefined, true);
    useMobileDialogScrollLock();

    return (
        <>
            <button
                type="button"
                aria-label="결과 필터 닫기"
                className="fixed inset-0 z-40 touch-none bg-black/40 sm:bg-transparent"
                onClick={onClose}
            />
            <ResultFilterDialogShell dialogRef={dialogRef} onClose={onClose}>
                <ResultFilterForm
                    exactItemNames={exactItemNames}
                    filters={filters}
                    onApply={onApply}
                    onClose={onClose}
                />
            </ResultFilterDialogShell>
        </>
    );
}

function ResultFilterDialogShell({
    children,
    dialogRef,
    onClose,
}: {
    children: React.ReactNode;
    dialogRef: React.RefObject<HTMLDivElement | null>;
    onClose: () => void;
}) {
    return (
        <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auction-result-filter-title"
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto overscroll-contain rounded-t-2xl border bg-base-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl outline-none sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+0.5rem)] sm:max-h-[70vh] sm:w-80 sm:rounded-lg sm:pb-4"
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h4 id="auction-result-filter-title" className="font-bold">
                        결과 필터
                    </h4>
                    <p className="text-sm text-base-content/70">
                        불러온 매물 안에서만 결과를 좁힙니다.
                    </p>
                </div>
                <button
                    type="button"
                    className="btn btn-ghost btn-sm min-h-11"
                    onClick={onClose}
                >
                    닫기
                </button>
            </div>
            {children}
        </div>
    );
}

function ResultFilterForm({
    exactItemNames,
    filters,
    onApply,
    onClose,
}: Omit<ResultFilterDialogProps, "triggerRef">) {
    const [error, setError] = useState<string | null>(null);
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const parsed = parseFilters(event.currentTarget, exactItemNames);
        if ("error" in parsed) {
            setError(parsed.error);
            return;
        }
        onApply(parsed.filters);
        onClose();
    };
    return (
        <form className="mt-4 space-y-4" noValidate onSubmit={handleSubmit}>
            {exactItemNames.length > 1 && (
                <ExactItemField
                    exactItemNames={exactItemNames}
                    defaultValue={filters.exactItemName}
                />
            )}
            <div className="grid grid-cols-2 gap-3">
                <UnitPriceField
                    name="minUnitPrice"
                    label="최소 단가"
                    defaultValue={filters.minUnitPrice}
                    error={error}
                />
                <UnitPriceField
                    name="maxUnitPrice"
                    label="최대 단가"
                    defaultValue={filters.maxUnitPrice}
                    error={error}
                />
            </div>
            <ResultFilterError error={error} />
            <button type="submit" className="btn btn-primary min-h-11 w-full">
                적용
            </button>
        </form>
    );
}

function ResultFilterError({ error }: { error: string | null }) {
    if (!error) return null;
    return (
        <p
            id="auction-result-filter-error"
            role="alert"
            className="text-sm text-error"
        >
            {error}
        </p>
    );
}

function ExactItemField({
    exactItemNames,
    defaultValue,
}: {
    exactItemNames: string[];
    defaultValue?: string;
}) {
    return (
        <label className="form-control gap-1">
            <span className="label-text font-medium">정확한 아이템</span>
            <select
                name="exactItemName"
                className="select select-bordered w-full min-h-11"
                defaultValue={defaultValue ?? ""}
            >
                <option value="">전체 아이템</option>
                {exactItemNames.map(itemName => (
                    <option key={itemName} value={itemName}>
                        {itemName}
                    </option>
                ))}
            </select>
        </label>
    );
}

function UnitPriceField({
    name,
    label,
    defaultValue,
    error,
}: {
    name: "minUnitPrice" | "maxUnitPrice";
    label: string;
    defaultValue?: number;
    error: string | null;
}) {
    return (
        <label className="form-control gap-1">
            <span className="label-text font-medium">{label}</span>
            <input
                name={name}
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                className="input input-bordered w-full min-h-11"
                defaultValue={defaultValue}
                aria-invalid={error ? true : undefined}
                aria-describedby={
                    error ? "auction-result-filter-error" : undefined
                }
            />
        </label>
    );
}
