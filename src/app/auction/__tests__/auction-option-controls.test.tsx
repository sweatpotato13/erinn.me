import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { AuctionOptionAutocomplete } from "../auction-option-autocomplete";
import { AuctionOptionControls } from "../auction-option-controls";

it("selects suggestions with keyboard and pointer without submitting, and respects IME", async () => {
    const submit = jest.fn();
    function Form() {
        const [value, setValue] = useState("");
        return (
            <form
                onSubmit={event => {
                    event.preventDefault();
                    submit();
                }}
            >
                <AuctionOptionAutocomplete
                    label="옵션"
                    name="option"
                    value={value}
                    onChange={setValue}
                    options={[
                        { value: "볼트 대미지", label: "볼트 대미지" },
                        { value: "마법 공격력", label: "마법 공격력" },
                    ]}
                />
                <button>적용</button>
            </form>
        );
    }
    const user = userEvent.setup();
    render(<Form />);
    const input = screen.getByRole("combobox");
    await user.type(input, "볼트");
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    expect(input).toHaveValue("볼트");
    expect(submit).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    await user.keyboard("{ArrowDown}{Enter}");
    expect(input).toHaveValue("볼트 대미지");
    expect(submit).not.toHaveBeenCalled();
    await user.clear(input);
    await user.type(input, "마법");
    await user.click(screen.getByRole("option", { name: "마법 공격력" }));
    expect(input).toHaveValue("마법 공격력");
    expect(input).toHaveFocus();
    await user.clear(input);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.type(input, "기준 밖 수동 옵션");
    await user.tab();
    expect(input).toHaveValue("기준 밖 수동 옵션");
    expect(submit).not.toHaveBeenCalled();
});

it("preserves legacy enchant and surviving reforge rows when removing the middle row", async () => {
    const user = userEvent.setup();
    const apply = jest.fn();
    render(
        <AuctionOptionControls
            filters={{
                enchantName: "여명",
                reforges: [
                    { optionName: "첫 옵션", minLevel: 1 },
                    { optionName: "둘째 옵션", minLevel: 2 },
                    { optionName: "셋째 옵션", minLevel: 30 },
                ],
            }}
            onApply={apply}
            onChange={jest.fn()}
        />
    );
    await user.click(screen.getByText(/^검색 필터/, { selector: "summary" }));
    expect(
        screen.getByRole("button", { name: "세공 조건 추가" })
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "세공 2 입력 제거" }));
    expect(
        screen.getByRole("button", { name: "세공 조건 추가" })
    ).toHaveFocus();
    expect(screen.getByLabelText("세공 2 옵션 이름")).toHaveValue("셋째 옵션");
    expect(screen.getByLabelText("세공 2 최소 레벨")).toHaveValue(30);
    await user.click(screen.getByRole("button", { name: "조건 적용" }));
    expect(apply).toHaveBeenCalledWith({
        enchantName: "여명",
        reforges: [
            { optionName: "첫 옵션", minLevel: 1 },
            { optionName: "셋째 옵션", minLevel: 30 },
        ],
    });
});
