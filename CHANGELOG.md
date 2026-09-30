# Changelog

## 2.1.0

### Minor Changes

- f0e9278: Phase A–D 审计修复，未发布：

  - 容器注册表、类标识、实例注入与 AOP 解析均按容器隔离；注入不再写入共享原型。同名构造函数的元数据缓存不再串用。
  - `app.container` 与 Core ALS 贯通；请求结束释放对应容器的请求实例。组件实例和事件处理器使用所属应用。
  - 注册期构造路由 handler；控制器、参数元数据、中间件和 RouterFactory 使用应用容器。关闭一个应用不会清理另一应用的路由。
  - 扫描目录、每个模块与缓存条目均以 realpath 校验根目录边界；越界路径直接拒绝，不再回退扫描整个项目。
  - Bootstrap 自动创建应用独立容器，Loader/Router/注入链路使用 app.container；扫描同时处理默认导出与具名导出。
  - SSE 复用普通路由和 streamSSE；现有 middleware 与 Around/run 承担鉴权、限流和方法包装。
  - HTTPS/HTTP2 证书热更新及失败回退。
  - Serve 使用连接追踪器，HTTP/3 移至独立实验包 koatty_http3；移除核心 QUIC 依赖及模拟监听。
  - 生产构建可用既有 manifest 命令生成 runtime 清单；启动前逐文件校验路径与 SHA256。
  - 修复独立安装缺失运行时/公开类型依赖，以及原生 Node ESM 入口加载错误。
  - Config 复用既有双模式装饰器适配器，支持 TC39 字段初始化与应用隔离。

  移除 Http3Server 等核心导出和入站池语义属于破坏性变更，因此 koatty 与 koatty_serve 必须按 major 发布，不能沿用原计划的 4.5.0 minor。koatty_http3 是首次发布包，按发布工具的新包流程单独处理；最终版本需与主包依赖同步。

  迁移：docs/migration/phase-d-router-hotpath.md。D-5 实现及 D-7 清单已补齐；性能门槛、Linux CI 与部署验收仍未关闭。此文件不代表验收通过，不自动应用版本或发布。

### Patch Changes

- Updated dependencies [f0e9278]
  - koatty_lib@1.6.1

## Unreleased — Phase A–D completion

- 可选 manifestFile 消费构建后的权威文件清单，执行前校验全部条目的真实路径、重复项与 SHA256；静态清单仍走安全扫描。

本轮尚未发布；验收边界见根目录 `docs/audits/phase-ad-completion-2026-09-28.md`。

## Unreleased (Phase A–D remediation)

- 扫描目录、每个模块与缓存条目均以 realpath 校验根目录边界；越界路径直接拒绝，不再回退扫描整个项目。
- 缓存 schema 升至 2，指纹覆盖目录成员与逐文件状态，修复保留旧时间戳新增文件漏扫。处理符号链接、不同扫描 ignore 与 macOS 临时路径别名。
- 损坏缓存安全重扫；可通过 scanCache:false 关闭。生产预生成清单现已补齐，200 组件冷启动性能门槛仍未达到。

迁移说明：`docs/migration/phase-d-router-hotpath.md`。尚未发布。

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
