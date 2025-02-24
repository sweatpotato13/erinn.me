"use client";

import { useEffect, useState } from "react";
import { object, string } from "yup";

import { EmailData } from "@/services/mail.service";

const bodySchema = object({
    name: string()
        .min(2, "닉네임은 최소 2글자 이상이어야 합니다.")
        .required("닉네임을 입력해주세요."),
    from: string()
        .email("유효한 이메일 주소를 입력해주세요.")
        .required("이메일을 입력해주세요."),
    subject: string()
        .min(3, "제목은 최소 3글자 이상이어야 합니다.")
        .required("제목을 입력해주세요."),
    message: string()
        .min(10, "메시지는 최소 10글자 이상이어야 합니다.")
        .required("메시지를 입력해주세요."),
});

export default function ContactPage() {
    const [formData, setFormData] = useState<EmailData>({
        name: "",
        from: "",
        subject: "",
        message: "",
    });
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "error">("success");
    const [loading, setLoading] = useState(false);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    async function handleSubmit() {
        try {
            await bodySchema.validate(formData);
        } catch (validationError: any) {
            setToastMessage(validationError.message);
            setToastType("error");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            await res.json();
            setToastMessage("문의가 성공적으로 전송되었습니다.");
            setToastType("success");
            setFormData({ name: "", from: "", subject: "", message: "" });
        } catch (error: any) {
            setToastMessage(
                "문의 전송 중 오류가 발생했습니다: " + error.message
            );
            setToastType("error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage("");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
            <div className="card w-full max-w-lg bg-white shadow-xl p-6">
                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">닉네임</span>
                    </label>
                    <input
                        type="text"
                        placeholder="닉네임을 입력하세요"
                        className="input input-bordered w-full"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">이메일</span>
                    </label>
                    <input
                        type="email"
                        placeholder="이메일을 입력하세요"
                        className="input input-bordered w-full"
                        name="from"
                        value={formData.from}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">제목</span>
                    </label>
                    <input
                        type="text"
                        placeholder="제목을 입력하세요"
                        className="input input-bordered w-full"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">메시지</span>
                    </label>
                    <textarea
                        placeholder="메시지를 입력하세요"
                        className="textarea textarea-bordered w-full"
                        name="message"
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-control flex items-center justify-center">
                    {loading ? (
                        <span className="loading loading-spinner loading-md"></span>
                    ) : (
                        <button
                            className="btn bg-base-90 w-full"
                            onClick={() => {
                                handleSubmit().catch(error => {
                                    console.error(error);
                                });
                            }}
                        >
                            전송
                        </button>
                    )}
                </div>

                {toastMessage && (
                    <div className={`toast toast-end`}>
                        <div
                            className={
                                toastType === "error"
                                    ? `alert alert-error`
                                    : `alert alert-success`
                            }
                        >
                            <p>{toastMessage}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
