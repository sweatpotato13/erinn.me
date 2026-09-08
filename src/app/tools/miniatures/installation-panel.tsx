import { type ReactElement, useState } from "react";

import {
    effectLabel,
    effectValue,
    matchesMiniature,
    type Miniature,
    MINIATURE_EFFECTS,
    type MiniatureReference,
    type MiniatureTotals,
} from "@/lib/miniatures";

import type { MiniatureInstallations } from "./miniature-hooks";
import {
    Icon,
    InstallationToggle,
    ItemEffects,
    styles,
    typeName,
} from "./miniature-ui";

interface InstallationProps {
    data: MiniatureReference;
    installations: MiniatureInstallations;
    totals: MiniatureTotals;
    focusSearch: () => void;
}
function InstallationTotals({
    totals,
}: {
    totals: MiniatureTotals;
}): ReactElement {
    return (
        <details>
            <summary>설치 효과 전체 보기</summary>
            <dl>
                {Object.keys(MINIATURE_EFFECTS).map(key => (
                    <div key={key}>
                        <dt>{effectLabel(key)}</dt>
                        <dd>{effectValue(key, totals.total[key])}</dd>
                    </div>
                ))}
            </dl>
        </details>
    );
}
function InstalledCard({
    item,
    installations,
}: {
    item: Miniature;
    installations: MiniatureInstallations;
}): ReactElement {
    return (
        <div className={styles.entry}>
            <Icon item={item} />
            <h3>{item.name}</h3>
            <p>{typeName(item)}</p>
            <ItemEffects item={item} />
            <InstallationToggle item={item} installations={installations} />
        </div>
    );
}
function InstalledList({
    data,
    installations,
}: Pick<InstallationProps, "data" | "installations">): ReactElement {
    const [type, setType] = useState("all");
    const items = data.miniatures.filter(
        item =>
            installations.installed.includes(item.id) &&
            matchesMiniature(item, "", type)
    );
    return (
        <div aria-label="설치된 미니어처 목록">
            <p>
                현재 설치한 미니어처입니다. 이 목록으로 설치 효과를 계산합니다.
            </p>
            <div
                className={styles.controls}
                role="group"
                aria-label="설치 목록 종류"
            >
                {[
                    ["all", "전체"],
                    ["normal", "일반"],
                    ["extra", "엑스트라"],
                ].map(([value, label]) => (
                    <button
                        key={value}
                        aria-pressed={type === value}
                        onClick={() => setType(value)}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <div className={styles.installedGrid}>
                {items.map(item => (
                    <InstalledCard
                        key={item.id}
                        item={item}
                        installations={installations}
                    />
                ))}
            </div>
        </div>
    );
}
export function InstallationPanel({
    data,
    installations,
    totals,
    focusSearch,
}: InstallationProps): ReactElement {
    const { installed, ready, save } = installations;
    return (
        <section
            className={`${styles.panel} ${styles.baseline}`}
            aria-label="설치 기준"
        >
            <div className={styles.controls}>
                <h2>내 설치 현황 · {installed.length}개</h2>
                <button onClick={focusSearch}>미니어처 추가</button>
                <button
                    disabled={!ready || !installed.length}
                    onClick={() => save([], true)}
                >
                    설치 목록 초기화
                </button>
            </div>
            <InstallationTotals totals={totals} />
            <InstalledList data={data} installations={installations} />
            {installed.length === 0 && (
                <p>
                    설치된 미니어처가 없습니다. 미니어처 찾기에서 설치 중을
                    체크하세요.
                </p>
            )}
        </section>
    );
}
