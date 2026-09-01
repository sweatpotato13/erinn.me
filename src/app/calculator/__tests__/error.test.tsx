import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CalculatorError from "@/app/calculator/error";

it("offers a route-level retry action", async () => {
    const reset = jest.fn();
    render(<CalculatorError error={new Error("offline")} reset={reset} />);

    expect(
        screen.getByText("파티 분배 계산기를 불러오지 못했습니다.")
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(reset).toHaveBeenCalledTimes(1);
});
