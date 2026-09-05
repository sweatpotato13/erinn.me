import { render, screen } from "@testing-library/react";

import * as reference from "@/lib/enchant-reference";

import OptionRenderer from "..";

jest.mock("@/lib/enchant-reference", () => {
    const actual = jest.requireActual("@/lib/enchant-reference");
    return {
        ...actual,
        findEnchantReference: jest.fn(actual.findEnchantReference),
    };
});

beforeEach(() =>
    jest
        .mocked(reference.findEnchantReference)
        .mockImplementation(
            jest.requireActual("@/lib/enchant-reference").findEnchantReference
        )
);

it("annotates only variable effects in 굴레, leaving intelligence and repair cost plain", () => {
    const { container } = render(
        <OptionRenderer
            options={[
                {
                    option_type: "인챈트",
                    option_value: "굴레",
                    option_sub_type: "접미",
                    option_desc:
                        "피어싱 레벨 2 증가,마법 공격력 50 증가,지력 30 증가,수리비 200% 증가",
                },
            ]}
        />
    );
    expect(screen.getByText(/• 피어싱 레벨 2 증가/)).toHaveTextContent(
        "최대치 -1"
    );
    expect(screen.getByText(/• 마법 공격력 50 증가/)).toHaveTextContent(
        "최대치 -5"
    );
    expect(screen.getByText(/• 지력 30 증가/)).not.toHaveTextContent("최대치");
    expect(screen.getByText(/• 수리비 200% 증가/)).not.toHaveTextContent(
        "최대치"
    );
    expect(container.textContent?.match(/최대치/g)).toHaveLength(2);
});

it("keeps equipment rolls intact and shows reference conditions and outside-range values", () => {
    const options = [
        {
            option_type: "인챈트",
            option_sub_type: "접두",
            option_value: "어스름한",
            option_desc:
                "마법 공격력 60 증가,최대 마나 100 증가,수리비 200% 증가,알 수 없는 효과 2.5 증가",
        },
    ];
    const before = JSON.stringify(options);
    const { rerender, container } = render(
        <OptionRenderer options={options} />
    );
    expect(screen.getByText(/마법 공격력 60 증가/)).toHaveTextContent(
        "(최대치 -5)"
    );
    expect(
        screen.getByText(/수리비 200% 증가/, { selector: ".text-blue-300" })
    ).toHaveTextContent("200%");
    expect(screen.getByText(/알 수 없는 효과 2.5 증가/)).not.toHaveTextContent(
        "최대치"
    );
    expect(
        container.querySelector('[data-enchant-id="21639"]')
    ).toHaveTextContent("접두 · 6 랭크");
    expect(container).toHaveTextContent(
        "아이스볼트 랭크 3단 이상일 때 마법 공격력 50~65 증가"
    );
    expect(container).toHaveTextContent("조건 충족 시 적용");
    expect(JSON.stringify(options)).toBe(before);
    rerender(
        <OptionRenderer
            options={[{ ...options[0], option_desc: "마법 공격력 70 증가" }]}
        />
    );
    expect(screen.getByText(/마법 공격력 70 증가/)).toHaveTextContent(
        "기준 범위 밖"
    );
    expect(screen.queryByText(/최대치 5/)).not.toBeInTheDocument();
});

it("shows complete scroll descriptions, metadata and decreases", () => {
    const { container, rerender } = render(
        <OptionRenderer
            options={[
                {
                    option_type: "인챈트 종류",
                    option_value: "잔허의",
                    option_sub_type: "접두",
                },
            ]}
        />
    );
    expect(container.querySelector("details")).toHaveAttribute("open");
    expect(container).toHaveTextContent("접두 · 7 랭크");
    expect(container).toHaveTextContent("음악버프 효과 2 증가");
    expect(container).toHaveTextContent("인챈트 장비를 전용으로 만듦");
    rerender(
        <OptionRenderer
            options={[
                {
                    option_type: "인챈트",
                    option_value: "햄스터헌터",
                    option_desc: "최대대미지 12 감소",
                },
            ]}
        />
    );
    expect(screen.getByText(/최대대미지 12 감소/)).toHaveTextContent(
        "최대치 -2"
    );
});

it("does not fabricate comparisons for missing and ambiguous names", () => {
    const { container } = render(
        <OptionRenderer
            options={[
                {
                    option_type: "인챈트",
                    option_value: "스네이크",
                    option_desc: "최대대미지 1 증가",
                },
                { option_type: "인챈트 종류", option_value: "모르는 이름" },
            ]}
        />
    );
    expect(container).toHaveTextContent("최대대미지 1 증가");
    expect(
        screen.getAllByText("인챈트 기준 정보를 확인할 수 없습니다.")
    ).toHaveLength(2);
    expect(container).not.toHaveTextContent("최대치");
});

it("shows relic enchant scrolls as relics with their activation condition and fixed effects", () => {
    const { container } = render(
        <OptionRenderer
            options={[
                {
                    option_type: "인챈트 종류",
                    option_value: "편린",
                    option_sub_type: "접미",
                },
            ]}
        />
    );
    expect(container).toHaveTextContent("유물 접미");
    expect(container).toHaveTextContent(
        "활성화된 아르카나의 전용 옵션일 때 효과 발동"
    );
    expect(container).toHaveTextContent("마법 공격력 15 증가");
    expect(container).toHaveTextContent("최대 마나 20 증가");
    expect(container).not.toHaveTextContent("기준 정보를 확인할 수 없습니다");
    expect(container).not.toHaveTextContent("최대치");
});

it("renders source formatting as text, retains fixed zero, and handles missing descriptions", () => {
    const record = {
        id: 1,
        names: ["테스트"],
        usage: 0,
        rank: "F",
        description:
            '체력 0 증가\\n<img src=x onerror="alert(1)">\\n알 수 없는 효과',
    };
    const lookup = jest
        .mocked(reference.findEnchantReference)
        .mockReturnValue(record);
    const { container, rerender } = render(
        <OptionRenderer
            options={[{ option_type: "인챈트 종류", option_value: "테스트" }]}
        />
    );
    expect(container).toHaveTextContent("체력 0 증가");
    expect(container).toHaveTextContent('<img src=x onerror="alert(1)">');
    expect(container.querySelector("img")).toBeNull();
    expect(container).not.toHaveTextContent(/undefined|null/);
    lookup.mockReturnValue({ ...record, description: "" });
    rerender(
        <OptionRenderer
            options={[{ option_type: "인챈트 종류", option_value: "테스트" }]}
        />
    );
    expect(container).toHaveTextContent("효과 설명을 확인할 수 없습니다.");
});
