import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...compat.extends("eslint:recommended"), {
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