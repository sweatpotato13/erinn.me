import type { Metadata } from "next";

import s from "@/components/tools/preparation.module.css";

import RelicTool from "./relic-tool";

const title = "무리아스의 유물 가격 정보";
const description =
    "아르카나별 무리아스의 유물 효과와 1~10레벨의 조회된 매물 최저가·수량을 비교하세요.";
export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: "/tools/murias-relics" },
    openGraph: { title, description, url: "/tools/murias-relics" },
};

export default function MuriasRelicsPage() {
    return (
        <div className={s.page}>
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            <p className="my-4">
                효과와 레벨별 실제 수치를 확인하고, 조회된 매물의 개당 등록
                가격을 비교하세요.
            </p>
            <RelicTool />
        </div>
    );
}
