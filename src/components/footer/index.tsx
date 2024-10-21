import Link from "next/link";
import React from "react";

function Footer() {
    return (
        <footer className="footer footer-center p-4 bg-base-200 text-base-content">
            <Link href="/contact">
                <p className="text-sm">문의하기</p>
            </Link>
            <div>
                <p>Copyright © 2024 Erinn.me. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;
