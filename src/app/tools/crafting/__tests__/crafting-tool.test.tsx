import { act, render, renderHook, screen } from "@testing-library/react";

import { useCraftingPlan } from "@/app/tools/crafting/crafting-hooks";
import { PriceEditor } from "@/app/tools/crafting/crafting-ui";
import type { CraftingReference } from "@/lib/crafting";
import { calculateCrafting } from "@/lib/crafting";
import {
    buildCraftingHandoff,
    buildCraftingShare,
    CRAFTING_STORAGE_KEY,
    emptyCraftingPlan,
    serializeCraftingStorage,
} from "@/lib/crafting-state";

const data: CraftingReference = {
    version: "test",
    sourceVersion: 1,
    ruleVersion: "test",
    collectedAt: "2026-09-10T00:00:00Z",
    items: [{ id: 1, name: "재료", searchable: true, ambiguous: false }],
    recipes: [],
    byOutput: {},
};
beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, "", "/tools/crafting");
});

test("temporary shares and barter imports never reapply saved inventory or overwrite it", () => {
    const saved = { ...emptyCraftingPlan(data), owned: { 1: "4" } };
    const raw = serializeCraftingStorage(saved);
    localStorage.setItem(CRAFTING_STORAGE_KEY, raw);
    window.history.replaceState(
        null,
        "",
        buildCraftingHandoff([{ itemId: 1, count: 6 }], 1)
    );
    const { result } = renderHook(() => useCraftingPlan(data));
    expect(result.current.plan.owned).toEqual({});
    expect(result.current.plan.targets[0].count).toBe("6");
    act(() => result.current.update(p => ({ ...p, fee: "10" })));
    expect(localStorage.getItem(CRAFTING_STORAGE_KEY)).toBe(raw);
    act(() => result.current.adopt(data));
    expect(result.current.temporary).toBe(false);
    expect(
        JSON.parse(localStorage.getItem(CRAFTING_STORAGE_KEY)!).owned
    ).toEqual({});
});

test("corruption and unavailable storage preserve user input and the original saved bytes", () => {
    localStorage.setItem(CRAFTING_STORAGE_KEY, "broken");
    const { result } = renderHook(() => useCraftingPlan(data));
    expect(result.current.backup).toBe("broken");
    act(() => result.current.update(p => ({ ...p, fee: "20" })));
    expect(result.current.plan.fee).toBe("20");
    expect(localStorage.getItem(CRAFTING_STORAGE_KEY)).toBe("broken");
    const set = jest
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
            throw new Error("quota");
        });
    act(() => result.current.adopt(data));
    expect(result.current.notice).toContain("저장하지 못했습니다");
    expect(result.current.plan.fee).toBe("20");
    set.mockRestore();
});

test("history restores the original local plan after an isolated shared draft", () => {
    const saved = { ...emptyCraftingPlan(data), fee: "50" };
    localStorage.setItem(CRAFTING_STORAGE_KEY, serializeCraftingStorage(saved));
    window.history.replaceState(
        null,
        "",
        buildCraftingShare({ ...saved, fee: "10" })
    );
    const { result } = renderHook(() => useCraftingPlan(data));
    expect(result.current.plan.fee).toBe("10");
    act(() => result.current.openSaved());
    expect(result.current.plan.fee).toBe("50");
    expect(result.current.temporary).toBe(false);
});

test("invalid price drafts remain editable without a NaN or unsafe summary amount", () => {
    const plan = {
        ...emptyCraftingPlan(data),
        targets: [{ itemId: 1, count: "1" }],
        prices: { 1: "abc" },
    };
    const node = calculateCrafting(plan, data).nodes[0];
    const { container, rerender } = render(
        <PriceEditor node={node} plan={plan} update={jest.fn()} />
    );
    expect(container.querySelector("summary")).not.toHaveTextContent("NaN");
    expect(screen.getByLabelText("재료 단가 (Gold)")).toHaveAttribute(
        "aria-invalid",
        "true"
    );
    rerender(
        <PriceEditor
            node={node}
            plan={{ ...plan, prices: { 1: "0" } }}
            update={jest.fn()}
        />
    );
    expect(container.querySelector("summary")).toHaveTextContent("개당 0 Gold");
});

test("restoring a plan immediately rejects callbacks from the previous plan", () => {
    const { result } = renderHook(() => useCraftingPlan(data));
    const staleUpdate = result.current.update;
    const saved = { ...emptyCraftingPlan(data), fee: "20" };
    localStorage.setItem(CRAFTING_STORAGE_KEY, serializeCraftingStorage(saved));
    act(() => {
        result.current.openSaved();
        staleUpdate(p => ({ ...p, fee: "999" }));
    });
    expect(result.current.plan.fee).toBe("20");
    expect(JSON.parse(localStorage.getItem(CRAFTING_STORAGE_KEY)!).fee).toBe(
        "20"
    );
    act(() => result.current.update(p => ({ ...p, fee: "30" })));
    expect(result.current.plan.fee).toBe("30");
});
