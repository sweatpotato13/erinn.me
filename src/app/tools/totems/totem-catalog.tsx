import { useEffect, useRef, useState } from "react";

import {
    formatTotemValue,
    type Totem,
    totemEffectKeys,
    totemStatLabel,
} from "@/lib/totems";

import s from "./totem-tool.module.css";
import { TotemBadges, TotemIcon } from "./totem-ui";

interface TotemCatalogProps {
    items: Totem[];
    selectedId: number | null;
    onSelect: (item: Totem) => void;
    filterKey: string;
}

function useCatalogDisclosure(filterKey: string) {
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(8);
    const [open, setOpen] = useState(true);
    const summary = useRef<HTMLElement>(null);
    useEffect(() => {
        const media = window.matchMedia("(min-width: 1024px)");
        const update = () => setPageSize(media.matches ? 20 : 8);
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);
    useEffect(() => {
        setPage(0);
        setOpen(true);
    }, [filterKey, pageSize]);
    function collapse() {
        if (pageSize === 8) {
            setOpen(false);
            summary.current?.focus({ preventScroll: true });
        }
    }
    return { page, setPage, pageSize, open, setOpen, summary, collapse };
}

function TotemCatalogEffects({ item }: { item: Totem }) {
    const keys = totemEffectKeys(item);
    return (
        <span className={s.muted}>
            {keys
                .slice(0, 2)
                .map(
                    key =>
                        `${totemStatLabel(key)} ${item.ranges[key] ? `${formatTotemValue(key, item.ranges[key].min)}~${formatTotemValue(key, item.ranges[key].max)}` : "범위 미확인"}`
                )
                .join(" / ")}
            {keys.length > 2 ? ` 외 ${keys.length - 2}개 효과` : ""}
        </span>
    );
}

function TotemCatalogEntry({
    item,
    selected,
    duplicate,
    onSelect,
}: {
    item: Totem;
    selected: boolean;
    duplicate: boolean;
    onSelect: (item: Totem) => void;
}) {
    return (
        <li>
            <button
                type="button"
                className={s.catalogButton}
                aria-pressed={selected}
                onClick={() => onSelect(item)}
            >
                <span className={s.titleRow}>
                    <TotemIcon item={item} />
                    <strong>{item.name}</strong>
                </span>
                <TotemBadges item={item} />
                {duplicate && (
                    <span className={s.muted}>동명 변형 ID {item.id}</span>
                )}
                <TotemCatalogEffects item={item} />
            </button>
        </li>
    );
}

function TotemCatalogPagination({
    page,
    pages,
    onChange,
}: {
    page: number;
    pages: number;
    onChange: (page: number) => void;
}) {
    if (pages <= 1) return null;
    return (
        <div className={s.actions}>
            <button disabled={page === 0} onClick={() => onChange(page - 1)}>
                이전 토템
            </button>
            <span>
                {page + 1} / {pages}
            </span>
            <button
                disabled={page + 1 === pages}
                onClick={() => onChange(page + 1)}
            >
                다음 토템
            </button>
        </div>
    );
}

function TotemCatalogList({
    items,
    selectedId,
    onSelect,
    page,
    pageSize,
}: Omit<TotemCatalogProps, "filterKey"> & { page: number; pageSize: number }) {
    return (
        <ul className={s.catalogList}>
            {items.slice(page * pageSize, (page + 1) * pageSize).map(item => (
                <TotemCatalogEntry
                    key={item.id}
                    item={item}
                    selected={selectedId === item.id}
                    duplicate={
                        items.filter(r => r.name === item.name).length > 1
                    }
                    onSelect={onSelect}
                />
            ))}
        </ul>
    );
}

export function TotemCatalog({
    items,
    selectedId,
    onSelect,
    filterKey,
}: TotemCatalogProps) {
    const state = useCatalogDisclosure(filterKey);
    const pages = Math.max(1, Math.ceil(items.length / state.pageSize));
    const currentPage = Math.min(state.page, pages - 1);
    function select(item: Totem) {
        onSelect(item);
        state.collapse();
    }
    return (
        <details
            className={s.panel}
            open={state.open}
            onToggle={e => state.setOpen(e.currentTarget.open)}
        >
            <summary ref={state.summary}>
                <strong>토템 찾기 · {items.length}개</strong>
            </summary>
            <p className={s.muted}>
                원본 목록입니다. 항목을 선택한 뒤 매물을 조회하세요.
            </p>
            {!items.length && (
                <p>조건에 맞는 토템이 없습니다. 검색·필터를 바꿔 주세요.</p>
            )}
            <TotemCatalogList
                items={items}
                selectedId={selectedId}
                onSelect={select}
                page={currentPage}
                pageSize={state.pageSize}
            />
            <TotemCatalogPagination
                page={currentPage}
                pages={pages}
                onChange={state.setPage}
            />
        </details>
    );
}
