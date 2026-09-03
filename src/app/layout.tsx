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
    metadataBase: new URL("https://erinn.me"),
    title: {
        default: "마비노기 경매장·뿔피리·NPC 상점 조회 | Erinn.me",
        template: "%s | Erinn.me",
    },
    description:
        "마비노기 한국 서버의 경매장 시세, 거대한 외침의 뿔피리 내역, NPC 상점 재고를 한곳에서 조회하세요.",
    openGraph: {
        title: "마비노기 경매장·뿔피리·NPC 상점 조회 | Erinn.me",
        description:
            "마비노기 한국 서버의 경매장 시세, 거대한 외침의 뿔피리 내역, NPC 상점 재고를 한곳에서 조회하세요.",
        type: "website",
        locale: "ko_KR",
        siteName: "Erinn.me",
    },
    robots: {
        index: true,
        follow: true,
    },
    verification: {
        other: {
            "naver-site-verification":
                "a2395db235b9192521ed7cab21fb5af80030b680",
        },
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
