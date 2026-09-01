"use client";

interface CalculatorErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function CalculatorError({ reset }: CalculatorErrorProps) {
    return (
        <main className="mx-auto min-h-screen w-full max-w-3xl p-6">
            <section className="rounded-xl border border-error/40 bg-error/5 p-6 text-center">
                <h1 className="text-2xl font-bold">
                    파티 분배 계산기를 불러오지 못했습니다.
                </h1>
                <p className="mt-2 text-base-content/70">
                    일시적인 오류일 수 있습니다. 잠시 후 다시 시도해주세요.
                </p>
                <button
                    type="button"
                    className="btn btn-primary mt-5"
                    onClick={reset}
                >
                    다시 시도
                </button>
            </section>
        </main>
    );
}
