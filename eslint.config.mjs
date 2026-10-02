import { FlatCompat } from "@eslint/eslintrc";
import eslintJs from "@eslint/js";
import nextConfig from "eslint-config-next";
import pluginSecurity from "eslint-plugin-security";
import simpleImportSortPlugin from "eslint-plugin-simple-import-sort";
import globals from "globals";
import path from "path";
import eslintTs from "typescript-eslint";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: eslintJs.configs.recommended
});
const next = nextConfig.find(config => config.name === "next");

export default eslintTs.config(
    eslintJs.configs.recommended,
    {
        plugins: next.plugins,
        settings: next.settings,
        rules: {
            ...next.plugins["@next/next"].configs.recommended.rules,
            // Keep the established Hooks checks without opting into React Compiler rules.
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
        },
    },
    pluginSecurity.configs.recommended,
    ...eslintTs.configs.recommendedTypeChecked,
    ...compat.extends(
        "prettier"
    ),
    {
        ignores: ["**/types.d.ts", "**/*.js", "**/node_modules/"]
    },
    {
        languageOptions: {
            globals: {
                ...globals.es2020,
                ...globals.node,
                Atomics: "readonly",
                SharedArrayBuffer: "readonly"
            },
            parserOptions: {
                project: "tsconfig.json"
            }
        },
        settings: {
            "import/resolver": {
                node: {
                    extensions: [".js", ".jsx", ".ts", ".tsx"]
                }
            }
        },

        plugins: {
            "@typescript-eslint": tseslint.plugin,
            "simple-import-sort": simpleImportSortPlugin,
        },
        rules: {
            // Syntax-only indexing warnings flag typed records and arrays throughout this app.
            "security/detect-object-injection": "off",
            "no-empty-pattern": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
            semi: "error"
        }
    }
);
