import { useEffect, useRef, useState } from "react";

import {
    formatTotemValue,
    type Totem,
    totemEffectKeys,
    totemStatLabel,
} from "@/lib/totems";

import s from "./totem-tool.module.css";
import { TotemBadges, TotemIcon } from "./totem-ui";

export function TotemCatalog({
    items,
    selectedId,
    onSelect,
    filterKey,
}: {
    items: Totem[];
    selectedId: number | null;
    onSelect: (item: Totem) => void;
    filterKey: string;
}) {
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
    const pages = Math.max(1, Math.ceil(items.length / pageSize));
    const currentPage = Math.min(page, pages - 1);
    function select(item: Totem) {
        onSelect(item);
        if (pageSize === 8) {
            setOpen(false);
            summary.current?.focus({ preventScroll: true });
        }
    }
    return (
        <details
            className={s.panel}
            open={open}
            onToggle={e => setOpen(e.currentTarget.open)}
        >
            <summary ref={summary}>
                <strong>토템 찾기 · {items.length}개</strong>
            </summary>
            <p className={s.muted}>
                원본 목록입니다. 항목을 선택한 뒤 매물을 조회하세요.
            </p>
            {!items.length && (
                <p>조건에 맞는 토템이 없습니다. 검색·필터를 바꿔 주세요.</p>
            )}
            <ul className={s.catalogList}>
                {items
                    .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
                    .map(item => {
                        const keys = totemEffectKeys(item);
                        const duplicates =
                            items.filter(r => r.name === item.name).length > 1;
                        return (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    className={s.catalogButton}
                                    aria-pressed={selectedId === item.id}
                                    onClick={() => select(item)}
                                >
                                    <span className={s.titleRow}>
                                        <TotemIcon item={item} />
                                        <strong>{item.name}</strong>
                                    </span>
                                    <TotemBadges item={item} />
                                    {duplicates && (
                                        <span className={s.muted}>
                                            동명 변형 ID {item.id}
                                        </span>
                                    )}
                                    <span className={s.muted}>
                                        {keys
                                            .slice(0, 2)
                                            .map(
                                                key =>
                                                    `${totemStatLabel(key)} ${item.ranges[key] ? `${formatTotemValue(key, item.ranges[key].min)}~${formatTotemValue(key, item.ranges[key].max)}` : "범위 미확인"}`
                                            )
                                            .join(" / ")}
                                        {keys.length > 2
                                            ? ` 외 ${keys.length - 2}개 효과`
                                            : ""}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
            </ul>
            {pages > 1 && (
                <div className={s.actions}>
                    <button
                        disabled={currentPage === 0}
                        onClick={() => setPage(currentPage - 1)}
                    >
                        이전 토템
                    </button>
                    <span>
                        {currentPage + 1} / {pages}
                    </span>
                    <button
                        disabled={currentPage + 1 === pages}
                        onClick={() => setPage(currentPage + 1)}
                    >
                        결과 더 보기
                    </button>
                </div>
            )}
        </details>
    );
}
