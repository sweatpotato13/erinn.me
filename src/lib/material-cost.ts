export function parseMaterialInteger(value: string): number | null {
    if (!/^\d{1,16}$/.test(value)) return null;
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : null;
}

export function safeMaterialInteger(value: number): number {
    if (!Number.isSafeInteger(value) || value < 0)
        throw new Error(
            "수량·금액이 안전하게 계산할 수 있는 범위를 넘었습니다."
        );
    return value;
}

export function allocateMaterialStock(required: number, owned: number) {
    safeMaterialInteger(required);
    safeMaterialInteger(owned);
    return {
        usedOwned: Math.min(required, owned),
        missing: Math.max(0, required - owned),
    };
}
