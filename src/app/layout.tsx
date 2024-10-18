import "@/styles/globals.css";

import Footer from "@/components/footer";
import Topbar from "@/components/topbar";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html data-theme="light" lang="en">
            <body className="pt-16 font-custom">
                <Topbar />
                <main className="min-h-screen">{children}</main>
                <Footer />
            </body>
        </html>
    );
}
