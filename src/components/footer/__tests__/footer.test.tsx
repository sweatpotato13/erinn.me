import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import Footer from "..";

const FIXED_DATE = new Date("2026-01-01T00:00:00.000Z");
const EXPECTED_YEAR = FIXED_DATE.getFullYear();

// Test suite for Footer component
describe("Footer Component", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(FIXED_DATE);
        render(<Footer />);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // Test if Footer component renders correctly
    test("Footer should render correctly", () => {
        // Check if contact link exists
        const contactLink = screen.getByText("문의하기");
        expect(contactLink).toBeInTheDocument();

        // Check if changelog link exists
        const changelogLink = screen.getByText("업데이트 내역");
        expect(changelogLink).toBeInTheDocument();

        // Check if copyright text matches the fixed system date
        const copyrightText = screen.getByText(
            `Copyright © ${EXPECTED_YEAR} Erinn.me. All rights reserved.`
        );
        expect(copyrightText).toBeInTheDocument();
    });

    // Test if links have correct href attributes
    test("Links should have correct href attributes", () => {
        // Check contact link href attribute
        const contactLink = screen.getByText("문의하기").closest("a");
        expect(contactLink).toHaveAttribute("href", "/contact");

        // Check changelog link href attribute
        const changelogLink = screen.getByText("업데이트 내역").closest("a");
        expect(changelogLink).toHaveAttribute("href", "/changelog");
    });
});
