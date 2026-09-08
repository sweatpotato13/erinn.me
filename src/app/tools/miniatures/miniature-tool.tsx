"use client";

import { type ReactElement, useRef } from "react";

import { miniatureDelta, type MiniatureReference } from "@/lib/miniatures";

import { BasketSummary, CandidateComparison } from "./candidate-comparison";
import { InstallationPanel } from "./installation-panel";
import { MiniatureCatalog } from "./miniature-catalog";
import {
    type MiniatureNotices,
    useMiniatureCandidates,
    useMiniatureInstallations,
    useMiniatureNotices,
    useMiniaturePrices,
} from "./miniature-hooks";
import { styles } from "./miniature-ui";

function NoticeToast({
    notices,
}: {
    notices: MiniatureNotices;
}): ReactElement | null {
    if (!notices.notice && !notices.storageNotice) return null;
    return (
        <div className={`toast toast-end ${styles.toast}`}>
            <div className="alert" role="status" aria-atomic="true">
                <p>
                    {[notices.storageNotice, notices.notice]
                        .filter(Boolean)
                        .join(" ")}
                </p>
                <button aria-label="안내 닫기" onClick={notices.clear}>
                    닫기
                </button>
            </div>
        </div>
    );
}

export default function MiniatureTool({
    data,
}: {
    data: MiniatureReference;
}): ReactElement {
    const searchRef = useRef<HTMLInputElement>(null);
    const focusSearch = () => searchRef.current?.focus();
    const notices = useMiniatureNotices();
    const installations = useMiniatureInstallations(data, notices);
    const candidates = useMiniatureCandidates(
        data,
        notices.setNotice,
        focusSearch
    );
    const prices = useMiniaturePrices(
        data.version,
        candidates.selected,
        candidates.config.manualPrices
    );
    const change = miniatureDelta(
        data.miniatures,
        installations.installed,
        candidates.config.candidateIds
    );
    const props = { data, installations, candidates, prices };
    return (
        <div className={styles.window}>
            <NoticeToast notices={notices} />
            <InstallationPanel
                data={data}
                installations={installations}
                totals={change.before}
                focusSearch={focusSearch}
            />
            <div className={styles.columns}>
                <div className={styles.left}>
                    <CandidateComparison {...props} />
                    <BasketSummary
                        change={change}
                        candidates={candidates}
                        prices={prices}
                    />
                </div>
                <MiniatureCatalog {...props} searchRef={searchRef} />
            </div>
        </div>
    );
}
