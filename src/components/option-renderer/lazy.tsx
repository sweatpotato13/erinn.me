"use client";

import dynamic from "next/dynamic";

const OptionRenderer = dynamic(() => import("./index"), { ssr: false });

export default OptionRenderer;
