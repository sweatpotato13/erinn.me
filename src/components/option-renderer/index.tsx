import React from "react";

import { parseReforgeOptionValue } from "@/lib/auction-options";
import {
    compareEnchantEffect,
    enchantDescriptionLines,
} from "@/lib/enchant-effects";
import { findEnchantReference } from "@/lib/enchant-reference";
import type { ItemOption } from "@/types/item-option";

interface OptionRendererProps {
    options: ItemOption[];
}

function OptionSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="border border-gray-700 bg-black/50 p-2 mb-2">
            <div className="text-yellow-400 font-bold mb-1">{title}</div>
            <div className="space-y-0.5">{children}</div>
        </div>
    );
}

interface ItemStatLineProps {
    stat: ItemOption;
}

function ItemStatLine({ stat }: ItemStatLineProps) {
    const value = stat.option_value;
    const secondValue = stat.option_value2;
    const separator =
        stat.option_type === "내구력"
            ? "/"
            : ["공격", "부상률"].includes(stat.option_type)
              ? "~"
              : null;
    if (separator && value) {
        return (
            <div className="text-white">
                {stat.option_type} {value}
                {secondValue ? `${separator}${secondValue}` : ""}
            </div>
        );
    }
    if (["크리티컬", "밸런스"].includes(stat.option_type) && value)
        return (
            <div className="text-white">
                {stat.option_type} {value}
            </div>
        );
    if (stat.option_type === "아이템 보호" && value)
        return <div className="text-blue-400">{value} 보호</div>;
    if (stat.option_type === "피어싱 레벨" && value)
        return (
            <div className="text-white">
                피어싱 레벨 {value}
                {secondValue ?? ""}
            </div>
        );
    if (stat.option_type === "남은 전용 해제 가능 횟수" && value)
        return (
            <div className="text-[#FFD700]">
                남은 전용 해제 기능 횟수: {value}
            </div>
        );
    if (stat.option_type === "전용 해제 거래 보증서 사용 불가")
        return (
            <div className="text-red-400">전용 해제 거래 보증서 사용 불가</div>
        );
    return null;
}

function EnchantReferenceDetails({
    info,
    expanded = false,
}: {
    info: ReturnType<typeof findEnchantReference>;
    expanded?: boolean;
}) {
    if (!info)
        return (
            <div className="text-gray-400 text-xs">
                인챈트 기준 정보를 확인할 수 없습니다.
            </div>
        );
    return (
        <div className="text-xs mt-1" data-enchant-id={info.id}>
            <div className="text-gray-300">
                {
                    (
                        {
                            0: "접두",
                            1: "접미",
                            11: "유물 접두",
                            12: "유물 접미",
                        } as Record<number, string>
                    )[info.usage]
                }{" "}
                · {info.rank ? `${info.rank} 랭크` : "랭크 정보 없음"}
            </div>
            <details open={expanded}>
                <summary className="cursor-pointer text-gray-300">
                    참고 효과 · 조건이 있는 효과는 조건 충족 시 적용
                </summary>
                <div className="pl-2 text-blue-300">
                    {info.description
                        ? enchantDescriptionLines(info.description).map(
                              (line, index) => <div key={index}>{line}</div>
                          )
                        : "효과 설명을 확인할 수 없습니다."}
                </div>
            </details>
        </div>
    );
}

