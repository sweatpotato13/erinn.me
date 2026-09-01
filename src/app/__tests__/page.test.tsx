import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import React from "react";

// Wrapper component for testing with Next.js app router
import Page from "../page";

// Mock necessary Next.js components using jest.mock
jest.mock("next/link", () => {
    const MockLink = ({
        children,
        href,
    }: {
        children: React.ReactNode;
        href: string;
    }) => {
        return <a href={href}>{children}</a>;
    };
    MockLink.displayName = "MockLink";
    return MockLink;
});

// Mock icon components
jest.mock("@/components/icons/auction-icon", () => {
    const MockIcon = () => <div data-testid="auction-icon" />;
    MockIcon.displayName = "MockAuctionIcon";
    return MockIcon;
});

jest.mock("@/components/icons/document-icon", () => {
    const MockIcon = () => <div data-testid="document-icon" />;
    MockIcon.displayName = "MockDocumentIcon";
    return MockIcon;
});

jest.mock("@/components/icons/horn-icon", () => {
    const MockIcon = () => <div data-testid="horn-icon" />;
    MockIcon.displayName = "MockHornIcon";
    return MockIcon;
});

jest.mock("@/components/icons/shop-icon", () => {
    const MockIcon = () => <div data-testid="shop-icon" />;
    MockIcon.displayName = "MockShopIcon";
    return MockIcon;
});

describe("Homepage Component", () => {
    beforeEach(() => {
        render(<Page />);
    });

    test("Navigation cards should render correctly", () => {
        // Check if each navigation card is rendered - using heading elements
        expect(
            screen.getByRole("heading", { name: "경매장" })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "파티 분배 계산기" })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "NPC 상점" })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "뿔피리 조회" })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "문의하기" })
        ).toBeInTheDocument();
    });

    test("Navigation links should have correct href attributes", () => {
        // Check auction link - access by heading element
        const auctionHeading = screen.getByRole("heading", { name: "경매장" });
        const auctionLink = auctionHeading.closest("a");
        expect(auctionLink).toHaveAttribute("href", "/auction");

        const calculatorHeading = screen.getByRole("heading", {
            name: "파티 분배 계산기",
        });
        expect(calculatorHeading.closest("a")).toHaveAttribute(
            "href",
            "/calculator"
        );

        // Check shop link
        const shopHeading = screen.getByRole("heading", { name: "NPC 상점" });
        const shopLink = shopHeading.closest("a");
        expect(shopLink).toHaveAttribute("href", "/npc-shop");

        // Check horn link
        const hornHeading = screen.getByRole("heading", {
            name: "뿔피리 조회",
        });
        const hornLink = hornHeading.closest("a");
        expect(hornLink).toHaveAttribute("href", "/horn");

        const contactHeading = screen.getByRole("heading", {
            name: "문의하기",
        });
        expect(contactHeading.closest("a")).toHaveAttribute("href", "/contact");
    });

    test("Retired feature links should not render", () => {
        expect(document.querySelector('a[href="/dungeon"]')).toBeNull();
        expect(document.querySelector('a[href="/crafting"]')).toBeNull();
    });
});
