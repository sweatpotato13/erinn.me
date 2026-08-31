"use client";

import type { RefObject } from "react";
import { useState } from "react";

import { describeAuctionOptionFilters } from "@/app/auction/auction-option-controls";
import {
    type AuctionPreset,
    prepareAuctionPresetSearch,
    type PresetOperationResult,
    type useAuctionPresets,
} from "@/app/auction/use-auction-presets";
import type { AuctionUrlSearch } from "@/app/auction/use-auction-url-state";
import { useDialogFocus } from "@/app/auction/use-dialog-focus";

type Presets = ReturnType<typeof useAuctionPresets>;

export function AuctionPresetToolbar({
    onShow,
    triggerRef,
}: {
    onShow: () => void;
    triggerRef?: RefObject<HTMLButtonElement | null>;
}) {
    return (
        <button
            ref={triggerRef}
            type="button"
            className="btn btn-outline w-auto min-w-[50px]"
            onClick={onShow}
        >
            검색 프리셋
        </button>
    );
}

function SearchSummary({ search }: { search: AuctionUrlSearch }) {
    const filters = describeAuctionOptionFilters(search.optionFilters);
    return (
        <dl className="mt-2 text-sm">
            <div>
                <dt className="inline font-semibold">아이템: </dt>
                <dd className="inline">{search.itemName || "전체"}</dd>
            </div>
            <div>
                <dt className="inline font-semibold">카테고리: </dt>
                <dd className="inline">{search.category}</dd>
            </div>
            <div>
                <dt className="inline font-semibold">장비 옵션: </dt>
                <dd className="inline">
                    {filters.map(filter => filter.label).join(", ") || "없음"}
                </dd>
            </div>
        </dl>
    );
}

function PresetFeedback({
    feedback,
}: {
    feedback: PresetOperationResult | null;
}) {
    if (!feedback) return null;
    return (
        <p
            role={feedback.kind === "error" ? "alert" : "status"}
            className={`alert mt-2 ${
                feedback.kind === "error"
                    ? "alert-error"
                    : feedback.kind === "success"
                      ? "alert-success"
                      : "alert-warning"
            }`}
        >
            {feedback.message}
        </p>
    );
}

function SavePresetForm({
    activeSearch,
    presets,
    onFeedback,
}: {
    activeSearch: AuctionUrlSearch | null;
    presets: Presets;
    onFeedback: (result: PresetOperationResult) => void;
}) {
    const [name, setName] = useState("");
    return (
        <section aria-labelledby="save-auction-preset-title" className="mt-4">
            <h3 id="save-auction-preset-title" className="font-semibold">
                현재 검색 저장
            </h3>
            {activeSearch ? (
                <SearchSummary search={activeSearch} />
            ) : (
                <p className="mt-2 text-sm">
                    먼저 저장할 경매 검색을 실행해주세요.
                </p>
            )}
            <form
                className="mt-2 flex flex-col gap-2 sm:flex-row"
                onSubmit={event => {
                    event.preventDefault();
                    const result = presets.add(name, activeSearch);
                    onFeedback(result);
                    if (result.success) setName("");
                }}
            >
                <label className="form-control grow">
                    <span className="label-text mb-1">프리셋 이름</span>
                    <input
                        type="text"
                        className="input input-bordered w-full"
                        value={name}
                        maxLength={50}
                        onChange={event => setName(event.target.value)}
                    />
                </label>
                <button
                    type="submit"
                    className="btn btn-outline self-end"
                    disabled={!activeSearch}
                >
                    저장
                </button>
            </form>
        </section>
    );
}

type PendingPreset = ReturnType<typeof prepareAuctionPresetSearch> & {
    name: string;
};

function RecoveryPreview({
    pending,
    onConfirm,
    onCancel,
}: {
    pending: PendingPreset;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <section className="alert alert-warning mt-4 block" role="alert">
            <h3 className="font-semibold">지원되지 않는 조건 확인</h3>
            <p className="mt-1">
                {pending.name} 프리셋의 일부 조건은 더 이상 지원되지 않아
                적용하지 않습니다.
            </p>
            <ul className="mt-2 list-disc pl-5">
                {pending.unsupportedConditions.map(condition => (
                    <li key={condition}>{condition}</li>
                ))}
            </ul>
            <SearchSummary search={pending.search} />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                    type="button"
                    className="btn btn-outline"
                    onClick={onConfirm}
                >
                    지원되는 조건으로 검색
                </button>
                <button type="button" className="btn" onClick={onCancel}>
                    취소
                </button>
            </div>
        </section>
    );
}

