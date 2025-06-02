# koatty_loader 使用示例

本文档提供了 `koatty_loader` 的详细使用示例，帮助你更好地理解和使用这个强大的模块加载器。

## 📚 目录

- [基础示例](#基础示例)
- [高级用法](#高级用法)
- [实际项目应用](#实际项目应用)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 🚀 基础示例

### 1. 简单的模块加载

```typescript
import { Load } from 'koatty_loader';
import path from 'path';

// 加载所有控制器
const controllers = Load(['./src/controller'], path.join(__dirname));

console.log('加载的控制器:', controllers.map(c => c.name));
```

### 2. 使用回调函数

```typescript
import { Load } from 'koatty_loader';

// 每个模块加载时都会调用回调函数
Load(['./src/services'], __dirname, (fileName, filePath, target) => {
    console.log(`📦 模块名称: ${fileName}`);
    console.log(`📍 文件路径: ${filePath}`);
    console.log(`🎯 导出内容:`, target);
    console.log('---');
});
```

### 3. 自定义文件匹配

```typescript
import { Load } from 'koatty_loader';

// 只加载 service 和 controller 文件
const modules = Load(
    ['./src'],
    __dirname,
    undefined,
    ['**/*.service.ts', '**/*.controller.ts'], // 匹配模式
    ['**/test/**', '**/*.test.ts']            // 忽略模式
);
```

## 🔧 高级用法

### 1. 条件加载

```typescript
import { Load } from 'koatty_loader';

interface ModuleConfig {
    enabled: boolean;
    priority: number;
}

const enabledModules: any[] = [];

Load(['./src/plugins'], __dirname, (fileName, filePath, plugin) => {
    // 只加载启用的插件
    if (plugin && plugin.config && plugin.config.enabled) {
        enabledModules.push({
            name: fileName,
            instance: plugin,
            priority: plugin.config.priority || 0
        });
    }
});

// 按优先级排序
enabledModules.sort((a, b) => b.priority - a.priority);
```

### 2. 异步处理

```typescript
import { Load } from 'koatty_loader';

async function loadAndInitializeServices() {
    const services = Load(['./src/services'], __dirname);
    
    // 并行初始化所有服务
    const initializedServices = await Promise.all(
        services.map(async ({ name, target }) => {
            if (target && typeof target === 'function') {
                const instance = new target();
                
                // 如果服务有初始化方法，调用它
                if (instance.initialize && typeof instance.initialize === 'function') {
                    await instance.initialize();
                }
                
                return { name, instance };
            }
            return null;
        })
    );
    
    return initializedServices.filter(Boolean);
}
```

### 3. 类型安全的加载

```typescript
import { Load } from 'koatty_loader';

interface Controller {
    route: string;
    handler: Function;
}

interface Service {
    name: string;
    start(): Promise<void>;
    stop(): Promise<void>;
}

// 类型安全的控制器加载
function loadControllers(): Controller[] {
    const modules = Load(['./src/controllers'], __dirname);
    
    return modules
        .filter(({ target }) => target && typeof target === 'function')
        .map(({ name, target }) => {
            const instance = new (target as any)();
            return {
                route: `/${name.toLowerCase()}`,
                handler: instance
            } as Controller;
        });
}

// 类型安全的服务加载
function loadServices(): Service[] {
    const modules = Load(['./src/services'], __dirname);
    
    return modules
        .filter(({ target }) => target && typeof target === 'function')
        .map(({ name, target }) => new (target as any)() as Service);
}
```

## 🏗️ 实际项目应用

### 1. Koa.js 应用

```typescript
import Koa from 'koa';
import Router from 'koa-router';
import { Load } from 'koatty_loader';

const app = new Koa();
const router = new Router();

// 自动加载路由
Load(['./src/routes'], __dirname, (fileName, filePath, RouteClass) => {
    if (RouteClass && typeof RouteClass === 'function') {
        const routeInstance = new RouteClass();
        
        // 假设每个路由类都有 register 方法
        if (routeInstance.register) {
            routeInstance.register(router);
            console.log(`✅ 注册路由: ${fileName}`);
        }
    }
});

app.use(router.routes()).use(router.allowedMethods());
```

### 2. Express.js 应用

```typescript
import express from 'express';
import { Load } from 'koatty_loader';

const app = express();

// 加载中间件
Load(['./src/middleware'], __dirname, (fileName, filePath, middleware) => {
    if (middleware && typeof middleware === 'function') {
        app.use(middleware);
        console.log(`🔗 加载中间件: ${fileName}`);
    }
});

// 加载控制器
const controllers = Load(['./src/controllers'], __dirname);

controllers.forEach(({ name, target }) => {
    if (target && typeof target === 'function') {
        const controller = new target();
        const basePath = `/${name.toLowerCase().replace('controller', '')}`;
        
        // 注册控制器路由
        if (controller.routes) {
            Object.keys(controller.routes).forEach(method => {
                const routes = controller.routes[method];
                Object.keys(routes).forEach(path => {
                    const fullPath = basePath + path;
                    app[method](fullPath, routes[path].bind(controller));
                    console.log(`📍 注册路由: ${method.toUpperCase()} ${fullPath}`);
                });
            });
        }
    }
});
```

### 3. 配置管理系统

```typescript
import { Load } from 'koatty_loader';
import fs from 'fs';
import path from 'path';

class ConfigManager {
    private configs: Map<string, any> = new Map();
    
    loadConfigs(configDir: string) {
        // 加载 JSON 配置文件
        Load([configDir], __dirname, (fileName, filePath, config) => {
            if (config) {
                this.configs.set(fileName, config);
                console.log(`⚙️ 加载配置: ${fileName}`);
            }
        }, ['**/*.json', '**/*.js']);
        
        // 加载环境特定配置
        const env = process.env.NODE_ENV || 'development';
        const envConfigPath = path.join(configDir, `${env}.json`);
        
        if (fs.existsSync(envConfigPath)) {
            const envConfig = require(envConfigPath);
            this.configs.set('env', envConfig);
            console.log(`🌍 加载环境配置: ${env}`);
        }
    }
    
    get<T>(key: string, defaultValue?: T): T {
        return this.configs.get(key) || defaultValue;
    }
    
    getAllConfigs() {
        return Object.fromEntries(this.configs);
    }
}

// 使用示例
const configManager = new ConfigManager();
configManager.loadConfigs('./config');

const dbConfig = configManager.get('database');
const appConfig = configManager.get('app', { port: 3000 });
```

### 4. 插件系统

```typescript
import { Load } from 'koatty_loader';

interface Plugin {
    name: string;
    version: string;
    dependencies?: string[];
    install(app: any, options?: any): void;
    uninstall?(app: any): void;
}

class PluginManager {
    private plugins: Map<string, Plugin> = new Map();
    private installedPlugins: Set<string> = new Set();
    
    loadPlugins(pluginDir: string) {
        Load([pluginDir], __dirname, (fileName, filePath, PluginClass) => {
            if (PluginClass && typeof PluginClass === 'function') {
                const plugin = new PluginClass() as Plugin;
                this.plugins.set(plugin.name, plugin);
                console.log(`🔌 发现插件: ${plugin.name}@${plugin.version}`);
            }
        }, ['**/*.plugin.js', '**/*.plugin.ts']);
    }
    
    async installPlugin(pluginName: string, app: any, options?: any) {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`插件 ${pluginName} 未找到`);
        }
        
        // 检查依赖
        if (plugin.dependencies) {
            for (const dep of plugin.dependencies) {
                if (!this.installedPlugins.has(dep)) {
                    await this.installPlugin(dep, app);
                }
            }
        }
        
        // 安装插件
        plugin.install(app, options);
        this.installedPlugins.add(pluginName);
        console.log(`✅ 插件已安装: ${pluginName}`);
    }
    
    async installAllPlugins(app: any) {
        const pluginNames = Array.from(this.plugins.keys());
        
        for (const pluginName of pluginNames) {
            if (!this.installedPlugins.has(pluginName)) {
                try {
                    await this.installPlugin(pluginName, app);
                } catch (error) {
                    console.error(`❌ 插件安装失败: ${pluginName}`, error);
                }
            }
        }
    }
}
```

## 🎯 最佳实践

### 1. 模块命名约定

```typescript
// 良好的命名约定
// controllers/UserController.ts
export default class UserController {
    // ...
}

// services/EmailService.ts  
export default class EmailService {
    // ...
}

// middleware/AuthMiddleware.ts
export default class AuthMiddleware {
    // ...
}
```

### 2. 错误处理

```typescript
import { Load } from 'koatty_loader';

function safeLoad(directories: string[], baseDir: string) {
    try {
        return Load(directories, baseDir, (fileName, filePath, target) => {
            // 验证模块结构
            if (!target) {
                console.warn(`⚠️ 模块 ${fileName} 没有导出内容`);
                return;
            }
            
            if (typeof target !== 'function' && typeof target !== 'object') {
                console.warn(`⚠️ 模块 ${fileName} 导出类型不符合预期`);
                return;
            }
            
            console.log(`✅ 成功加载: ${fileName}`);
        });
    } catch (error) {
        console.error('模块加载失败:', error.message);
        
        // 记录详细错误信息用于调试
        if (process.env.NODE_ENV === 'development') {
            console.error('详细错误:', error);
        }
        
        return [];
    }
}
```

### 3. 性能优化

```typescript
import { Load } from 'koatty_loader';

// 缓存加载结果
const moduleCache = new Map<string, any[]>();

function loadWithCache(directories: string[], baseDir: string, cacheKey?: string) {
    const key = cacheKey || directories.join(':');
    
    if (moduleCache.has(key)) {
        console.log(`📋 使用缓存: ${key}`);
        return moduleCache.get(key);
    }
    
    const modules = Load(directories, baseDir);
    moduleCache.set(key, modules);
    
    console.log(`💾 缓存结果: ${key} (${modules.length} 个模块)`);
    return modules;
}

// 延迟加载
class LazyLoader {
    private loaders: Map<string, () => any[]> = new Map();
    
    register(name: string, loader: () => any[]) {
        this.loaders.set(name, loader);
    }
    
    load(name: string) {
        const loader = this.loaders.get(name);
        if (!loader) {
            throw new Error(`加载器 ${name} 未注册`);
        }
        
        return loader();
    }
}

const lazyLoader = new LazyLoader();

// 注册延迟加载器
lazyLoader.register('controllers', () => 
    Load(['./src/controllers'], __dirname)
);

// 需要时才加载
const controllers = lazyLoader.load('controllers');
```

## ❓ 常见问题

### Q: 如何处理模块加载失败的情况？

```typescript
import { Load } from 'koatty_loader';

const modules = Load(['./src/controllers'], __dirname, (fileName, filePath, target) => {
    try {
        if (!target) {
            throw new Error('模块未导出任何内容');
        }
        
        // 验证模块是否符合预期
        if (typeof target === 'function') {
            const instance = new target();
            if (!instance.route) {
                console.warn(`⚠️ 控制器 ${fileName} 缺少 route 属性`);
            }
        }
        
        console.log(`✅ ${fileName} 加载成功`);
    } catch (error) {
        console.error(`❌ ${fileName} 加载失败:`, error.message);
    }
});
```

### Q: 如何动态重新加载模块？

```typescript
// 注意：Node.js 的模块缓存会影响重新加载
function clearModuleCache(directory: string) {
    const absoluteDir = path.resolve(__dirname, directory);
    
    Object.keys(require.cache).forEach(key => {
        if (key.startsWith(absoluteDir)) {
            delete require.cache[key];
            console.log(`🗑️ 清除缓存: ${key}`);
        }
    });
}

function reloadModules(directories: string[]) {
    // 清除缓存
    directories.forEach(dir => clearModuleCache(dir));
    
    // 重新加载
    return Load(directories, __dirname);
}
```

### Q: 如何处理不同环境的模块加载？

```typescript
import { Load } from 'koatty_loader';

const env = process.env.NODE_ENV || 'development';

// 根据环境加载不同的模块
const getModulePaths = () => {
    const basePaths = ['./src/controllers', './src/services'];
    
    if (env === 'development') {
        basePaths.push('./src/dev-tools');
    }
    
    if (env === 'test') {
        basePaths.push('./src/test-helpers');
    }
    
    return basePaths;
};

const modules = Load(getModulePaths(), __dirname);
```

---

以上示例展示了 `koatty_loader` 的各种使用场景。根据你的具体需求，可以灵活组合这些模式来构建强大的模块加载系统。 