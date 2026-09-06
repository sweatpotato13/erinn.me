import { render, screen } from "@testing-library/react";

import ReforgePage from "../page";

let mockVersion = "1788405829";

jest.mock("@/lib/reforge-reference", () => ({
    get reforgeVersion() {
        return mockVersion;
    },
    reforgeTools: [],
}));
jest.mock("../reforge-calculator", () => ({
    __esModule: true,
    default: () => null,
}));

test.each([
    ["1788405829", "2026-09-03"],
    ["0", "1970-01-01"],
    ["8640000000001", "확인 불가"],
    ["1e20", "확인 불가"],
    ["Infinity", "확인 불가"],
    ["invalid", "확인 불가"],
])("renders source date safely for version %s", (version, expected) => {
    mockVersion = version;
    render(<ReforgePage />);
    expect(screen.getByText(/원본 기준일/)).toHaveTextContent(
        `원본 기준일 ${expected}`
    );
});
