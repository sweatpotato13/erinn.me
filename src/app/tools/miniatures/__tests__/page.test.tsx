import { render, screen } from "@testing-library/react";

import Page, { metadata } from "@/app/tools/miniatures/page";

jest.mock("@/app/tools/miniatures/miniature-tool", () => ({
    __esModule: true,
    default: () => <div>Interactive tool</div>,
}));
test("server content explains supported rules, sources and unique base metadata", () => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "마비노기 미니어처 효과 비교·구매 도우미"
    );
    expect(
        screen.getByText(/능력치마다 독립적으로 설치 중인/)
    ).toBeInTheDocument();
    expect(screen.getByText(/세트 효과, 펫 하우스/)).toBeInTheDocument();
    expect(screen.getByText(/원본 버전 1788405829/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "경매장" })).toHaveAttribute(
        "href",
        "/auction"
    );
    expect(metadata.alternates?.canonical).toBe("/tools/miniatures");
    expect(metadata.openGraph?.images).toEqual([
        expect.objectContaining({
            url: "/tools/miniatures/preview",
            width: 1200,
            height: 630,
        }),
    ]);
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
});
