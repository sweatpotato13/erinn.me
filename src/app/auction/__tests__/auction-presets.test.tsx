import {
    act,
    render,
    renderHook,
    screen,
    within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";

import {
    AuctionPresetsDialog,
    AuctionPresetToolbar,
} from "@/app/auction/auction-presets-dialog";
import {
    AUCTION_PRESETS_KEY,
    type AuctionPreset,
    MAX_AUCTION_PRESETS,
    parseStoredAuctionPresets,
    prepareAuctionPresetSearch,
    useAuctionPresets,
} from "@/app/auction/use-auction-presets";
import type { AuctionUrlSearch } from "@/app/auction/use-auction-url-state";
import { categories } from "@/constant/categories";

const activeSearch: AuctionUrlSearch = {
    itemName: "검",
    category: "검",
    optionFilters: {
        enchantName: "여명",
        reforge: { optionName: "볼트 대미지", minLevel: 10 },
        erg: { grade: "S", minLevel: 40 },
    },
};

function preset(
    name: string,
    overrides: Partial<AuctionPreset> = {}
): AuctionPreset {
    return {
        name,
        itemName: "검",
        category: "검",
        optionFilters: { enchantName: "여명" },
        ...overrides,
    };
}

describe("auction preset storage", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => jest.restoreAllMocks());

    it("keeps valid entries while normalizing and isolating bad data", () => {
        const parsed = parseStoredAuctionPresets(
            JSON.stringify([
                preset("  주력   검색  ", { itemName: "  검  " }),
                null,
                preset("주력 검색"),
                preset("폐기 카테고리", { category: "지원 종료" }),
            ])
        );

        expect(parsed).toEqual({
            presets: [preset("주력 검색")],
            discardedCount: 3,
        });
    });

    it.each([
        [null, 0],
        ["{broken", 1],
        [JSON.stringify({}), 1],
    ])("recovers from invalid storage: %p", (value, discardedCount) => {
        expect(parseStoredAuctionPresets(value)).toEqual({
            presets: [],
            discardedCount,
        });
    });

    it("allows category-only searches and keeps at most 20 unique presets", () => {
        const stored = Array.from(
            { length: MAX_AUCTION_PRESETS + 1 },
            (_, index) =>
                preset(`프리셋 ${index}`, {
                    itemName: "",
                    category: categories[1],
                })
        );
        const parsed = parseStoredAuctionPresets(JSON.stringify(stored));

        expect(parsed.presets).toHaveLength(MAX_AUCTION_PRESETS);
        expect(parsed.presets[0]).toMatchObject({
            itemName: "",
            category: categories[1],
        });
        expect(parsed.discardedCount).toBe(1);
    });

    it("recovers supported conditions and reports obsolete ones", () => {
        const prepared = prepareAuctionPresetSearch(
            preset("구형", {
                optionFilters: {
                    enchantName: "여명",
                    reforge: { optionName: "누락된 레벨" },
                    erg: { grade: "A", minLevel: 20 },
                    socket: { count: 2 },
                },
            })
        );

        expect(prepared.search.optionFilters).toEqual({
            enchantName: "여명",
            erg: { grade: "A", minLevel: 20 },
        });
        expect(prepared.unsupportedConditions).toEqual([
            "세공 (reforge)",
            "지원하지 않는 조건 (socket)",
        ]);
    });

    it("adds, renames, and removes presets in state and storage", () => {
        const { result } = renderHook(() => useAuctionPresets());

        act(() => {
            expect(result.current.add("  주력   검색 ", activeSearch)).toEqual(
                expect.objectContaining({ success: true, kind: "success" })
            );
        });
        expect(result.current.presets).toEqual([
            { name: "주력 검색", ...activeSearch },
        ]);

        act(() => {
            expect(result.current.rename("주력 검색", "새 이름")).toEqual(
                expect.objectContaining({ success: true })
            );
        });
        expect(result.current.presets[0].name).toBe("새 이름");

        act(() => {
            expect(result.current.remove("새 이름")).toEqual(
                expect.objectContaining({ success: true })
            );
        });
        expect(result.current.presets).toEqual([]);
        expect(JSON.parse(localStorage.getItem(AUCTION_PRESETS_KEY)!)).toEqual(
            []
        );
    });

    it("rejects duplicate names and the twenty-first preset", () => {
        localStorage.setItem(
            AUCTION_PRESETS_KEY,
            JSON.stringify(
                Array.from({ length: MAX_AUCTION_PRESETS }, (_, index) =>
                    preset(`프리셋 ${index}`)
                )
            )
        );
        const setItem = jest.spyOn(Storage.prototype, "setItem");
        const { result } = renderHook(() => useAuctionPresets());
        setItem.mockClear();

        let duplicate;
        let overLimit;
        act(() => {
            duplicate = result.current.add(" 프리셋   0 ", activeSearch);
            overLimit = result.current.add("추가", activeSearch);
        });

        expect(duplicate).toEqual(
            expect.objectContaining({
                success: false,
                message: "같은 이름의 프리셋이 이미 있습니다.",
            })
        );
        expect(overLimit).toEqual(
            expect.objectContaining({
                success: false,
                message: "프리셋은 최대 20개까지 저장할 수 있습니다.",
            })
        );
        expect(setItem).not.toHaveBeenCalled();
    });

    it("rejects invalid names and rename collisions without writing", () => {
        localStorage.setItem(
            AUCTION_PRESETS_KEY,
            JSON.stringify([preset("첫 번째"), preset("두 번째")])
        );
        const setItem = jest.spyOn(Storage.prototype, "setItem");
        const { result } = renderHook(() => useAuctionPresets());
        setItem.mockClear();

        expect(result.current.add("   ", activeSearch)).toEqual(
            expect.objectContaining({
                success: false,
                message: "프리셋 이름을 입력해주세요.",
            })
        );
        expect(result.current.add("가".repeat(51), activeSearch)).toEqual(
            expect.objectContaining({ success: false })
        );
        expect(result.current.rename("첫 번째", " 두   번째 ")).toEqual(
            expect.objectContaining({
                success: false,
                message: "같은 이름의 프리셋이 이미 있습니다.",
            })
        );
        expect(setItem).not.toHaveBeenCalled();
    });

    it("keeps changes in memory and warns when storage is unavailable", () => {
        jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("blocked");
        });
        jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("full");
        });
        const { result } = renderHook(() => useAuctionPresets());

        let operation;
        act(() => {
            operation = result.current.add("임시", activeSearch);
        });

        expect(operation).toEqual(
            expect.objectContaining({ success: true, kind: "warning" })
        );
        expect(result.current.presets).toEqual([
            { name: "임시", ...activeSearch },
        ]);
        expect(result.current.storageWarning).toContain("현재 페이지");
    });

    it("rejects missing and structurally invalid active searches", () => {
        const { result } = renderHook(() => useAuctionPresets());

        expect(result.current.add("없음", null)).toEqual(
            expect.objectContaining({ success: false })
        );
        expect(
            result.current.add("잘못됨", {
                ...activeSearch,
                optionFilters: {
                    reforge: { optionName: "레벨 없음" },
                } as AuctionUrlSearch["optionFilters"],
            })
        ).toEqual(expect.objectContaining({ success: false }));
    });
});

