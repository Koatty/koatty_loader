# koatty_loader

[![npm version](https://img.shields.io/npm/v/koatty_loader.svg)](https://www.npmjs.com/package/koatty_loader)
[![npm downloads](https://img.shields.io/npm/dm/koatty_loader.svg)](https://www.npmjs.com/package/koatty_loader)
[![Build Status](https://github.com/koatty/koatty_loader/workflows/CI/badge.svg)](https://github.com/koatty/koatty_loader/actions)
[![License](https://img.shields.io/npm/l/koatty_loader.svg)](https://github.com/koatty/koatty_loader/blob/main/LICENSE)

**KOATTY 框架的高效模块加载器** - 一个基于 glob 模式的智能文件扫描和动态模块加载工具

## ✨ 特性

- 🚀 **高性能**: 基于 `globby` 的快速文件扫描
- 🔒 **安全可靠**: 内置路径遍历防护和文件类型验证
- 📦 **模块兼容**: 支持 ES5/ES6/CommonJS 模块自动识别和加载
- 🎯 **精确匹配**: 支持复杂的 glob 模式和忽略规则
- 🛡️ **错误容错**: 完善的错误处理，单个模块失败不影响整体加载
- 📝 **TypeScript**: 完整的类型定义和智能提示

## 📦 安装

```bash
npm install koatty_loader
# 或
yarn add koatty_loader
# 或
pnpm add koatty_loader
```

## 🚀 快速开始

### 基础用法

```typescript
import { Load } from 'koatty_loader';

// 扫描并加载指定目录下的所有模块
const modules = Load(['./controllers'], __dirname);

console.log(modules);
// [
//   { name: 'UserController', path: '/path/to/UserController.js', target: [Class] },
//   { name: 'ProductController', path: '/path/to/ProductController.js', target: [Class] }
// ]
```

### 带回调函数的用法

```typescript
import { Load } from 'koatty_loader';

// 使用回调函数处理每个加载的模块
Load(['./services'], __dirname, (fileName, filePath, target) => {
    console.log(`✅ 加载模块: ${fileName} from ${filePath}`);
    
    // 可以在这里进行模块注册、依赖注入等操作
    if (target && typeof target === 'function') {
        // 注册服务
        container.register(fileName, target);
    }
});
```

### 自定义匹配模式

```typescript
import { Load } from 'koatty_loader';

// 自定义文件匹配模式和忽略规则
const modules = Load(
    ['./src'], 
    __dirname,
    undefined,
    ['**/*.service.ts', '**/*.controller.ts'], // 只加载service和controller文件
    ['**/test/**', '**/node_modules/**', '**/*.test.ts'] // 忽略测试文件
);
```

## 📖 API 文档

### Load(loadDir, baseDir?, fn?, pattern?, ignore?)

动态加载指定目录下的模块文件。

#### 参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `loadDir` | `string[]` | - | **必需**。要扫描的目录数组，支持相对路径和绝对路径 |
| `baseDir` | `string` | `process.cwd()` | 可选。基础目录，相对路径将基于此目录解析 |
| `fn` | `callbackFunc` | - | 可选。回调函数，每加载一个模块时调用 |
| `pattern` | `string[]` | `['**/**.js', '**/**.ts', '!**/**.d.ts']` | 可选。文件匹配模式 |
| `ignore` | `string[]` | `['**/node_modules/**', '**/logs/**', '**/static/**']` | 可选。忽略的目录模式 |

#### 返回值

返回 `ResInterface[]` 数组，包含加载的模块信息。

#### ResInterface

```typescript
interface ResInterface {
    /** 模块名称（不含扩展名） */
    name: string;
    /** 模块完整路径 */
    path: string;
    /** 模块导出内容 */
    target: unknown;
}
```

#### callbackFunc

```typescript
type callbackFunc = (fileName: string, xpath: string, target: unknown) => void;
```

## 🎯 使用场景

### 1. 控制器自动加载

```typescript
// 在 Koatty 框架中自动加载所有控制器
import { Load } from 'koatty_loader';

export function loadControllers(app: any) {
    const controllers = Load(['./controller'], app.appPath);
    
    controllers.forEach(({ name, target }) => {
        if (target && typeof target === 'function') {
            // 注册控制器到框架
            app.registerController(name, target);
        }
    });
}
```

### 2. 服务层自动注册

```typescript
// 自动加载和注册服务
import { Load } from 'koatty_loader';

const serviceContainer = new Map();

Load(['./service'], __dirname, (fileName, filePath, ServiceClass) => {
    if (ServiceClass && typeof ServiceClass === 'function') {
        // 实例化服务并注册到容器
        const serviceInstance = new ServiceClass();
        serviceContainer.set(fileName, serviceInstance);
        
        console.log(`📦 注册服务: ${fileName}`);
    }
});
```

### 3. 插件系统

```typescript
// 动态加载插件
import { Load } from 'koatty_loader';

interface Plugin {
    name: string;
    version: string;
    install(app: any): void;
}

function loadPlugins(app: any) {
    Load(['./plugins'], app.root, (fileName, filePath, plugin: Plugin) => {
        if (plugin && typeof plugin.install === 'function') {
            plugin.install(app);
            console.log(`🔌 插件已加载: ${plugin.name}@${plugin.version}`);
        }
    }, ['**/*.plugin.js', '**/*.plugin.ts']);
}
```

### 4. 配置文件批量加载

```typescript
// 加载多个配置文件
import { Load } from 'koatty_loader';

const configs = {};

Load(['./config'], __dirname, (fileName, filePath, configData) => {
    if (configData) {
        configs[fileName] = configData;
    }
}, ['**/*.config.js', '**/*.config.json']);

console.log('📋 已加载配置:', Object.keys(configs));
```

## 🛡️ 安全特性

### 路径安全验证

```typescript
// ❌ 这些路径会被拒绝
Load(['../../../etc/passwd']);  // 路径遍历攻击
Load(['~/secrets']);           // 用户目录访问
Load(['/etc/hosts']);          // 绝对路径超出范围

// ✅ 这些路径是安全的
Load(['./controllers']);       // 相对路径
Load(['src/services']);        // 相对路径
```

### 文件类型限制

```typescript
// 只允许加载 .js 和 .ts 文件
// .exe, .bat, .sh 等可执行文件会被拒绝
```

## ⚙️ 配置选项

### Glob 模式示例

```typescript
// 匹配所有 TypeScript 文件（除了声明文件）
pattern: ['**/*.ts', '!**/*.d.ts']

// 只匹配控制器和服务文件
pattern: ['**/*.controller.ts', '**/*.service.ts']

// 匹配特定目录下的文件
pattern: ['controllers/**/*.js', 'services/**/*.js']
```

### 忽略规则示例

```typescript
// 常用忽略规则
ignore: [
    '**/node_modules/**',    // 忽略依赖包
    '**/test/**',           // 忽略测试目录
    '**/tests/**',          // 忽略测试目录
    '**/*.test.ts',         // 忽略测试文件
    '**/*.spec.ts',         // 忽略规范文件
    '**/coverage/**',       // 忽略覆盖率报告
    '**/dist/**',           // 忽略构建输出
    '**/build/**'           // 忽略构建目录
]
```

## 🔧 错误处理

koatty_loader 具有强大的错误处理能力：

```typescript
try {
    const modules = Load(['./controllers'], __dirname);
} catch (error) {
    if (error.message.includes('Path traversal')) {
        console.error('❌ 安全错误: 检测到路径遍历攻击');
    } else if (error.message.includes('File type not allowed')) {
        console.error('❌ 文件类型错误: 不允许的文件类型');
    } else {
        console.error('❌ 加载错误:', error.message);
    }
}
```

## 🧪 测试

```bash
# 运行测试
npm test

# 运行测试并生成覆盖率报告
npm run test:cov

# 代码风格检查
npm run eslint
```

## 📊 性能

- **扫描速度**: 基于 globby 的高效文件系统遍历
- **内存优化**: 惰性加载，只在需要时加载模块
- **错误恢复**: 单个模块加载失败不影响其他模块
- **缓存友好**: 利用 Node.js 的模块缓存机制

## 🔄 版本兼容性

- **Node.js**: >= 12.0.0
- **TypeScript**: >= 4.0.0 (如果使用 TypeScript)
- **ES Modules**: 完全支持
- **CommonJS**: 完全支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 [BSD-3-Clause](LICENSE) 许可证。

## 🔗 相关链接

- [KOATTY 框架](https://github.com/koatty/koatty)
- [使用示例](docs/examples.md) - 详细的使用示例和最佳实践
- [Globby](https://github.com/sindresorhus/globby)
- [变更日志](CHANGELOG.md)

## 👥 维护团队

- **richen** - *核心开发者* - [GitHub](https://github.com/richenlin)

---

<div align="center">

**[⬆ 回到顶部](#koatty_loader)**

Made with ❤️ by the Koatty team

</div>

