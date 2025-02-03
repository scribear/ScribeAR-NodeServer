import js from "@eslint/js";
import path from "node:path";
import tsParser from "@typescript-eslint/parser";
import typescriptEslint from "@typescript-eslint/eslint-plugin"
import {FlatCompat} from "@eslint/eslintrc";
import {fileURLToPath} from "node:url";
import {fixupConfigRules, fixupPluginRules} from "@eslint/compat";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: [
        ".prettierrc.cjs",
        "eslint.config.mjs",
        "vite.config.ts",
        "coverage/",
        "build/",
        "drizzle.config.ts",
    ],
},
...fixupConfigRules(compat.extends("plugin:@typescript-eslint/recommended", "./node_modules/gts/")),
{
    plugins: {
        "@typescript-eslint": fixupPluginRules(typescriptEslint),
    },

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "script",

        parserOptions: {
            project: true,
        },
    },

    rules: {
        "no-throw-literal": "error",
        "no-empty-pattern": "off",
        "@typescript-eslint/only-throw-error": "error",
        "@typescript-eslint/no-unused-expressions": "off",
        "@typescript-eslint/no-unused-vars": "warn",

        "n/no-unpublished-import": ["off", {
            allowModules: [],
            convertPath: null,
        }],

        "prettier/prettier": ["error", {
            endOfLine: "auto",
            printWidth: 120,
        }],

        "@typescript-eslint/naming-convention": ["error",
            {
                selector: [
                    "accessor",
                    "parameter",
                    "classProperty",
                    "classMethod",
                    "variable",
                    "function",
                ],
                format: ["camelCase"],
            }, {
                selector: ["class", "interface"],
                format: ["PascalCase"],
            }, {
                selector: ["enum", "enumMember"],
                format: ["PascalCase"],
            }, {
                selector: ["variable"],
                modifiers: ["global", "const"],
                format: ["UPPER_CASE", "camelCase"],
            }, {
                selector: ["accessor", "classProperty", "classMethod"],
                modifiers: ["private"],
                format: null,
                leadingUnderscore: "require",
                trailingUnderscore: "forbid",
            }, {
                selector: ["accessor", "classProperty", "classMethod"],
                modifiers: ["protected"],
                format: null,
                leadingUnderscore: "require",
                trailingUnderscore: "forbid",
            }, {
                selector: ["accessor", "classProperty", "classMethod"],
                modifiers: ["public"],
                format: null,
                leadingUnderscore: "forbid",
                trailingUnderscore: "forbid",
            }, {
                selector: [
                    "class",
                    "enum",
                    "enumMember",
                    "function",
                    "interface",
                    "objectLiteralMethod",
                    "objectLiteralProperty",
                    "typeAlias",
                    "typeMethod",
                    "typeParameter",
                    "typeProperty",
                    "variable",
                ],

                format: null,
                leadingUnderscore: "forbid",
                trailingUnderscore: "forbid",
            }
        ],
    },
}];