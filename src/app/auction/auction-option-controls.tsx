"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
    auctionFilterReference,
    echostoneSuggestions,
    enchantSuggestions,
    reforgeSuggestions,
} from "@/lib/auction-filter-reference";
import {
    type AuctionOptionFilters,
    ECHO_INNATE_STAT_BY_COLOR,
    ECHO_INNATE_STATS,
    hasAuctionOptionFilters,
    parseAuctionOptionFilterQuery,
} from "@/lib/auction-options";
import { muriasReference } from "@/lib/murias-relics";
import { TOTEM_STATS } from "@/lib/totems";

import { AuctionOptionAutocomplete } from "./auction-option-autocomplete";

type Props = {
    formId?: string;
    filters: AuctionOptionFilters;
    onApply: (filters: AuctionOptionFilters) => void;
    onChange: (filters: AuctionOptionFilters) => void;
};
const prefixSuggestions = enchantSuggestions("prefix");
const suffixSuggestions = enchantSuggestions("suffix");

function NumberField({
    label,
    name,
    value,
    min = 1,
    max,
    step = 1,
    onChange,
}: {
    label: string;
    name: string;
    value: string;
    min?: number;
    max?: number;
    step?: number;
    onChange: (value: string) => void;
}) {
    return (
        <label className="form-control min-w-0">
            <span className="label-text mb-1">{label}</span>
            <input
                name={name}
                type="number"
                className="input input-bordered w-full"
                value={value}
                min={min}
                max={max}
                step={step}
                inputMode={step < 1 ? "decimal" : "numeric"}
                onChange={event => onChange(event.target.value)}
            />
        </label>
    );
}

function EnchantFields({ filters }: { filters: AuctionOptionFilters }) {
    const [prefix, setPrefix] = useState(filters.enchantPrefix ?? "");
    const [suffix, setSuffix] = useState(filters.enchantSuffix ?? "");
    return (
        <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 font-semibold">인챈트</legend>
            <AuctionOptionAutocomplete
                label="접두 인챈트"
                name="option_enchant_prefix"
                value={prefix}
                onChange={setPrefix}
                options={prefixSuggestions}
            />
            <AuctionOptionAutocomplete
                label="접미 인챈트"
                name="option_enchant_suffix"
                value={suffix}
                onChange={setSuffix}
                options={suffixSuggestions}
            />
            {filters.enchantName && (
                <label className="form-control sm:col-span-2">
                    <span className="label-text mb-1">
                        인챈트 이름 (위치 무관 · 기존 조건)
                    </span>
                    <input
                        name="option_enchant"
                        className="input input-bordered w-full"
                        defaultValue={filters.enchantName}
                        maxLength={100}
                    />
                </label>
            )}
        </fieldset>
    );
}

function ReforgeFields({ filters }: { filters: AuctionOptionFilters }) {
    const [rows, setRows] = useState(() =>
        (filters.reforges ?? [{ optionName: "", minLevel: undefined }]).map(
            (row, id) => ({
                id,
                name: row.optionName,
                level: String(row.minLevel ?? ""),
            })
        )
    );
    const nextId = useRef(rows.length);
    const addButton = useRef<HTMLButtonElement>(null);
    const previousRowCount = useRef(rows.length);
    useEffect(() => {
        if (rows.length < previousRowCount.current) addButton.current?.focus();
        previousRowCount.current = rows.length;
    }, [rows.length]);
    const change = (id: number, field: "name" | "level", value: string) =>
        setRows(current =>
            current.map(row =>
                row.id === id ? { ...row, [field]: value } : row
            )
        );
    return (
        <fieldset className="space-y-3">
            <legend className="font-semibold">세공 (최대 3개)</legend>
            {rows.map((row, index) => (
                <div
                    key={row.id}
                    className="grid gap-2 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto]"
                >
                    <AuctionOptionAutocomplete
                        label={`세공 ${index + 1} 옵션 이름`}
                        name={`option_reforge_${index + 1}`}
                        value={row.name}
                        onChange={value => change(row.id, "name", value)}
                        options={reforgeSuggestions}
                    />
                    <NumberField
                        label={`세공 ${index + 1} 최소 레벨`}
                        name={`option_reforge_${index + 1}_min_level`}
                        value={row.level}
                        onChange={value => change(row.id, "level", value)}
                    />
                    <button
                        type="button"
                        className="btn btn-ghost self-end"
                        aria-label={`세공 ${index + 1} 입력 제거`}
                        onClick={() => {
                            setRows(current =>
                                current.filter(entry => entry.id !== row.id)
                            );
                        }}
                    >
                        제거
                    </button>
                </div>
            ))}
            <button
                ref={addButton}
                type="button"
                className="btn btn-outline btn-sm"
                disabled={rows.length >= 3}
                onClick={() => {
                    const id = nextId.current++;
                    setRows(current => [
                        ...current,
                        { id, name: "", level: "" },
                    ]);
                }}
            >
                세공 조건 추가
            </button>
        </fieldset>
    );
}

