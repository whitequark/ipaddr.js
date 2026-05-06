import globals from "globals";
import js from "@eslint/js";

export default [js.configs.recommended, {
    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.mocha,
        },
    },

    rules: {
        "no-var": "error",
        "no-cond-assign": ["error", "except-parens"],

        "no-trailing-spaces": ["error", {
            skipBlankLines: false,
        }],

        "no-empty": ["error", {
            allowEmptyCatch: true,
        }],

        "no-shadow": "error",
        "prefer-template": "warn",
        "no-unused-vars": "warn",
    },
}];
