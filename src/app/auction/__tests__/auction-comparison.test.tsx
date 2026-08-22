import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
    AuctionComparison,
    prepareComparisonRows,
} from "@/app/auction/auction-comparison";
import type { AuctionItem, ItemOption } from "@/app/auction/types";
import OptionRenderer from "@/components/option-renderer";

function item(
    name: string,
    options: ItemOption[],
    price = 100,
    quantity = 1
): AuctionItem {
    return {
        listingId: `${name}-${price}-${quantity}`,
        item_name: name,
        item_display_name: name,
        item_count: quantity,
        auction_price_per_unit: price,
        date_auction_expire: "2026-08-21T12:00:00Z",
        item_option: options,
    };
}

function option(
    option_type: string,
    option_value: string | null,
    rest: Omit<ItemOption, "option_type" | "option_value"> = {}
): ItemOption {
    return { option_type, option_value, ...rest };
}

function findRow(items: AuctionItem[], label: string) {
    return prepareComparisonRows(items).find(row => row.label === label)!;
}

describe("prepareComparisonRows", () => {
    it("aligns reordered stats, enchants, and reforges", () => {
        const first = item("첫 매물", [
            option("공격", "10", { option_value2: "20" }),
            option("인챈트", "여명", {
                option_sub_type: "접두",
                option_desc: "최대 대미지 10 증가, 수리비 5% 증가",
            }),
            option("세공 옵션", "볼트 대미지(10레벨:대미지 20% 증가)"),
        ]);
        const second = item("둘째 매물", [
            option("세공 옵션", "볼트 대미지(12레벨:대미지 25% 증가)"),
            option("인챈트", "여명", {
                option_sub_type: "접두",
                option_desc: "수리비 7% 증가, 최대 대미지 15 증가",
            }),
            option("공격", "12", { option_value2: "20" }),
        ]);
        const items = [first, second];

        expect(findRow(items, "공격")).toMatchObject({
            emphasizeDifference: true,
        });
        expect(findRow(items, "접두 · 최대 대미지 증가").values).toEqual([
            expect.objectContaining({ text: "최대 대미지 10 증가" }),
            expect.objectContaining({ text: "최대 대미지 15 증가" }),
        ]);
        expect(findRow(items, "세공 옵션 · 볼트 대미지")).toMatchObject({
            emphasizeDifference: true,
        });
    });

    it("keeps missing, null, and unknown options conservative", () => {
        const first = item("첫 매물", [
            option("세공 옵션", null, { option_desc: null }),
            option("기타", "시즌 2 식별자"),
        ]);
        const second = item("둘째 매물", [option("기타", "시즌 3 식별자")]);
        const rows = prepareComparisonRows([first, second]);
        const reforge = rows.find(row => row.label === "세공 옵션")!;

        expect(reforge.values).toEqual([
            expect.objectContaining({ text: "정보 없음" }),
            null,
        ]);
        const unknownRows = rows.filter(row => row.label === "기타");
        expect(unknownRows).toHaveLength(2);
        expect(unknownRows.every(row => !row.emphasizeDifference)).toBe(true);
    });

    it("emphasizes only comparable signed and ranged numbers", () => {
        const items = [
            item("첫 매물", [
                option("크리티컬", "-1.5"),
                option("특별 개조", "7", { option_sub_type: "R" }),
            ]),
            item("둘째 매물", [
                option("크리티컬", "2.5"),
                option("특별 개조", "7", { option_sub_type: "S" }),
            ]),
        ];

        expect(findRow(items, "크리티컬").emphasizeDifference).toBe(true);
        expect(
            prepareComparisonRows(items)
                .filter(row => row.label.startsWith("특별 개조"))
                .every(row => !row.emphasizeDifference)
        ).toBe(true);
    });

    it("does not mutate source items or option order", () => {
        const items = [
            item("첫 매물", [
                option("밸런스", "10"),
                option("공격", "1", { option_value2: "2" }),
            ]),
        ];
        const before = JSON.parse(JSON.stringify(items)) as AuctionItem[];

        prepareComparisonRows(items);

        expect(items).toEqual(before);
    });

    it("merges duplicate option keys without numeric emphasis", () => {
        const balance = findRow(
            [item("첫 매물", [option("밸런스", "5"), option("밸런스", "10")])],
            "밸런스"
        );

        expect(balance.values[0]).toEqual({ text: "5\n10" });
        expect(balance.emphasizeDifference).toBe(false);
    });
});

