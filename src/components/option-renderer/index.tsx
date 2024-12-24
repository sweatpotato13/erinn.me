import React from "react";

import { ENCHANT_OPTIONS } from "../../constant/enchants";

interface OptionProps {
    option_type: string;
    option_sub_type?: string | null;
    option_value: string;
    option_value2?: string | null;
    option_desc?: string | null;
}

interface OptionRendererProps {
    options: OptionProps[];
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
        ].includes(opt.option_type)
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
    const colors = options.filter(opt => opt.option_type === "아이템 색상");

    return (
        <div className="text-sm">
            {/* 아이템 속성 섹션 */}
            {itemStats.length > 0 && (
                <OptionSection title="아이템 속성">
                    {itemStats.map((stat, index) => (
                        <div
                            key={`stat-${stat.option_type}-${stat.option_value}-${stat.option_value2}-${index}`}
                            className="text-white"
                        >
                            {stat.option_type === "공격" &&
                                `공격 ${stat.option_value}~${stat.option_value2}`}
                            {stat.option_type === "부상률" &&
                                `부상률 ${stat.option_value}~${stat.option_value2}`}
                            {stat.option_type === "크리티컬" &&
                                `크리티컬 ${stat.option_value}`}
                            {stat.option_type === "밸런스" &&
                                `밸런스 ${stat.option_value}`}
                            {stat.option_type === "내구력" &&
                                `내구력 ${stat.option_value}/${stat.option_value2}`}
                            {stat.option_type === "아이템 보호" && (
                                <div className="text-blue-400">
                                    {stat.option_value} 보호
                                </div>
                            )}
                            {stat.option_type === "피어싱 레벨" &&
                                stat.option_value &&
                                (stat.option_value2
                                    ? `피어싱 레벨 ${stat.option_value}${stat.option_value2}`
                                    : `피어싱 레벨 ${stat.option_value}`)}
                            {stat.option_type ===
                                "남은 전용 해제 가능 횟수" && (
                                <div className="text-[#FFD700]">
                                    남은 전용 해제 기능 횟수:{" "}
                                    {stat.option_value}
                                </div>
                            )}
                        </div>
                    ))}
                </OptionSection>
            )}

            {/* 인챈트 섹션 */}
            {enchants.length > 0 && (
                <OptionSection title="인챈트">
                    {enchants.map((enchant, index) => {
                        const enchantName =
                            enchant.option_value?.split("(")[0].trim() || "";
                        const enchantInfo = enchantName
                            ? ENCHANT_OPTIONS[enchantName]
                            : undefined;

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
                                            const matches = stat.match(
                                                /(.+?) (\d+%?|[\d.]+) (증가|감소)/
                                            );
                                            if (matches) {
                                                const [
                                                    ,
                                                    statType,
                                                    valueStr,
                                                    changeType,
                                                ] = matches;
                                                const value = valueStr.includes(
                                                    "%"
                                                )
                                                    ? valueStr
                                                    : parseInt(valueStr);

                                                const enchantStat =
                                                    enchantInfo?.stats.find(
                                                        s =>
                                                            s.type ===
                                                            statType.trim()
                                                    );
                                                const difference =
                                                    enchantStat?.min &&
                                                    enchantStat?.max
                                                        ? parseInt(valueStr) -
                                                          enchantStat.max
                                                        : null;

                                                return (
                                                    <div
                                                        key={`enchant-stat-${statIndex}`}
                                                        className={
                                                            changeType ===
                                                            "증가"
                                                                ? "text-blue-400"
                                                                : "text-red-400"
                                                        }
                                                    >
                                                        • {statType} {value}{" "}
                                                        {changeType}
                                                        {difference !==
                                                            null && (
                                                            <span
                                                                className={`ml-1 ${
                                                                    difference ===
                                                                    0
                                                                        ? "text-black"
                                                                        : difference <
                                                                            0
                                                                          ? "text-red-400"
                                                                          : ""
                                                                }`}
                                                            >
                                                                (최대치
                                                                {difference ===
                                                                0
                                                                    ? ""
                                                                    : ` ${difference}`}
                                                                )
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div
                                                    key={`enchant-stat-${statIndex}`}
                                                    className="text-gray-300"
                                                >
                                                    • {stat}
                                                </div>
                                            );
                                        })}
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
                    {upgrades.find(u => u.option_type === "보석 개��") && (
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
                            // 레벨 정보 분리를 위한 새로운 정규식
                            const levelMatch = option.option_value.match(
                                /(.+?)\((\d+)레벨:(.+)\)/
                            );

                            if (levelMatch) {
                                const [, statName, level, effect] = levelMatch;
                                return (
                                    <div
                                        key={`magic-${option.option_sub_type}-${index}`}
                                    >
                                        <div className="text-blue-400">
                                            • {statName}({level}레벨)
                                        </div>
                                        <div className="pl-6 text-white">
                                            ㄴ {effect.trim()}
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
        </div>
    );
}

export default OptionRenderer;
