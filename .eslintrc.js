/**
 *
 */
const path = require('path');

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended',
  ],
  plugins: [
    '@typescript-eslint',
    'jest',
  ],
  parserOptions: {
    project: path.join(__dirname, 'tsconfig.json'),
  },
  env: {
    node: true,
    mongo: true,
    jest: true,
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    // "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/member-ordering": "off",
    "@typescript-eslint/consistent-type-assertions": "off",
    "@typescript-eslint/no-param-reassign": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    // @typescript-eslint v8 removed `ban-types` (it made every lint run fail
    // with "Definition for rule '@typescript-eslint/ban-types' was not found").
    // The old config only disabled the ban on `Object`/`Function`, i.e. it kept
    // the rule permissive, so the v8 successor is reported as a warning.
    "@typescript-eslint/no-unsafe-function-type": "warn",
  },
};
