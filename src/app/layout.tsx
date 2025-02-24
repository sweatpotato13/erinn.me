import "@/styles/globals.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Metadata } from "next";

import Footer from "@/components/footer";
import { Providers } from "@/components/providers";
import Topbar from "@/components/topbar";

export const metadata: Metadata = {
    title: "마비노기 경매장 - 실시간 아이템 시세 검색 | Erinn.me",
    description:
        "마비노기 경매장의 실시간 아이템 시세를 검색하고 가격을 비교해보세요. 카테고리별 검색과 아이템 이름 검색을 지원합니다. 실시간 가격 정보와 아이템 옵션을 확인할 수 있습니다.",
    keywords:
        "마비노기, 경매장, 아이템 시세, 마비노기 경매장, 마비노기 시세, 마비노기 아이템, Erinn.me",
    openGraph: {
        title: "마비노기 경매장 - 실시간 아이템 시세 검색 | Erinn.me",
        description:
            "마비노기 경매장의 실시간 아이템 시세를 검색하고 가격을 비교해보세요. 카테고리별 검색과 아이템 이름 검색을 지원합니다.",
        type: "website",
        locale: "ko_KR",
        siteName: "Erinn.me",
    },
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: "https://erinn.me",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html data-theme="light" lang="ko">
            <body className="pt-16 font-custom">
                <Topbar />
                <main className="min-h-screen">
                    <Providers>{children}</Providers>
                </main>
                <Footer />
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
