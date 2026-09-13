import type { Metadata } from "next";
import Link from "next/link";

import s from "@/components/tools/preparation.module.css";

import Simulator from "./simulator";

const title = "무리아스의 유물 복원 시뮬레이터";
const description =
    "균등 확률을 가정해 유물을 복원하고 이데아 비용과 판매 수수료를 반영한 누적 예상 손익을 확인하세요.";
export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: "/tools/murias-relics/simulator" },
    openGraph: { title, description, url: "/tools/murias-relics/simulator" },
};

export default function MuriasSimulatorPage() {
    return (
        <div className={s.page}>
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            <p className="my-4">
                가정한 확률로 매번 유물 하나를 복원합니다.{" "}
                <Link className="link" href="/tools/murias-relics">
                    유물 옵션·레벨별 가격표
                </Link>
            </p>
            <Simulator />
        </div>
    );
}
