// Shared utility classes keep both in-game windows visually consistent.
const gameButton =
    "btn h-auto min-h-[46px] gap-2 rounded border border-[#286573] bg-linear-to-b from-[#169faf] to-[#087e93] p-2.5 text-[15px] font-semibold text-white shadow-[inset_0_0_0_1px_#ffffff60] enabled:hover:brightness-110";
const styles = {
    calculator:
        "text-slate-700 [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-45 [&_button:focus-visible]:outline-3 [&_button:focus-visible]:outline-sky-700 [&_button:focus-visible]:outline-offset-3 [&_summary:focus-visible]:outline-3 [&_summary:focus-visible]:outline-sky-700 [&_summary:focus-visible]:outline-offset-3 [&_summary]:min-h-7 [&_summary]:cursor-pointer [&_summary]:content-center",
    workspace:
        "grid grid-cols-1 items-start gap-1 min-[701px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] min-[701px]:gap-8",
    window: "card block min-w-0 rounded-lg border-3 border-double border-[#84979e] bg-linear-[140deg,#e7eff0,#c4d4d9_55%,#dee8e9] px-3 py-4 text-[#35474f] shadow-[inset_0_0_0_4px_#ffffff60,0_8px_24px_#1e334218] min-[701px]:p-[18px]",
    windowTitle: "text-center text-xl font-semibold tracking-wider",
    hint: "mx-auto mt-1.5 mb-2.5 max-w-80 text-center text-xs leading-[1.7] break-keep text-[#53656e]",
    stoneSettings: "border-b border-[#8b9fa64d] pb-3.5",
    colors: "grid grid-cols-5 gap-1 [&_button]:flex [&_button]:min-w-0 [&_button]:cursor-pointer [&_button]:flex-col [&_button]:items-center [&_button]:gap-1 [&_button]:rounded-[5px] [&_button]:border [&_button]:border-transparent [&_button]:px-0.5 [&_button]:py-1.5 [&_button]:text-xs [&_button[aria-pressed=true]]:border-[#66828b] [&_button[aria-pressed=true]]:bg-[#ffffffb3] [&_button[aria-pressed=true]]:shadow-[inset_0_0_0_1px_white]",
    materials:
        "mt-3 mb-2.5 flex items-center justify-center gap-[22px] text-center text-xs [&_p]:mt-2",
    slot: "grid size-[86px] place-items-center rounded-full border-5 border-double border-[#736c81] bg-radial-[at_35%_25%] from-white to-[#d6dee0] shadow-[0_2px_3px_#32404a40,inset_0_0_0_3px_#faf7ec]",
    agentSlot:
        "from-[#645a75]! to-[#2c2835]! shadow-[0_2px_3px_#32404a40,inset_0_0_0_3px_#bcb1c4]!",
    plus: "pb-6 text-4xl font-bold text-[#5a5768]",
    agentSelect: "mb-3 block",
    result: "border border-[#6396a0] bg-[#edf5f5b3] text-center [&_h3]:bg-[#119cad] [&_h3]:px-2.5 [&_h3]:py-[7px] [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:text-white",
    ability:
        "flex min-h-[94px] flex-col justify-center gap-[7px] p-3 text-[13px] wrap-anywhere [&_strong]:text-[#985a00]",
    abilityName: "font-semibold text-[#0067bd] [&_span]:whitespace-nowrap",
    effect: "text-xs text-[#0067bd]",
    empty: "text-[#657983]",
    gameNotice:
        "mt-1 grid gap-[5px] border border-[#6a7d83] bg-[#34454d] p-3 text-xs text-[#e1ecef] [&_strong]:text-[#ffde78] [&_p+p]:text-[#b7e9bd]",
    actions: "mt-2 grid grid-cols-2 gap-2",
    gameButton,
    autoButton: `${gameButton} mt-1 w-full`,
    existing: "border-t border-[#8b9fa64d] pt-3 text-[13px]",
    targetPanel:
        "grid min-w-0 gap-4 px-1 pt-6 pb-2 min-[701px]:px-0 min-[701px]:pb-6 [&_h2]:text-lg [&_h2]:font-bold [&>p]:-mt-2",
    status: "text-center text-sm font-semibold text-[#087386] empty:hidden",
    usage: "mt-1 border-t border-slate-200 pt-[18px] [&_h3]:text-sm [&_h3]:font-semibold",
    counts: "my-[18px] grid grid-cols-3 gap-2 [&_dt]:text-xs [&_dt]:text-slate-500 [&_dd]:mt-1 [&_dd]:text-[22px] [&_dd]:font-semibold [&_dd]:wrap-anywhere [&_small]:ml-1 [&_small]:text-xs [&_small]:font-normal",
    total: "text-xs wrap-anywhere text-slate-500",
    history: "border-t border-slate-200 pt-3.5 text-[13px]",
    costSettings:
        "card mt-6 block rounded-md border border-slate-200 bg-white p-3.5 text-sm min-[701px]:px-5 min-[701px]:py-[18px]",
    modeSwitch:
        "mb-[18px] flex w-fit gap-1 rounded-md bg-[#e7edef] p-1 [&_button]:min-h-10 [&_button]:cursor-pointer [&_button]:rounded [&_button]:px-7 [&_button]:py-2 [&_button]:text-sm [&_button[aria-pressed=true]]:bg-white [&_button[aria-pressed=true]]:font-semibold [&_button[aria-pressed=true]]:text-[#087386] [&_button[aria-pressed=true]]:shadow-[0_1px_3px_#33415520]",
    gain: "text-xs text-[#087386]",
    upgradeStatus: "mt-3 min-h-6 text-center text-[13px] text-[#087386]",
    upgradeAbility:
        "[&_.echo-stat]:text-[21px] [&_.echo-gain]:ml-2.5 [&_.echo-gain]:text-[13px] [&_.echo-gain]:font-normal",
};
export default styles;
