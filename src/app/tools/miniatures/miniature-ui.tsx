import Image from "next/image";
import Link from "next/link";
import { type ReactElement, useState } from "react";

import { getAuctionSearchPath } from "@/lib/auction-url";
import {
    effectLabel,
    effectValue,
    type Miniature,
    type MiniatureDelta,
} from "@/lib/miniatures";

import type { MiniatureInstallations } from "./miniature-hooks";

export const styles = {
    window: `
        bg-[rgba(49,51,48,0.94)] text-[#f5f5ef] border border-[#858780] shadow-[inset_0_0_0_3px_#292b28]
        p-2 text-sm leading-[1.5] [text-shadow:0_1px_1px_#111] max-lg:pb-[calc(12px+env(safe-area-inset-bottom))]
        [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:font-bold [&_h3]:[overflow-wrap:anywhere]
        [&_p]:my-1.5 [&_label]:block [&_label]:my-1 [&_select]:block [&_input::placeholder]:text-[#c2c5bb]
        [&_input[type=checkbox]]:size-5 [&_input[type=checkbox]]:accent-[#e6d694] [&_a]:underline [&_a]:inline-flex [&_a]:items-center
        [&_a]:min-h-11 [&_summary]:cursor-pointer [&_summary]:min-h-11 [&_summary]:pt-2.5 [&_dl>div]:flex
        [&_dl>div]:justify-between [&_dl>div]:gap-3 [&_dl>div]:border-b [&_dl>div]:border-[#66695e] [&_dl>div]:py-1
        [&_dd]:text-right [&_dd]:text-[#fff0aa] [&_:is(button,select,input:not([type=checkbox]))]:border [&_:is(button,select,input:not([type=checkbox]))]:border-[#a0a29a] [&_:is(button,select,input:not([type=checkbox]))]:rounded-[2px]
        [&_:is(button,select,input:not([type=checkbox]))]:bg-[#62645e] [&_:is(button,select,input:not([type=checkbox]))]:text-white [&_:is(button,select,input:not([type=checkbox]))]:min-h-11 [&_:is(button,select,input:not([type=checkbox]))]:py-1.5 [&_:is(button,select,input:not([type=checkbox]))]:px-2.5
        [&_:is(button,select,input:not([type=checkbox]))]:max-w-full [&_:is(button,select,input:not([type=checkbox]))]:[text-shadow:0_1px_1px_#111] [&_button]:cursor-pointer [&_button]:shadow-[inset_0_0_0_1px_#3b3e37] [&_button[aria-pressed=true]]:bg-[#898b82]
        [&_button[aria-pressed=true]]:shadow-[inset_0_0_0_2px_#deded4] [&_button:hover]:bg-[#74776e] [&_button:disabled]:opacity-60 [&_button:disabled]:cursor-default [&_input:not([type=checkbox])]:block
        [&_input:not([type=checkbox])]:w-full [&_input:not([type=checkbox])]:bg-[#292c27] [&_:is(button,input,select,a,summary,[tabindex]):focus-visible]:outline-3 [&_:is(button,input,select,a,summary,[tabindex]):focus-visible]:outline-[#ffed9c] [&_:is(button,input,select,a,summary,[tabindex]):focus-visible]:outline-offset-2
        max-lg:[&_:is(button,input,summary,a,[tabindex])]:scroll-mb-[100px] max-lg:[&_:is(button,input,summary,a,[tabindex])]:scroll-mt-20
    `,
    panel: "bg-[rgba(83,85,79,0.36)] border border-[#777a71] shadow-[inset_0_0_0_2px_#333630] p-3 mt-2 min-w-0",
    columns: "grid gap-2 lg:grid-cols-2",
    left: "min-w-0",
    controls: "flex flex-wrap gap-2 items-center",
    check: "[&&]:inline-flex gap-2 items-center min-h-11",
    row: "flex gap-2.5 items-center flex-wrap [&>div]:flex-1 [&>div]:min-w-[140px]",
    icon: "inline-flex size-12 shrink-0 items-center justify-center bg-[#34362f] border border-[#a4a596] shadow-[inset_0_0_0_2px_#171a15]",
    baseline:
        "[&&]:border-[#b9bca9] [&&]:bg-[rgba(113,118,103,0.45)] [&&_h2]:text-[21px] [&>details]:inline-block [&>details]:align-top [&>details]:mr-4 [&>details[open]]:block [&>details[open]]:w-full",
    entry: "border border-[#777b6d] p-2.5 mt-2 bg-[#3c4037] min-w-0 data-[selected=true]:border-[#efe5b7] data-[selected=true]:shadow-[inset_0_0_0_1px_#efe5b7]",
    description: "whitespace-pre-line",
    value: "text-[#fff0a2]",
    comparison: "grid gap-2 lg:grid-cols-2",
    catalog: "lg:max-h-[780px] lg:overflow-y-auto lg:p-[3px]",
    installedGrid: "grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2",
    toast: "z-100 bottom-[calc(80px+env(safe-area-inset-bottom))] max-w-[min(440px,100vw)] whitespace-normal [&>div]:bg-[#34382f] [&>div]:text-[#fff0a2] [&>div]:border [&>div]:border-[#b9bca9]",
};

