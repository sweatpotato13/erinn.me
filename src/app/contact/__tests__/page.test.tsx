import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ContactPage from "@/app/contact/page";

const fetchMock = jest.fn();

beforeEach(() => {
    global.fetch = fetchMock;
    fetchMock.mockReset();
});

test("shows a friendly error when the contact API returns 503 JSON", async () => {
    fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        json: () =>
            Promise.resolve({
                error: "Contact delivery is temporarily unavailable",
            }),
    });

    render(<ContactPage />);

    fireEvent.change(screen.getByLabelText("닉네임"), {
        target: { value: "테스트유저" },
    });
    fireEvent.change(screen.getByLabelText("이메일"), {
        target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("제목"), {
        target: { value: "문의 제목입니다" },
    });
    fireEvent.change(screen.getByLabelText("메시지"), {
        target: { value: "문의 본문입니다 ten chars" },
    });
    fireEvent.click(screen.getByRole("button", { name: "전송" }));

    await waitFor(() => {
        expect(
            screen.getByText(/문의 전송 중 오류가 발생했습니다/)
        ).toBeInTheDocument();
    });
    expect(
        screen.getByText(/Contact delivery is temporarily unavailable/)
    ).toBeInTheDocument();
});

test("shows a generic failure message for 503 without a JSON error body", async () => {
    fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.reject(new Error("not json")),
    });

    render(<ContactPage />);

    fireEvent.change(screen.getByLabelText("닉네임"), {
        target: { value: "테스트유저" },
    });
    fireEvent.change(screen.getByLabelText("이메일"), {
        target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("제목"), {
        target: { value: "문의 제목입니다" },
    });
    fireEvent.change(screen.getByLabelText("메시지"), {
        target: { value: "문의 본문입니다 ten chars" },
    });
    fireEvent.click(screen.getByRole("button", { name: "전송" }));

    await waitFor(() => {
        expect(screen.getByText(/문의 전송 실패 \(503\)/)).toBeInTheDocument();
    });
});
