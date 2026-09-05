"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { FEATURE_GROUPS, FEATURE_LINKS } from "@/lib/feature-links";

function Topbar() {
    const pathname = usePathname();
    const dialog = useRef<HTMLDialogElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);
    const current = (url: string) =>
        pathname === url || pathname.startsWith(`${url}/`);
    const close = () => dialog.current?.close();
    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previous;
        };
    }, [open]);
    const links = (group: string) =>
        FEATURE_LINKS.filter(link => link.group === group).map(link => (
            <li key={link.url}>
                <Link
                    href={link.url}
                    aria-current={current(link.url) ? "page" : undefined}
                    className={`block min-h-11 rounded-lg px-3 py-3 hover:bg-slate-100 ${current(link.url) ? "bg-slate-100 font-bold text-slate-950" : "text-slate-700"}`}
                    onClick={e => {
                        const details = e.currentTarget.closest("details");
                        if (details) details.open = false;
                        close();
                    }}
                >
                    {link.label}
                </Link>
            </li>
        ));
    return (
        <header
            className="fixed top-0 left-0 z-50 flex h-[calc(4rem+env(safe-area-inset-top))] w-full items-center justify-between gap-2 bg-white px-3 pt-[env(safe-area-inset-top)] shadow-sm"
            onKeyDown={e => {
                if (e.key !== "Escape") return;
                const details = (e.target as HTMLElement).closest("details");
                if (details) {
                    details.open = false;
                    details.querySelector("summary")?.focus();
                }
            }}
        >
            <Link href="/" className="btn btn-ghost text-xl normal-case">
                Erinn.me
            </Link>
            <nav
                aria-label="카테고리 탐색"
                className="hidden items-center gap-3 xl:flex"
            >
                {FEATURE_GROUPS.map(group => (
                    <details key={group} className="relative">
                        <summary className="cursor-pointer rounded-lg px-4 py-3 font-semibold hover:bg-slate-100">
                            {group}
                        </summary>
                        <ul className="absolute top-full right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                            {links(group)}
                        </ul>
                    </details>
                ))}
            </nav>
            <button
                ref={trigger}
                className="btn btn-ghost xl:hidden"
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls="full-menu"
                onClick={() => {
                    dialog.current?.showModal();
                    setOpen(true);
                }}
            >
                전체 메뉴
            </button>
            <dialog
                id="full-menu"
                ref={dialog}
                aria-labelledby="full-menu-title"
                className="fixed inset-0 m-auto max-h-[calc(100dvh-env(safe-area-inset-top)-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-slate-900 shadow-xl backdrop:bg-black/40"
                onClose={() => {
                    setOpen(false);
                    trigger.current?.focus();
                }}
                onClick={e => {
                    if (e.target === dialog.current) {
                        const r = dialog.current.getBoundingClientRect();
                        if (
                            e.clientX < r.left ||
                            e.clientX > r.right ||
                            e.clientY < r.top ||
                            e.clientY > r.bottom
                        )
                            close();
                    }
                }}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 id="full-menu-title" className="text-xl font-bold">
                        전체 메뉴
                    </h2>
                    <button className="btn btn-ghost" onClick={close}>
                        메뉴 닫기
                    </button>
                </div>
                <nav aria-label="전체 기능">
                    {FEATURE_GROUPS.map(group => (
                        <section key={group} className="mb-4">
                            <h3 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-600">
                                {group}
                            </h3>
                            <ul>{links(group)}</ul>
                        </section>
                    ))}
                    <ul className="border-t border-slate-200 pt-2">
                        {links("도움")}
                    </ul>
                </nav>
            </dialog>
        </header>
    );
}
export default Topbar;
