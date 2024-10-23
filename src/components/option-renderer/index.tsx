import React from "react";

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
        case "아이템 색상":
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
        case "인챈트":
            return (
                <div>
                    <strong>
                        {option.option_type} {"("} {option.option_sub_type}{" "}
                        {")"} :{" "}
                    </strong>
                    {option.option_value}
                    <br />
                    {"("} {option.option_desc}
                    {")"}
                </div>
            );
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
                    {option.option_value} {option.option_sub_type}
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
