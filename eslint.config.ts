import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import { defineConfig } from "eslint/config"

export default defineConfig([
	{
		ignores: ["backend/worker-configuration.d.ts"],
	},
	{
		files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
		plugins: { js },
		extends: ["js/recommended"],
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			"@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }],
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					// varsIgnorePattern: "^_",
					// caughtErrorsIgnorePattern: "^_",
				},
			],
		},
	},
	tseslint.configs.recommended,
])