function RenamePresetForm({
    preset,
    presets,
    onDone,
    onFeedback,
}: {
    preset: AuctionPreset;
    presets: Presets;
    onDone: () => void;
    onFeedback: (result: PresetOperationResult) => void;
}) {
    const [name, setName] = useState(preset.name);
    return (
        <form
            className="mt-2 flex flex-col gap-2 sm:flex-row"
            onSubmit={event => {
                event.preventDefault();
                const result = presets.rename(preset.name, name);
                onFeedback(result);
                if (result.success) onDone();
            }}
        >
            <label className="form-control grow">
                <span className="sr-only">{preset.name} 새 이름</span>
                <input
                    autoFocus
                    type="text"
                    className="input input-bordered w-full"
                    aria-label={`${preset.name} 새 이름`}
                    value={name}
                    maxLength={50}
                    onChange={event => setName(event.target.value)}
                />
            </label>
            <button type="submit" className="btn btn-outline">
                확인
            </button>
            <button type="button" className="btn" onClick={onDone}>
                취소
            </button>
        </form>
    );
}

function PresetList({
    presets,
    onLoad,
    onFeedback,
}: {
    presets: Presets;
    onLoad: (prepared: PendingPreset) => void;
    onFeedback: (result: PresetOperationResult) => void;
}) {
    const [editingName, setEditingName] = useState<string | null>(null);
    if (presets.presets.length === 0) {
        return <p className="mt-2">저장된 검색 프리셋이 없습니다.</p>;
    }
    return (
        <ul className="mt-2 space-y-3">
            {presets.presets.map(preset => {
                const prepared = prepareAuctionPresetSearch(preset);
                return (
                    <li key={preset.name} className="rounded-md border p-3">
                        <h4 className="font-semibold">{preset.name}</h4>
                        <SearchSummary search={prepared.search} />
                        {prepared.unsupportedConditions.length > 0 && (
                            <p className="mt-1 text-sm text-warning">
                                일부 저장 조건을 확인해야 합니다.
                            </p>
                        )}
                        {editingName === preset.name ? (
                            <RenamePresetForm
                                preset={preset}
                                presets={presets}
                                onDone={() => setEditingName(null)}
                                onFeedback={onFeedback}
                            />
                        ) : (
                            <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() =>
                                        onLoad({
                                            name: preset.name,
                                            ...prepared,
                                        })
                                    }
                                >
                                    불러오기
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setEditingName(preset.name)}
                                >
                                    이름 변경
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm text-error"
                                    onClick={() =>
                                        onFeedback(presets.remove(preset.name))
                                    }
                                >
                                    삭제
                                </button>
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

export function AuctionPresetsDialog({
    activeSearch,
    presets,
    onLoad,
    onClose,
    triggerRef,
}: {
    activeSearch: AuctionUrlSearch | null;
    presets: Presets;
    onLoad: (search: AuctionUrlSearch) => void;
    onClose: () => void;
    triggerRef?: RefObject<HTMLElement | null>;
}) {
    const dialogRef = useDialogFocus(onClose, triggerRef);
    const [feedback, setFeedback] = useState<PresetOperationResult | null>(
        null
    );
    const [pending, setPending] = useState<PendingPreset | null>(null);
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="auction-presets-dialog-title"
                tabIndex={-1}
                className="bg-white border p-4 rounded-lg shadow-lg w-[min(90vw,40rem)] max-h-[90vh] overflow-y-auto outline-none"
            >
                <h2
                    id="auction-presets-dialog-title"
                    className="text-lg font-bold"
                >
                    검색 프리셋
                </h2>
                <p className="mt-2 text-sm">
                    프리셋은 현재 브라우저와 기기에만 저장되며 다른 기기와
                    동기화되지 않습니다.
                </p>
                {presets.storageWarning && (
                    <p role="status" className="alert alert-warning mt-2">
                        {presets.storageWarning}
                    </p>
                )}
                <SavePresetForm
                    activeSearch={activeSearch}
                    presets={presets}
                    onFeedback={setFeedback}
                />
                <PresetFeedback feedback={feedback} />
                {pending && (
                    <RecoveryPreview
                        pending={pending}
                        onConfirm={() => onLoad(pending.search)}
                        onCancel={() => setPending(null)}
                    />
                )}
                <section
                    aria-labelledby="saved-auction-presets-title"
                    className="mt-4"
                >
                    <h3
                        id="saved-auction-presets-title"
                        className="font-semibold"
                    >
                        저장된 프리셋 ({presets.presets.length}/20)
                    </h3>
                    <PresetList
                        presets={presets}
                        onLoad={prepared => {
                            if (prepared.unsupportedConditions.length > 0) {
                                setPending(prepared);
                                setFeedback(null);
                            } else onLoad(prepared.search);
                        }}
                        onFeedback={setFeedback}
                    />
                </section>
                <button
                    type="button"
                    className="btn btn-outline mt-4 w-full"
                    onClick={onClose}
                >
                    닫기
                </button>
            </div>
        </div>
    );
}
