import globals from "globals";

export default [
  {
    files: ["popup.js", "background.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        chrome: "readonly",
        MathJax: "readonly",
      },
    },
    rules: {
      // Errors
      "no-undef": "error",
      "no-unused-vars": ["error", { "args": "none", "caughtErrors": "none" }],
      "no-console": "warn",

      // Code quality
      "eqeqeq": ["error", "always"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",

      // Style (non-fixable issues that indicate real bugs)
      "no-duplicate-case": "error",
      "no-fallthrough": "error",
      "no-unreachable": "error",
      "use-isnan": "error",
    },
  },
];