function ErgFields({ filters }: { filters: AuctionOptionFilters }) {
    const [enabled, setEnabled] = useState(Boolean(filters.erg));
    return (
        <fieldset className="space-y-2">
            <legend className="font-semibold">에르그</legend>
            <label className="label w-fit cursor-pointer gap-2">
                <input
                    type="checkbox"
                    name="option_erg"
                    value="present"
                    className="checkbox"
                    checked={enabled}
                    onChange={event => setEnabled(event.target.checked)}
                />
                <span className="label-text">에르그 있음</span>
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
                <label className="form-control">
                    <span className="label-text mb-1">에르그 등급</span>
                    <select
                        name="option_erg_grade"
                        className="select select-bordered w-full"
                        defaultValue={filters.erg?.grade ?? ""}
                        disabled={!enabled}
                    >
                        <option value="">등급 무관</option>
                        {["B", "A", "S"].map(grade => (
                            <option key={grade}>{grade}</option>
                        ))}
                    </select>
                </label>
                <label className="form-control">
                    <span className="label-text mb-1">에르그 최소 레벨</span>
                    <input
                        type="number"
                        name="option_erg_min_level"
                        className="input input-bordered w-full"
                        defaultValue={filters.erg?.minLevel ?? ""}
                        disabled={!enabled}
                        min={1}
                        step={1}
                        inputMode="numeric"
                    />
                </label>
            </div>
        </fieldset>
    );
}