describe("OptionRenderer", () => {
    it("omits nullable stat and color values", () => {
        const { container } = render(
            <OptionRenderer
                options={[
                    option("공격", null, { option_value2: null }),
                    option("공격", "10"),
                    option("부상률", "20"),
                    option("내구력", "30"),
                    option("크리티컬", "10"),
                    option("아이템 색상", null, { option_sub_type: "색상 1" }),
                ]}
            />
        );

        expect(container).not.toHaveTextContent(/null|undefined/);
        expect(screen.getByText("공격 10")).toBeInTheDocument();
        expect(screen.getByText("부상률 20")).toBeInTheDocument();
        expect(screen.getByText("내구력 30")).toBeInTheDocument();
        expect(screen.getByText("크리티컬 10")).toBeInTheDocument();
        expect(screen.queryByText(/색상 1/)).not.toBeInTheDocument();
    });
});

describe("AuctionComparison", () => {
    const first = item(
        "첫 매물",
        [option("공격", "10"), option("밸런스", "5")],
        100,
        2
    );
    const second = item("둘째 매물", [option("공격", "20")], 200, 3);

    it("shows selection controls and limit alerts", async () => {
        const user = userEvent.setup();
        const onRemove = jest.fn();
        const onClear = jest.fn();
        render(
            <AuctionComparison
                items={[first]}
                notice="최대 4개까지 비교할 수 있습니다."
                onRemove={onRemove}
                onClear={onClear}
            />
        );

        expect(screen.getByText("매물 1")).toBeInTheDocument();
        expect(screen.getByText("100 Gold")).toBeInTheDocument();
        expect(screen.getByText(/2개 · 만료/)).toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent("최대 4개");
        expect(
            screen.getByRole("button", { name: "선택한 매물 비교" })
        ).toBeDisabled();
        await user.click(screen.getByRole("button", { name: /비교에서 제거/ }));
        await user.click(screen.getByRole("button", { name: "전체 해제" }));
        expect(onRemove).toHaveBeenCalledWith(first);
        expect(onClear).toHaveBeenCalled();
    });

    it("renders missing values and restores focus after Escape", async () => {
        const user = userEvent.setup();
        render(
            <AuctionComparison
                items={[first, second]}
                notice={null}
                onRemove={jest.fn()}
                onClear={jest.fn()}
            />
        );
        const trigger = screen.getByRole("button", {
            name: "선택한 매물 비교",
        });
        const optionDisclosure = screen.getByText("첫 매물 옵션 보기");
        await user.click(optionDisclosure);
        expect(optionDisclosure.closest("details")).toHaveAttribute("open");
        expect(screen.getByText("밸런스 5")).toBeInTheDocument();
        await user.click(trigger);
        const dialog = screen.getByRole("dialog", { name: "장비 매물 비교" });
        const attackRow = within(dialog).getByRole("row", { name: /공격/ });
        const balanceRow = within(dialog).getByRole("row", { name: /밸런스/ });

        expect(within(balanceRow).getByText("—")).toBeInTheDocument();
        expect(within(attackRow).getByText("10")).toHaveTextContent(
            "10 (수치 차이 있음)"
        );
        expect(dialog).toHaveAttribute("aria-modal", "true");
        expect(
            within(dialog).getByRole("button", { name: "닫기" })
        ).toHaveFocus();
        await user.keyboard("{Escape}");
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
    });

    it("keeps the dialog closed after selection drops below two", async () => {
        const user = userEvent.setup();
        const props = { notice: null, onRemove: jest.fn(), onClear: jest.fn() };
        const { rerender } = render(
            <AuctionComparison items={[first, second]} {...props} />
        );

        await user.click(
            screen.getByRole("button", { name: "선택한 매물 비교" })
        );
        rerender(<AuctionComparison items={[first]} {...props} />);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        rerender(<AuctionComparison items={[first, second]} {...props} />);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});
