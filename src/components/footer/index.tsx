import Link from "next/link";
import React from "react";

function Footer() {
    return (
        <footer className="footer footer-center p-2 py-4 bg-base-200 text-base-content">
            <div className="flex flex-row">
                <Link href="/contact">
                    <p className="text-sm">문의하기</p>
                </Link>
                <Link href="/changelog">
                    <p className="text-sm">업데이트 내역</p>
                </Link>
            </div>
            <div>
                <p>Copyright © 2024 Erinn.me. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;
