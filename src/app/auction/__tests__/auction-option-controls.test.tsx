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

it("preserves zero-valued totem rows and removes only the selected active condition", async () => {
    const user = userEvent.setup();
    const apply = jest.fn();
    const change = jest.fn();
    render(
        <AuctionOptionControls
            filters={{ totem: { maxdamage: 0, strength: 5, dexterity: 7 } }}
            onApply={apply}
            onChange={change}
        />
    );
    await user.click(screen.getByText(/^검색 필터/, { selector: "summary" }));
    await user.click(screen.getByRole("button", { name: "토템 2 입력 제거" }));
    expect(
        screen.getByRole("button", { name: "토템 조건 추가" })
    ).toHaveFocus();
    expect(screen.getByLabelText("토템 2 최소 수치")).toHaveValue(7);
    await user.click(screen.getByRole("button", { name: "조건 적용" }));
    expect(apply).toHaveBeenCalledWith({
        totem: { maxdamage: 0, dexterity: 7 },
    });
    await user.click(
        screen.getByRole("button", { name: /토템:.*체력.*조건 제거/ })
    );
    expect(change).toHaveBeenCalledWith({
        totem: { maxdamage: 0, dexterity: 7 },
    });
});

it("restricts innate stats by color and shows awakening suggestions on focus", async () => {
    const user = userEvent.setup();
    const apply = jest.fn();
    render(
        <AuctionOptionControls
            filters={{
                echostone: {
                    color: 1,
                    innate: { stat: "strength", minValue: 50 },
                },
            }}
            onApply={apply}
            onChange={jest.fn()}
        />
    );
    await user.click(screen.getByText(/^검색 필터/, { selector: "summary" }));
    const stat = screen.getByRole("combobox", { name: "에코스톤 고유 능력" });
    const color = screen.getByRole("combobox", { name: "에코스톤 종류" });
    for (const [id, key, label] of [
        ["1", "strength", "체력"],
        ["2", "intelligence", "지력"],
        ["3", "dexterity", "솜씨"],
        ["4", "will", "의지"],
        ["5", "vitals", "생명력, 마나, 스태미나"],
    ]) {
        await user.selectOptions(color, id);
        expect(stat).toHaveValue(key);
        expect(
            Array.from((stat as HTMLSelectElement).options).map(
                option => option.text
            )
        ).toEqual(["선택 안 함", label]);
    }
    await user.selectOptions(color, "");
    expect((stat as HTMLSelectElement).options).toHaveLength(6);
    const awakening = screen.getByRole("combobox", {
        name: "에코스톤 각성 옵션",
    });
    await user.click(awakening);
    expect(
        screen.getByRole("listbox", { name: "에코스톤 각성 옵션 제안" })
    ).toBeVisible();
    await user.type(awakening, "보우 마스터리 최대 대미지");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(awakening).toHaveValue("보우 마스터리 최대 대미지");
    expect(apply).not.toHaveBeenCalled();
});

it("shows a dismissible error toast for conflicting targets without applying or clearing drafts", async () => {
    const user = userEvent.setup();
    const apply = jest.fn();
    render(
        <AuctionOptionControls
            filters={{
                echostone: { color: 1 },
                murias: { effectId: 73020, minLevel: 1 },
            }}
            onApply={apply}
            onChange={jest.fn()}
        />
    );
    await user.click(screen.getByText(/^검색 필터/, { selector: "summary" }));
    await user.click(screen.getByRole("button", { name: "조건 적용" }));
    expect(screen.getByRole("alert")).toHaveClass("fixed", "alert-error");
    expect(screen.getByRole("alert")).toHaveTextContent(
        "함께 적용할 수 없습니다"
    );
    expect(apply).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "오류 알림 닫기" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "에코스톤 종류" })).toHaveValue(
        "1"
    );
});
