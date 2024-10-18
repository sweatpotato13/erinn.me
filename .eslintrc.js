module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2018,
        project: "tsconfig.json",
        sourceType: "module",
    },
    plugins: [
        "@typescript-eslint/eslint-plugin",
        "security",
        "simple-import-sort",
    ],
    extends: [
        "next/core-web-vitals",
        "plugin:security/recommended-legacy",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
    ],
    globals: {
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
    },
    root: true,
    env: {
        node: true,
        jest: true,
    },
    rules: {
        "@typescript-eslint/interface-name-prefix": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-empty-function": "off",
        "simple-import-sort/imports": "error",
        "simple-import-sort/exports": "error",
        semi: "error",
    },
    settings: {
        "import/resolver": {
            node: { extensions: [".js", ".jsx", ".ts", ".tsx"] },
        },
    },
};