function EchoFields({ filters }: { filters: AuctionOptionFilters }) {
    const echo = filters.echostone;
    const [color, setColor] = useState(String(echo?.color ?? ""));
    const [grade, setGrade] = useState(String(echo?.minGrade ?? ""));
    const [awakening, setAwakening] = useState(
        echo?.awakening?.optionName ?? ""
    );
    const [level, setLevel] = useState(String(echo?.awakening?.minLevel ?? ""));
    const [stat, setStat] = useState(
        echo?.innate
            ? echo.color
                ? ECHO_INNATE_STAT_BY_COLOR[echo.color]
                : echo.innate.stat
            : ""
    );
    const [value, setValue] = useState(String(echo?.innate?.minValue ?? ""));
    const options = useMemo(
        () => echostoneSuggestions(color ? Number(color) : undefined),
        [color]
    );
    return (
        <div className="space-y-3">
            <p className="text-sm">
                조건 적용 시 선택한 에코스톤 이름으로 검색합니다. 종류 무관이면
                에코스톤 카테고리를 검색합니다. 각성하지 않은 매물도
                종류·등급·고유 능력으로 검색할 수 있습니다.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="form-control">
                    <span className="label-text mb-1">에코스톤 종류</span>
                    <select
                        name="option_echo_color"
                        className="select select-bordered w-full"
                        value={color}
                        onChange={event => {
                            const nextColor = event.target.value;
                            setColor(nextColor);
                            if (nextColor && stat)
                                setStat(
                                    ECHO_INNATE_STAT_BY_COLOR[Number(nextColor)]
                                );
                        }}
                    >
                        <option value="">종류 무관</option>
                        {auctionFilterReference.echostones.map(row => (
                            <option key={row.id} value={row.id}>
                                {row.name}
                            </option>
                        ))}
                    </select>
                </label>
                <NumberField
                    label="에코스톤 최소 등급"
                    name="option_echo_min_grade"
                    value={grade}
                    max={30}
                    onChange={setGrade}
                />
                <AuctionOptionAutocomplete
                    suggestOnEmpty
                    label="에코스톤 각성 옵션"
                    name="option_echo_awakening"
                    value={awakening}
                    onChange={setAwakening}
                    options={options}
                />
                <NumberField
                    label="에코스톤 각성 최소 레벨"
                    name="option_echo_awakening_min_level"
                    value={level}
                    onChange={setLevel}
                />
                <label className="form-control">
                    <span className="label-text mb-1">에코스톤 고유 능력</span>
                    <select
                        name="option_echo_stat"
                        className="select select-bordered w-full"
                        value={stat}
                        onChange={event => setStat(event.target.value)}
                    >
                        <option value="">선택 안 함</option>
                        {Object.entries(ECHO_INNATE_STATS)
                            .filter(
                                ([key]) =>
                                    !color ||
                                    key ===
                                        ECHO_INNATE_STAT_BY_COLOR[Number(color)]
                            )
                            .map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                    </select>
                </label>
                <NumberField
                    label="에코스톤 고유 능력 최소 수치"
                    name="option_echo_min_value"
                    value={value}
                    min={0}
                    onChange={setValue}
                />
            </div>
            {color &&
                awakening &&
                !options.some(option => option.value === awakening) && (
                    <p role="status" className="text-sm">
                        이 종류의 제안 목록에 없는 각성 옵션입니다. 입력한
                        이름은 유지되며 정확히 일치하는 매물만 검색합니다.
                    </p>
                )}
        </div>
    );
}

function MuriasFields({ filters }: { filters: AuctionOptionFilters }) {
    const [effectId, setEffectId] = useState(
        String(filters.murias?.effectId ?? "")
    );
    const [level, setLevel] = useState(String(filters.murias?.minLevel ?? ""));
    const effect = muriasReference.effects.find(
        row => String(row.id) === effectId
    );
    return (
        <div className="space-y-3">
            <p className="text-sm">
                조건 적용 시 무리아스의 유물 이름으로 검색합니다. 인챈트 조건과
                함께 검색할 수 있습니다.
            </p>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
                <label className="form-control min-w-0">
                    <span className="label-text mb-1">유물 효과</span>
                    <select
                        name="option_murias_effect"
                        className="select select-bordered w-full"
                        value={effectId}
                        onChange={event => setEffectId(event.target.value)}
                    >
                        <option value="">선택 안 함</option>
                        {[
                            ...new Set(
                                muriasReference.effects.map(row => row.arcana)
                            ),
                        ].map(arcana => (
                            <optgroup key={arcana} label={arcana}>
                                {muriasReference.effects
                                    .filter(row => row.arcana === arcana)
                                    .map(row => (
                                        <option key={row.id} value={row.id}>
                                            {row.template.replace("{0}", "N")}
                                        </option>
                                    ))}
                            </optgroup>
                        ))}
                    </select>
                </label>
                <NumberField
                    label="유물 최소 레벨"
                    name="option_murias_min_level"
                    value={level}
                    max={10}
                    onChange={setLevel}
                />
            </div>
            {effect && (
                <p className="break-words text-sm">
                    {effect.arcana} · {effect.template.replace("{0}", "N")}
                </p>
            )}
        </div>
    );
}

function TotemFields({ filters }: { filters: AuctionOptionFilters }) {
    const [rows, setRows] = useState(() =>
        (Object.entries(filters.totem ?? {}).length
            ? Object.entries(filters.totem!)
            : [["", ""]]
        ).map(([stat, value], id) => ({
            id,
            stat: String(stat),
            value: String(value),
        }))
    );
    const nextId = useRef(rows.length),
        addButton = useRef<HTMLButtonElement>(null);
    const previousRowCount = useRef(rows.length);
    useEffect(() => {
        if (rows.length < previousRowCount.current) addButton.current?.focus();
        previousRowCount.current = rows.length;
    }, [rows.length]);
    const change = (id: number, field: "stat" | "value", value: string) =>
        setRows(current =>
            current.map(row =>
                row.id === id ? { ...row, [field]: value } : row
            )
        );
    return (
        <fieldset className="space-y-3">
            <legend className="sr-only">토템 능력치 조건</legend>
            <p className="text-sm">
                조건 적용 시 토템 카테고리에서 검색합니다. 선택한 모든 능력치의
                실제 수치가 최소값 이상이어야 합니다.
            </p>
            {rows.map((row, index) => {
                const meta = Object.hasOwn(TOTEM_STATS, row.stat)
                    ? TOTEM_STATS[row.stat]
                    : undefined;
                return (
                    <div
                        key={row.id}
                        className="grid gap-2 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto]"
                    >
                        <label className="form-control min-w-0">
                            <span className="label-text mb-1">
                                토템 {index + 1} 능력치
                            </span>
                            <select
                                data-totem-stat={row.id}
                                className="select select-bordered w-full"
                                value={row.stat}
                                onChange={event =>
                                    change(row.id, "stat", event.target.value)
                                }
                            >
                                <option value="">선택 안 함</option>
                                {Object.entries(TOTEM_STATS).map(
                                    ([key, stat]) => (
                                        <option key={key} value={key}>
                                            {stat.label}
                                        </option>
                                    )
                                )}
                            </select>
                        </label>
                        <NumberField
                            label={`토템 ${index + 1} 최소 수치${meta?.unit ? ` (${meta.unit})` : ""}`}
                            name={`totem_value_${row.id}`}
                            value={row.value}
                            min={0}
                            max={1_000_000}
                            step={10 ** -(meta?.precision ?? 0)}
                            onChange={value => change(row.id, "value", value)}
                        />
                        <button
                            type="button"
                            className="btn btn-ghost self-end"
                            aria-label={`토템 ${index + 1} 입력 제거`}
                            onClick={() => {
                                setRows(current =>
                                    current.filter(entry => entry.id !== row.id)
                                );
                            }}
                        >
                            제거
                        </button>
                    </div>
                );
            })}
            <button
                ref={addButton}
                type="button"
                className="btn btn-outline btn-sm"
                disabled={rows.length >= Object.keys(TOTEM_STATS).length}
                onClick={() => {
                    const id = nextId.current++;
                    setRows(current => [
                        ...current,
                        { id, stat: "", value: "" },
                    ]);
                }}
            >
                토템 조건 추가
            </button>
        </fieldset>
    );
}

function parseFilterForm(form: HTMLFormElement) {
    if (
        Array.from(form.elements).some(
            element =>
                element instanceof HTMLInputElement && element.validity.badInput
        )
    )
        return { success: false as const, error: "숫자 입력을 확인해주세요." };
    const data = new FormData(form),
        params = new URLSearchParams();
    for (const [key, value] of data)
        if (
            key.startsWith("option_") &&
            typeof value === "string" &&
            value !== ""
        )
            params.append(key, value);
    // Blank display rows are not conditions. Compact complete/nonempty rows before validation.
    let rowIndex = 0;
    for (let index = 1; index <= 3; index++) {
        const nameKey = `option_reforge_${index}`,
            levelKey = `${nameKey}_min_level`;
        const name = data.get(nameKey),
            level = data.get(levelKey);
        params.delete(nameKey);
        params.delete(levelKey);
        if (!name && !level) continue;
        rowIndex++;
        if (typeof name === "string" && name !== "")
            params.append(`option_reforge_${rowIndex}`, name);
        if (typeof level === "string" && level !== "")
            params.append(`option_reforge_${rowIndex}_min_level`, level);
    }
    for (const select of form.querySelectorAll<HTMLSelectElement>(
        "[data-totem-stat]"
    )) {
        const value = data.get(`totem_value_${select.dataset.totemStat}`);
        if (!select.value && !value) continue;
        if (!select.value || typeof value !== "string" || value === "")
            return {
                success: false as const,
                error: "토템 능력치와 최소 수치를 함께 입력해주세요.",
            };
        params.append(`option_totem_${select.value}`, value);
    }
    return parseAuctionOptionFilterQuery(params);
}

function OptionFilterForm({
    formId,
    filters,
    onSubmit,
}: {
    filters: AuctionOptionFilters;
    onSubmit: (form: HTMLFormElement) => void;
    formId?: string;
}) {
    return (
        <form
            id={formId}
            className="space-y-3 border-t p-3 sm:p-4"
            noValidate
            onSubmit={event => {
                event.preventDefault();
                onSubmit(event.currentTarget);
            }}
        >
            <p className="text-sm">
                아이템명 또는 카테고리를 선택한 뒤 조건을 적용해주세요.
                유물·에코스톤·토템 조건은 검색 대상을 자동으로 지정합니다. 모든
                활성 조건을 만족하는 현재 매물만 검색합니다.
            </p>
            <details open className="rounded-md border">
                <summary className="cursor-pointer p-3 font-semibold">
                    장비 · 인챈트·세공·에르그
                </summary>
                <div className="space-y-4 p-3 pt-0">
                    <EnchantFields filters={filters} />
                    <ReforgeFields filters={filters} />
                    <ErgFields filters={filters} />
                </div>
            </details>
            <details
                open={Boolean(filters.echostone)}
                className="rounded-md border"
            >
                <summary className="cursor-pointer p-3 font-semibold">
                    에코스톤
                </summary>
                <div className="p-3 pt-0">
                    <EchoFields filters={filters} />
                </div>
            </details>
            <details
                open={Boolean(filters.murias)}
                className="rounded-md border"
            >
                <summary className="cursor-pointer p-3 font-semibold">
                    무리아스의 유물
                </summary>
                <div className="p-3 pt-0">
                    <MuriasFields filters={filters} />
                </div>
            </details>
            <details
                open={Boolean(filters.totem)}
                className="rounded-md border"
            >
                <summary className="cursor-pointer p-3 font-semibold">
                    토템
                </summary>
                <div className="p-3 pt-0">
                    <TotemFields filters={filters} />
                </div>
            </details>
            <button type="submit" className="btn btn-outline w-full">
                조건 적용
            </button>
        </form>
    );
}

type FilterDescription = {
    id: string;
    label: string;
    key: keyof AuctionOptionFilters;
    index?: number;
    part?: string;
};
export function describeAuctionOptionFilters(
    filters: AuctionOptionFilters
): FilterDescription[] {
    const values: FilterDescription[] = [];
    if (filters.enchantName)
        values.push({
            id: "enchantName",
            key: "enchantName",
            label: `인챈트 (위치 무관): ${filters.enchantName}`,
        });
    if (filters.enchantPrefix)
        values.push({
            id: "enchantPrefix",
            key: "enchantPrefix",
            label: `접두 인챈트: ${filters.enchantPrefix}`,
        });
    if (filters.enchantSuffix)
        values.push({
            id: "enchantSuffix",
            key: "enchantSuffix",
            label: `접미 인챈트: ${filters.enchantSuffix}`,
        });
    filters.reforges?.forEach((row, index) =>
        values.push({
            id: `reforges:${index}`,
            key: "reforges",
            index,
            label: `세공: ${row.optionName} ${row.minLevel}레벨 이상`,
        })
    );
    if (filters.erg)
        values.push({
            id: "erg",
            key: "erg",
            label: `에르그: ${["있음", filters.erg.grade && `${filters.erg.grade}등급`, filters.erg.minLevel && `${filters.erg.minLevel}레벨 이상`].filter(Boolean).join(", ")}`,
        });
    const echo = filters.echostone;
    if (echo?.color !== undefined)
        values.push({
            id: "echostone:color",
            key: "echostone",
            part: "color",
            label: `에코스톤 종류: ${auctionFilterReference.echostones.find(row => row.id === echo.color)?.name ?? echo.color}`,
        });
    if (echo?.minGrade !== undefined)
        values.push({
            id: "echostone:minGrade",
            key: "echostone",
            part: "minGrade",
            label: `에코스톤: ${echo.minGrade}등급 이상`,
        });
    if (echo?.awakening)
        values.push({
            id: "echostone:awakening",
            key: "echostone",
            part: "awakening",
            label: `각성: ${echo.awakening.optionName} ${echo.awakening.minLevel}레벨 이상`,
        });
    if (echo?.innate)
        values.push({
            id: "echostone:innate",
            key: "echostone",
            part: "innate",
            label: `고유 능력: ${ECHO_INNATE_STATS[echo.innate.stat]} ${echo.innate.minValue} 이상`,
        });
    if (filters.murias)
        values.push({
            id: "murias",
            key: "murias",
            label: `유물: ${muriasReference.effects.find(row => row.id === filters.murias!.effectId)?.template.replace("{0}", "N") ?? filters.murias.effectId} · ${filters.murias.minLevel}레벨 이상`,
        });
    for (const [stat, value] of Object.entries(filters.totem ?? {}))
        values.push({
            id: `totem:${stat}`,
            key: "totem",
            part: stat,
            label: `토템: ${TOTEM_STATS[stat].label} ${value}${TOTEM_STATS[stat].unit} 이상`,
        });
    return values;
}

export function removeAuctionOptionFilter(
    filters: AuctionOptionFilters,
    filter: FilterDescription
): AuctionOptionFilters {
    const next = { ...filters };
    if (filter.key === "reforges") {
        next.reforges = filters.reforges?.filter(
            (_, index) => index !== filter.index
        );
        if (!next.reforges?.length) delete next.reforges;
    } else if (filter.key === "echostone") {
        next.echostone = { ...filters.echostone };
        delete next.echostone[
            filter.part as keyof NonNullable<AuctionOptionFilters["echostone"]>
        ];
        if (!Object.values(next.echostone).some(value => value !== undefined))
            delete next.echostone;
    } else if (filter.key === "totem") {
        next.totem = { ...filters.totem };
        delete next.totem[filter.part!];
        if (!Object.keys(next.totem).length) delete next.totem;
    } else delete next[filter.key];
    return next;
}

export function AuctionOptionControls({
    formId,
    filters,
    onApply,
    onChange,
}: Props) {
    const filterKey = JSON.stringify(filters);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => setError(null), [filterKey]);
    const values = describeAuctionOptionFilters(filters);
    return (
        <div className="mt-2">
            <details className="rounded-md border bg-base-100">
                <summary className="cursor-pointer p-3 font-semibold">
                    검색 필터{values.length > 0 && ` (${values.length})`}
                </summary>
                <OptionFilterForm
                    formId={formId}
                    key={filterKey}
                    filters={filters}
                    onSubmit={form => {
                        const parsed = parseFilterForm(form);
                        if (!parsed.success) {
                            setError(parsed.error);
                            return;
                        }
                        setError(null);
                        onApply(parsed.filters ?? {});
                    }}
                />
            </details>
            {error && (
                <div
                    role="alert"
                    className="alert alert-error fixed top-4 right-4 z-50 w-auto max-w-[calc(100vw-2rem)] shadow-lg"
                >
                    <span>{error}</span>
                    <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        aria-label="오류 알림 닫기"
                        onClick={() => setError(null)}
                    >
                        닫기
                    </button>
                </div>
            )}
            {hasAuctionOptionFilters(filters) && (
                <section
                    aria-label="활성 검색 필터 조건"
                    className="mt-2 rounded-md border bg-base-100 p-3"
                >
                    <p className="text-sm">
                        모든 활성 조건을 만족하는 현재 등록 매물만 표시합니다.
                        최근 완료 거래에는 적용되지 않습니다.
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                        {values.map(filter => (
                            <li
                                key={filter.id}
                                className="inline-flex max-w-full items-center gap-1 rounded-md border px-3 py-1 text-sm"
                            >
                                <span className="break-words">
                                    {filter.label}
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs shrink-0"
                                    aria-label={`${filter.label} 조건 제거`}
                                    onClick={() =>
                                        onChange(
                                            removeAuctionOptionFilter(
                                                filters,
                                                filter
                                            )
                                        )
                                    }
                                >
                                    제거
                                </button>
                            </li>
                        ))}
                    </ul>
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm mt-2 w-full sm:w-auto"
                        onClick={() => onChange({})}
                    >
                        검색 필터 조건 전체 해제
                    </button>
                </section>
            )}
        </div>
    );
}
