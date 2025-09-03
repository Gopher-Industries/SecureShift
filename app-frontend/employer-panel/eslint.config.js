const js = require("@eslint/js");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const jsxA11y = require("eslint-plugin-jsx-a11y");
const prettier = require("eslint-plugin-prettier");
const globals = require("globals");

module.exports = [
    {
        files: ["src/**/*.{js,jsx}"],
        ignores: ["node_modules", "build", "dist", "coverage", "public"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: { jsx: true }
            },
            globals: {
                ...globals.browser, // ✅ allows window, document, console, alert
            }
        },
        plugins: {
            react,
            "react-hooks": reactHooks,
            "jsx-a11y": jsxA11y,
            prettier
        },
        rules: {
            ...js.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...jsxA11y.configs.recommended.rules,
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
            "prettier/prettier": "error",

            // Accessibility → warnings instead of errors
            "jsx-a11y/click-events-have-key-events": "warn",
            "jsx-a11y/no-static-element-interactions": "warn",
            "jsx-a11y/label-has-associated-control": "warn",
            "jsx-a11y/anchor-is-valid": "warn"
        },
        settings: {
            react: { version: "detect" }
        }
    },
    {
        files: ["src/**/*.test.js", "src/**/*.test.jsx"], // ✅ only test files
        languageOptions: {
            globals: {
                ...globals.jest // ✅ fixes test, expect, describe, etc.
            }
        }
    }
];
