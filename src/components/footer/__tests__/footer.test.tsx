import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import React from "react";

import Footer from "..";

// Test suite for Footer component
describe("Footer Component", () => {
    // Render Footer component before each test
    beforeEach(() => {
        render(<Footer />);
    });

    // Test if Footer component renders correctly
    test("Footer should render correctly", () => {
        // Check if contact link exists
        const contactLink = screen.getByText("문의하기");
        expect(contactLink).toBeInTheDocument();

        // Check if changelog link exists
        const changelogLink = screen.getByText("업데이트 내역");
        expect(changelogLink).toBeInTheDocument();

        // Check if copyright text exists
        const copyrightText = screen.getByText(/Copyright © 2024 Erinn.me/);
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
