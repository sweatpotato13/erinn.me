import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "문의하기",
    robots: { index: false, follow: true },
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
