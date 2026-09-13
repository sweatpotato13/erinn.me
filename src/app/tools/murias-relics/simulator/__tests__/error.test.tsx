import { fireEvent, render, screen } from "@testing-library/react";

import MuriasSimulatorError from "../error";

test("offers recovery without exposing the underlying error", () => {
    const reset = jest.fn();
    render(
        <MuriasSimulatorError
            error={new Error("Internal failure details")}
            reset={reset}
        />
    );
    expect(screen.getByRole("heading")).toHaveTextContent(
        "무리아스 유물 복원 시뮬레이터를 불러오지 못했습니다."
    );
    expect(
        screen.queryByText("Internal failure details")
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(reset).toHaveBeenCalledTimes(1);
});
