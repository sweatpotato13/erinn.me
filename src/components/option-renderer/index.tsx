import React from "react";

import { ENCHANT_OPTIONS } from "../../constant/enchants";

interface OptionProps {
    option_type: string;
    option_sub_type?: string | null;
    option_value: string;
    option_value2?: string | null;
    option_desc?: string | null;
}

function OptionRenderer(option: OptionProps) {
    switch (option.option_type) {
        case "공격":
        case "부상률":
            return (
                <div>
                    <strong>{option.option_type}: </strong>
                    {option.option_value} ~ {option.option_value2}
                </div>
            );
        case "내구력":
        case "일반 개조":
            return (
                <div>
                    <strong>{option.option_type}: </strong>
                    {option.option_value} / {option.option_value2}
                </div>
            );
        case "아이템 색상": {
            const rgbValue = `rgb(${option.option_value})`;

            return (
                <div>
                    <strong>
                        {option.option_type} {"("}
                        {option.option_sub_type} {")"} :{" "}
                    </strong>
                    {option.option_value}
                    <div
                        style={{
                            display: "inline-block",
                            width: "20px",
                            height: "20px",
                            backgroundColor: rgbValue,
                            border: "1px solid black",
                            marginLeft: "10px",
                            verticalAlign: "middle",
                        }}
                    />
                </div>
            );
        }
        case "인챈트": {
            const enchantName = option.option_value?.split("(")[0].trim() || "";
            const enchantInfo = enchantName
                ? ENCHANT_OPTIONS[enchantName]
                : undefined;

            console.log("enchantName:", enchantName);
            console.log("enchantInfo:", enchantInfo);

            return (
                <div>
                    <strong>
                        {option.option_type} ({option.option_sub_type}) :{" "}
                    </strong>
                    {option.option_value}
                    <br />
                    {"("}
                    {option.option_desc
                        ?.split(",")
                        .map((stat, index, array) => {
                            const matches = stat.match(
                                /(.+?) (\d+%?|[\d.]+) (증가|감소)/
                            );
                            if (matches) {
                                const [, statType, valueStr, changeType] =
                                    matches;
                                const value = valueStr.includes("%")
                                    ? valueStr
                                    : parseInt(valueStr);

                                const enchantStat = enchantInfo?.stats.find(
                                    s => s.type === statType.trim()
                                );
                                const difference =
                                    enchantStat?.min && enchantStat?.max
                                        ? parseInt(valueStr) - enchantStat.max
                                        : null;

                                return (
                                    <span key={index}>
                                        {statType} {value} {changeType}
                                        {difference !== null && (
                                            <span
                                                className={`ml-1 ${
                                                    difference === 0
                                                        ? "text-blue-500"
                                                        : difference < 0
                                                          ? "text-red-500"
                                                          : ""
                                                }`}
                                            >
                                                ({difference})
                                            </span>
                                        )}
                                        {index < array.length - 1 ? "," : ""}
                                    </span>
                                );
                            }
                            return stat;
                        })}
                    {")"}
                </div>
            );
        }
        case "특별 개조":
            return (
                <div>
                    <strong>{option.option_type} : </strong>
                    {option.option_sub_type} {option.option_value}
                    {"단계"}
                </div>
            );
        case "에르그":
            return (
                <div>
                    <strong>{option.option_type} : </strong>
                    {option.option_sub_type} {"등급"} {"/"} {"레벨"}{" "}
                    {option.option_value}
                </div>
            );
        case "세트 효과":
            return (
                <div>
                    <strong>{option.option_type} : </strong>
                    {option.option_value} {option.option_value2}
                </div>
            );
        case "피어싱 레벨":
            return (
                <div>
                    <strong>{option.option_type} : </strong>
                    {option.option_value}
                    {option.option_value2}
                </div>
            );
        default:
            return (
                <div>
                    <strong>{option.option_type}: </strong>
                    {option.option_value}
                </div>
            );
    }
}

export default OptionRenderer;
