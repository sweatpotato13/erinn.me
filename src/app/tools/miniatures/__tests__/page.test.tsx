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
    expect(screen.queryByText(/데이터: Prilus/)).not.toBeInTheDocument();
    expect(
        screen.queryByRole("navigation", { name: "관련 도구" })
    ).not.toBeInTheDocument();
    expect(
        screen.queryByRole("link", { name: "마비노기 공식 공지" })
    ).not.toBeInTheDocument();
    expect(metadata.alternates?.canonical).toBe("/tools/miniatures");
    expect(metadata.openGraph).toBeUndefined();
    expect(metadata.twitter).toBeUndefined();
});