function DialogHarness({
    search = activeSearch,
    onLoad = jest.fn(),
}: {
    search?: AuctionUrlSearch | null;
    onLoad?: (search: AuctionUrlSearch) => void;
}) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const presets = useAuctionPresets();
    return (
        <>
            <AuctionPresetToolbar
                onShow={() => setOpen(true)}
                triggerRef={triggerRef}
            />
            {open && (
                <AuctionPresetsDialog
                    activeSearch={search}
                    presets={presets}
                    onLoad={onLoad}
                    onClose={() => setOpen(false)}
                    triggerRef={triggerRef}
                />
            )}
        </>
    );
}

function presetItem(name: string) {
    return screen.getByRole("heading", { level: 4, name }).closest("li")!;
}

describe("AuctionPresetsDialog", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => jest.restoreAllMocks());

    it("explains device-local storage and restores trigger focus on Escape", async () => {
        const user = userEvent.setup();
        render(<DialogHarness search={null} />);
        const trigger = screen.getByRole("button", { name: "검색 프리셋" });

        await user.click(trigger);
        const dialog = screen.getByRole("dialog", { name: "검색 프리셋" });
        expect(
            within(dialog).getByText(/다른 기기와 동기화되지 않습니다/)
        ).toBeVisible();
        expect(
            within(dialog).getByRole("button", { name: "저장" })
        ).toBeDisabled();
        expect(within(dialog).getByLabelText("프리셋 이름")).toHaveFocus();

        await user.keyboard("{Shift>}{Tab}{/Shift}");
        expect(
            within(dialog).getByRole("button", { name: "닫기" })
        ).toHaveFocus();
        await user.tab();
        expect(within(dialog).getByLabelText("프리셋 이름")).toHaveFocus();

        await user.keyboard("{Escape}");
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
    });

    it("saves, renames, and deletes a preset with visible feedback", async () => {
        const user = userEvent.setup();
        render(<DialogHarness />);
        await user.click(screen.getByRole("button", { name: "검색 프리셋" }));
        const dialog = screen.getByRole("dialog", { name: "검색 프리셋" });

        await user.type(within(dialog).getByLabelText("프리셋 이름"), "주력");
        await user.click(within(dialog).getByRole("button", { name: "저장" }));
        expect(within(dialog).getByRole("status")).toHaveTextContent(
            "프리셋을 저장했습니다."
        );

        let item = presetItem("주력");
        await user.click(
            within(item).getByRole("button", { name: "이름 변경" })
        );
        const rename = within(item).getByLabelText("주력 새 이름");
        await user.clear(rename);
        await user.type(rename, "새 주력");
        await user.click(within(item).getByRole("button", { name: "확인" }));

        item = presetItem("새 주력");
        await user.click(within(item).getByRole("button", { name: "삭제" }));
        expect(
            within(dialog).getByText("저장된 검색 프리셋이 없습니다.")
        ).toBeVisible();
        expect(within(dialog).getByRole("status")).toHaveTextContent(
            "프리셋을 삭제했습니다."
        );
    });

    it("loads valid presets immediately but previews obsolete conditions", async () => {
        const user = userEvent.setup();
        const onLoad = jest.fn();
        localStorage.setItem(
            AUCTION_PRESETS_KEY,
            JSON.stringify([
                preset("정상"),
                preset("구형", {
                    optionFilters: {
                        enchantName: "여명",
                        removedFilter: true,
                    },
                }),
            ])
        );
        render(<DialogHarness onLoad={onLoad} />);
        await user.click(screen.getByRole("button", { name: "검색 프리셋" }));

        await user.click(
            within(presetItem("구형")).getByRole("button", {
                name: "불러오기",
            })
        );
        expect(onLoad).not.toHaveBeenCalled();
        const warning = screen.getByRole("alert");
        expect(within(warning).getByText(/removedFilter/)).toBeVisible();
        expect(within(warning).getByText(/인챈트: 여명/)).toBeVisible();

        await user.click(
            within(warning).getByRole("button", {
                name: "지원되는 조건으로 검색",
            })
        );
        expect(onLoad).toHaveBeenCalledWith({
            itemName: "검",
            category: "검",
            optionFilters: { enchantName: "여명" },
        });

        onLoad.mockClear();
        await user.click(
            within(presetItem("정상")).getByRole("button", {
                name: "불러오기",
            })
        );
        expect(onLoad).toHaveBeenCalledWith({
            itemName: "검",
            category: "검",
            optionFilters: { enchantName: "여명" },
        });
    });
});
