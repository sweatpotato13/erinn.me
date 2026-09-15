import { render } from "@testing-library/react";

import OptionRenderer from "..";

it("renders plain reforge levels without an empty effect marker", () => {
    const { container } = render(
        <OptionRenderer
            options={[
                {
                    option_type: "세공 옵션",
                    option_value: "볼트 대미지 25 레벨",
                },
            ]}
        />
    );
    expect(container).toHaveTextContent("볼트 대미지");
    expect(container).toHaveTextContent("25");
    expect(container).not.toHaveTextContent("ㄴ");
});