function OptionRenderer({ options }: OptionRendererProps) {
    // 옵션들을 타입별로 그룹화
    const itemStats = options.filter(opt =>
        [
            "공격",
            "부상률",
            "크리티컬",
            "밸런스",
            "내구력",
            "아이템 보호",
            "남은 전용 해제 가능 횟수",
            "피어싱 레벨",
            "전용 해제 거래 보증서 사용 불가",
        ].includes(opt.option_type)
    );
    const relicOptions = options.filter(opt =>
        ["무리아스 유물"].includes(opt.option_type)
    );
    const enchants = options.filter(opt => opt.option_type === "인챈트");
    const upgrades = options.filter(opt =>
        ["일반 개조", "보석 개조", "특별 개조"].includes(opt.option_type)
    );
    const magics = options.filter(opt =>
        ["세공 랭크", "세공 옵션"].includes(opt.option_type)
    );
    const ergs = options.filter(opt => opt.option_type === "에르그");
    const sets = options.filter(opt => opt.option_type === "세트 효과");
    const colors = options.filter(
        (opt): opt is ItemOption & { option_value: string } =>
            opt.option_type === "아이템 색상" && Boolean(opt.option_value)
    );
    const petInfo = options.filter(opt => opt.option_type === "펫 정보");
    const enchantScrollInfo = options.filter(opt =>
        ["내구도", "인챈트 종류", "남은 거래 횟수"].includes(opt.option_type)
    );

    const knownTypes = new Set([
        "공격",
        "부상률",
        "크리티컬",
        "밸런스",
        "내구력",
        "아이템 보호",
        "남은 전용 해제 가능 횟수",
        "피어싱 레벨",
        "전용 해제 거래 보증서 사용 불가",
        "무리아스 유물",
        "인챈트",
        "일반 개조",
        "보석 개조",
        "특별 개조",
        "세공 랭크",
        "세공 옵션",
        "에르그",
        "세트 효과",
        "아이템 색상",
        "펫 정보",
        "내구도",
        "인챈트 종류",
        "남은 거래 횟수",
    ]);
    const otherOptions = options.filter(
        opt => !knownTypes.has(opt.option_type)
    );

    return (
        <div className="text-sm">
            {/* 아이템 속성 섹션 */}
            {itemStats.length > 0 && (
                <OptionSection title="아이템 속성">
                    {itemStats.map((stat, index) => (
                        <ItemStatLine
                            key={`stat-${stat.option_type}-${stat.option_value}-${stat.option_value2}-${index}`}
                            stat={stat}
                        />
                    ))}
                </OptionSection>
            )}

            {/* 유물 옵션 섹션 */}
            {relicOptions.length > 0 && (
                <OptionSection title="유물 효과">
                    {relicOptions.map((opt, index) => (
                        <div key={`relic-${index}`} className="text-purple-300">
                            • {opt.option_value}
                        </div>
                    ))}
                </OptionSection>
            )}

            {/* 인챈트 섹션 */}
            {enchants.length > 0 && (
                <OptionSection title="인챈트">
                    {enchants.map((enchant, index) => {
                        const enchantInfo = findEnchantReference(
                            enchant.option_value,
                            enchant.option_sub_type
                        );

                        return (
                            <div
                                key={`enchant-${enchant.option_sub_type}-${enchant.option_value}-${index}`}
                            >
                                {/* 인챈트 타이틀 */}
                                <div className="text-blue-400">
                                    {enchant.option_type} (
                                    {enchant.option_sub_type}) :{" "}
                                    {enchant.option_value}
                                </div>
                                {/* 인챈트 효과들 */}
                                <div className="pl-4">
                                    {enchant.option_desc
                                        ?.split(",")
                                        .map((stat, statIndex) => {
                                            const comparison = enchantInfo
                                                ? compareEnchantEffect(
                                                      stat,
                                                      enchantInfo.description
                                                  )
                                                : null;
                                            return (
                                                <div
                                                    key={`enchant-stat-${statIndex}`}
                                                    className="text-blue-300"
                                                >
                                                    • {stat}
                                                    {comparison && (
                                                        <span
                                                            className={
                                                                comparison.outsideRange ||
                                                                comparison.difference <
                                                                    0
                                                                    ? "ml-1 text-red-400"
                                                                    : "ml-1 text-yellow-300"
                                                            }
                                                            title={
                                                                comparison.referenceText
                                                            }
                                                        >
                                                            (
                                                            {comparison.outsideRange
                                                                ? "기준 범위 밖"
                                                                : `최대치${comparison.difference === 0 ? "" : ` ${comparison.difference}${comparison.unit}`}`}
                                                            )
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    <EnchantReferenceDetails
                                        info={enchantInfo}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </OptionSection>
            )}

            {/* 개조 섹션 */}
            {upgrades.length > 0 && (
                <OptionSection title="개조">
                    {/* 일반 개조 */}
                    {upgrades.find(u => u.option_type === "일반 개조") && (
                        <div className="text-white">
                            일반 개조
                            <div className="pl-4">
                                •{" "}
                                {
                                    upgrades.find(
                                        u => u.option_type === "일반 개조"
                                    )?.option_value
                                }
                                /
                                {
                                    upgrades.find(
                                        u => u.option_type === "일반 개조"
                                    )?.option_value2
                                }
                            </div>
                        </div>
                    )}
                    {/* 보석 개조 */}
                    {upgrades.find(u => u.option_type === "보석 개조") && (
                        <div className="text-white">
                            보석 개조
                            <div className="pl-4">
                                •{" "}
                                {
                                    upgrades.find(
                                        u => u.option_type === "보석 개조"
                                    )?.option_value
                                }
                            </div>
                        </div>
                    )}
                    {/* 특별 개조 */}
                    {upgrades.find(u => u.option_type === "특별 개조") && (
                        <div className="text-white">
                            특별 개조
                            <div className="pl-4">
                                •{" "}
                                {
                                    upgrades.find(
                                        u => u.option_type === "특별 개조"
                                    )?.option_sub_type
                                }
                                {
                                    upgrades.find(
                                        u => u.option_type === "특별 개조"
                                    )?.option_value
                                }{" "}
                                단계
                            </div>
                        </div>
                    )}
                </OptionSection>
            )}

            {/* 세공 섹션 */}
            {magics.length > 0 && (
                <OptionSection title="세공">
                    {/* 세공 랭크 */}
                    {magics.find(m => m.option_type === "세공 랭크") && (
                        <div className="text-blue-400">
                            <span
                                className={
                                    magics.find(
                                        m => m.option_type === "세공 랭크"
                                    )?.option_value === "1"
                                        ? "text-[#A13568]"
                                        : magics.find(
                                                m =>
                                                    m.option_type ===
                                                    "세공 랭크"
                                            )?.option_value === "2"
                                          ? "text-yellow-400"
                                          : magics.find(
                                                  m =>
                                                      m.option_type ===
                                                      "세공 랭크"
                                              )?.option_value === "3"
                                            ? "text-white"
                                            : "text-blue-400"
                                }
                            >
                                랭크{" "}
                                {
                                    magics.find(
                                        m => m.option_type === "세공 랭크"
                                    )?.option_value
                                }
                            </span>
                        </div>
                    )}
                    {/* 세공 옵션들 */}
                    {magics
                        .filter(m => m.option_type === "세공 옵션")
                        .sort(
                            (a, b) =>
                                Number(a.option_sub_type) -
                                Number(b.option_sub_type)
                        )
                        .map((option, index) => {
                            const parsed = parseReforgeOptionValue(
                                option.option_value
                            );

                            if (parsed) {
                                return (
                                    <div
                                        key={`magic-${option.option_sub_type}-${index}`}
                                    >
                                        <div className="text-blue-400">
                                            • {parsed.name}({parsed.level}레벨)
                                        </div>
                                        <div className="pl-6 text-white">
                                            ㄴ {parsed.effect}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={`magic-${option.option_sub_type}-${index}`}
                                    className="text-blue-400"
                                >
                                    • {option.option_value}
                                </div>
                            );
                        })}
                </OptionSection>
            )}

            {/* 에르그 섹션 */}
            {ergs.length > 0 && (
                <OptionSection title="에르그">
                    {ergs.map((erg, index) => (
                        <div
                            key={`erg-${erg.option_sub_type}-${index}`}
                            className="text-blue-400"
                        >
                            {erg.option_sub_type} 등급 / 레벨 {erg.option_value}
                        </div>
                    ))}
                </OptionSection>
            )}

            {/* 세트 효과 섹션 */}
            {sets.length > 0 && (
                <OptionSection title="세트 효과">
                    {sets.map((set, index) => (
                        <div key={`set-${index}`} className="text-blue-400">
                            • {set.option_value} {set.option_value2}
                        </div>
                    ))}
                </OptionSection>
            )}

            {/* 인챈트 스크롤 정보 섹션 */}
            {enchantScrollInfo.length > 0 && (
                <OptionSection title="인챈트 스크롤 정보">
                    {enchantScrollInfo.map((scrollInfo, index) => {
                        const enchantInfo =
                            scrollInfo.option_type === "인챈트 종류"
                                ? findEnchantReference(
                                      scrollInfo.option_value,
                                      scrollInfo.option_sub_type
                                  )
                                : null;

                        return (
                            <div
                                key={`scroll-${scrollInfo.option_type}-${index}`}
                                className="text-white"
                            >
                                {scrollInfo.option_type === "내구도" && (
                                    <div>
                                        • 내구도: {scrollInfo.option_value}
                                    </div>
                                )}
                                {scrollInfo.option_type === "인챈트 종류" && (
                                    <div>
                                        <div className="text-blue-400">
                                            • 인챈트: {scrollInfo.option_value}{" "}
                                            ({scrollInfo.option_sub_type})
                                        </div>
                                        <EnchantReferenceDetails
                                            info={enchantInfo}
                                            expanded
                                        />
                                    </div>
                                )}
                                {scrollInfo.option_type ===
                                    "남은 거래 횟수" && (
                                    <div className="text-yellow-400">
                                        • 남은 거래 횟수:{" "}
                                        {scrollInfo.option_value}회
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </OptionSection>
            )}

            {/* 펫 정보 섹션 */}
            {petInfo.length > 0 && (
                <OptionSection title="펫 정보">
                    {petInfo.map((pet, index) => (
                        <div
                            key={`pet-${pet.option_sub_type}-${index}`}
                            className="text-white"
                        >
                            • {pet.option_sub_type}: {pet.option_value}
                        </div>
                    ))}
                </OptionSection>
            )}

            {/* 아이템 색상 섹션 */}
            {colors.length > 0 && (
                <OptionSection title="아이템 색상">
                    {colors.map((color, index) => {
                        const rgbValue = `rgb(${color.option_value})`;
                        return (
                            <div
                                key={`color-${index}`}
                                className="text-white flex items-center"
                            >
                                • {color.option_sub_type} ({color.option_value})
                                <div
                                    className="inline-block ml-2 w-4 h-4 border border-gray-400"
                                    style={{ backgroundColor: rgbValue }}
                                />
                            </div>
                        );
                    })}
                </OptionSection>
            )}

            {/* 기타 옵션 섹션 */}
            {otherOptions.length > 0 && (
                <OptionSection title="기타 정보">
                    {otherOptions.map((opt, index) => (
                        <div
                            key={`other-${opt.option_type}-${index}`}
                            className="text-white"
                        >
                            <span className="text-gray-300">
                                {opt.option_type}
                            </span>
                            {opt.option_value &&
                                opt.option_value !== "true" && (
                                    <div className="pl-4 text-blue-300">
                                        • {opt.option_value}
                                    </div>
                                )}
                        </div>
                    ))}
                </OptionSection>
            )}
        </div>
    );
}

export default OptionRenderer;
