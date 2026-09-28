# Changelog

## 2.0.1

### Patch Changes

- Phase A（基线修复与 CI 可信）收口：修复让 `pnpm lint` / CI lint job 失败的配置与格式问题。
  - `koatty_cli`：按 prettier 重新格式化 `apply` 命令的 `--yes` 选项（`npx eslint --fix`，无行为变化）；
  - `koatty_graphql`、`koatty_loader`：`@typescript-eslint/ban-types` 已在 @typescript-eslint v8 中移除，配置仍引用该规则会让每次 lint 直接报
    `Definition for rule '@typescript-eslint/ban-types' was not found`；改用后继规则 `@typescript-eslint/no-unsafe-function-type`；
  - `koatty_loader`：为刻意的 ES5/6 动态 `require()` 补充 `eslint-disable`；
  - `koatty_testing`：补充缺失的 `.eslintrc.js`（此前 eslint 以 exit=2 报 `couldn't find a configuration file`）。

  修复后 `pnpm lint` 由 4 个包失败恢复为 21/21 通过；`pnpm build` 23/23、`pnpm security:baseline` PASS 6 / FAIL 0。详见 `docs/reports/test-baseline-2026-09.md` §七。

## 2.0.0

### Patch Changes

- Updated dependencies
  - koatty_lib@1.6.0

## 1.2.0

### Minor Changes

- build
- build

### Patch Changes

- Updated dependencies
- Updated dependencies
  - koatty_lib@1.5.0

## 1.1.9

### Patch Changes

- build
- Updated dependencies
  - koatty_lib@1.4.9

## 1.1.8

### Patch Changes

- Updated dependencies
  - koatty_lib@1.4.8

## 1.1.7

### Patch Changes

- build
- Updated dependencies
  - koatty_lib@1.4.7

## 1.1.6

### Patch Changes

- build

## 1.1.5

### Patch Changes

- patch version bump for koatty, koatty_cacheable, koatty_config, koatty_container, koatty_core, koatty_exception, koatty_graphql, koatty_lib, koatty_loader, koatty_logger, koatty_proto, koatty_router, koatty_schedule, koatty_serve, koatty_store, koatty_trace, koatty_typeorm, koatty_validation
- Updated dependencies
  - koatty_lib@1.4.6

## 1.1.4

### Patch Changes

- build
- Updated dependencies
  - koatty_lib@1.4.5

## 1.1.3

### Patch Changes

- build
- Updated dependencies
  - koatty_lib@1.4.4

## 1.1.2

### Patch Changes

- build
- Updated dependencies
  - koatty_lib@1.4.3

## 1.1.1

### Patch Changes

- Updated dependencies
  - koatty_lib@1.4.2

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.1.0](https://github.com/Koatty/koatty_loader/compare/v1.0.3...v1.1.0) (2023-01-10)

### Bug Fixes

- upgrade deps ([5182ff3](https://github.com/Koatty/koatty_loader/commit/5182ff34f5d6abcc991b8eda32cc156416533760))

### [1.0.3](https://github.com/Koatty/koatty_loader/compare/v1.0.2...v1.0.3) (2022-05-26)

### [1.0.2](https://github.com/Koatty/koatty_loader/compare/v1.0.0...v1.0.2) (2021-12-01)

## 1.0.0 (2021-12-01)