export function Icon({ item }: { item: Miniature }): ReactElement {
    const [failedItemId, setFailedItemId] = useState<number | null>(null);
    return (
        <span className={styles.icon}>
            {failedItemId === item.itemId ? (
                <span aria-label="아이콘 없음">◇</span>
            ) : (
                // Inventory images already use the shared proxy; preserve a fixed-size fallback.
                <Image
                    unoptimized
                    src={`/api/item-image?id=${item.itemId}`}
                    alt=""
                    width={40}
                    height={40}
                    loading="lazy"
                    onError={() => setFailedItemId(item.itemId)}
                />
            )}
        </span>
    );
}
export function Effects({ item }: { item: Miniature }): ReactElement {
    return (
        <details>
            <summary>효과·설명</summary>
            <dl>
                {Object.entries(item.effects).map(([key, value]) => (
                    <div key={key}>
                        <dt>{effectLabel(key)}</dt>
                        <dd>{effectValue(key, value)}</dd>
                    </div>
                ))}
            </dl>
            <p className={styles.description}>{item.description}</p>
            {item.description.includes("세트") && (
                <p>세트 효과는 합계에서 제외합니다.</p>
            )}
        </details>
    );
}
export function Auction({ item }: { item: Miniature }): ReactElement {
    return item.searchable ? (
        <Link prefetch={false} href={getAuctionSearchPath(item.itemName)}>
            경매장 검색
        </Link>
    ) : (
        <span>경매장 검색 미지원</span>
    );
}
export const typeName = (item: Miniature): string =>
    item.extra ? "엑스트라" : "일반";
export function TypeSelect({
    value,
    onChange,
    label,
}: {
    value: string;
    onChange: (s: string) => void;
    label: string;
}): ReactElement {
    return (
        <label>
            {label}
            <select value={value} onChange={e => onChange(e.target.value)}>
                <option value="all">전체</option>
                <option value="normal">일반</option>
                <option value="extra">엑스트라</option>
            </select>
        </label>
    );
}

export function InstallationToggle({
    item,
    installations,
}: {
    item: Miniature;
    installations: MiniatureInstallations;
}): ReactElement {
    return (
        <label className={styles.check}>
            <input
                type="checkbox"
                checked={installations.installed.includes(item.id)}
                disabled={!installations.ready}
                onChange={() => installations.toggle(item)}
                aria-label={`${item.name} 설치 중`}
            />
            설치 중
        </label>
    );
}

export function EffectChange({
    stat,
    change,
}: {
    stat: string;
    change: MiniatureDelta;
}): ReactElement {
    return (
        <>
            {effectValue(stat, change.before.total[stat] ?? 0)} →{" "}
            {effectValue(stat, change.after.total[stat] ?? 0)} (
            {effectValue(stat, change.delta[stat] ?? 0, true)})
        </>
    );
}

export function ItemEffects({
    item,
    changes,
}: {
    item: Miniature;
    changes?: Record<string, number>;
}): ReactElement {
    return (
        <>
            {Object.entries(item.effects).map(([key, value]) => (
                <p key={key}>
                    {effectLabel(key)} {effectValue(key, value)}
                    {changes?.[key] !== undefined && (
                        <span className={styles.value}>
                            {" "}
                            ·{" "}
                            {changes[key] > 0
                                ? `내 설치 대비 ${effectValue(key, changes[key], true)}`
                                : "내 설치 대비 변화 없음"}
                        </span>
                    )}
                </p>
            ))}
        </>
    );
}
