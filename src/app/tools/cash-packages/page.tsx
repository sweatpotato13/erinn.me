import type { Metadata } from "next";

import CashPackageTool from "@/app/tools/cash-packages/cash-package-tool";
import catalogData from "@/data/cash-packages.json";
import type { CashPackageCatalog } from "@/lib/cash-packages";

const path = "/tools/cash-packages";
const title = "마비노기 캐시 패키지 비교";
const description =
    "2026 한가위 캐시 패키지 3종의 경매장 예상 수령액과 손익을 비교하세요.";

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path },
    twitter: { card: "summary", title, description },
};

export default function CashPackagesPage() {
    return <CashPackageTool catalog={catalogData as CashPackageCatalog} />;
}
