import "@/styles/globals.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import Footer from "@/components/footer";
import { Providers } from "@/components/providers";
import Topbar from "@/components/topbar";
import { metadata as defaultMetadata } from "@/constant/metadata";

export const metadata = defaultMetadata;

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html data-theme="light" lang="en">
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
