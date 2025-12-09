import "@/styles/globals.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next/types";

import Footer from "@/components/footer";
import { Providers } from "@/components/providers";
import PWARegistration from "@/components/pwa-registration";
import Topbar from "@/components/topbar";

export const viewport: Viewport = {
    themeColor: "#000000",
    viewportFit: "cover",
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
};

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
    icons: [
        {
            rel: "apple-touch-icon",
            sizes: "192x192",
            url: "/icons/icon-192x192.png",
        },
        { rel: "icon", sizes: "192x192", url: "/icons/icon-192x192.png" },
        { rel: "icon", sizes: "384x384", url: "/icons/icon-384x384.png" },
        { rel: "icon", sizes: "512x512", url: "/icons/icon-512x512.png" },
    ],
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Erinn.me",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html data-theme="light" lang="ko">
            <head>
                <meta name="application-name" content="Erinn.me" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="black-translucent"
                />
                <meta name="apple-mobile-web-app-title" content="Erinn.me" />
                <meta name="format-detection" content="telephone=no" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="msapplication-TileColor" content="#000000" />
                <meta name="msapplication-tap-highlight" content="no" />
                <meta name="theme-color" content="#000000" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, viewport-fit=cover"
                />
            </head>
            <body className="pt-[calc(4rem+env(safe-area-inset-top))] font-custom">
                <Topbar />
                <main className="min-h-screen">
                    <Providers>{children}</Providers>
                </main>
                <Footer />
                <PWARegistration />
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
