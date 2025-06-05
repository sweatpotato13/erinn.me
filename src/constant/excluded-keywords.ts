/**
 * 경매장 검색 자동완성에서 제외할 아이템 키워드들
 * 이 키워드들이 포함된 아이템은 자동완성 목록에 표시되지 않습니다.
 */
export const EXCLUDED_ITEM_KEYWORDS = ["not found key", "itemdb"] as const;

/**
 * 아이템명에 제외 키워드가 포함되어 있는지 확인하는 함수
 * @param itemName 확인할 아이템명
 * @returns 제외 키워드가 포함되어 있으면 true, 아니면 false
 */
export function hasExcludedKeyword(itemName: string): boolean {
    const itemNameLower = itemName.toLowerCase();
    return EXCLUDED_ITEM_KEYWORDS.some(keyword =>
        itemNameLower.includes(keyword.toLowerCase())
    );
}
