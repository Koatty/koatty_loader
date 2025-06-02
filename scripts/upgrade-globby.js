#!/usr/bin/env node

/**
 * Globby升级验证脚本
 * 用于测试不同版本的globby兼容性
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查Globby版本兼容性...\n');

// 检查当前安装的globby版本
try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    console.log(`📦 package.json中的globby版本: ${packageJson.dependencies.globby}`);
    
    // 尝试加载globby
    let globbyVersion = 'unknown';
    let loadMethod = 'unknown';
    let isCompatible = false;
    
    try {
        const globbyPkg = require('globby/package.json');
        globbyVersion = globbyPkg.version;
        console.log(`✅ 实际安装的globby版本: ${globbyVersion}`);
    } catch (e) {
        console.log('⚠️  无法读取globby版本信息');
    }
    
    // 测试不同的加载方式
    console.log('\n🧪 测试API兼容性:');
    
    try {
        // 尝试CommonJS方式加载
        const globby = require('globby');
        
        if (globby.sync) {
            console.log('✅ CommonJS同步方式 (v11-v13): 成功');
            loadMethod = 'CommonJS (globby.sync)';
            isCompatible = true;
            
            // 简单测试
            try {
                const testResults = globby.sync(['*.js'], { cwd: __dirname });
                console.log(`   测试结果: 找到 ${testResults.length} 个JS文件`);
            } catch (testError) {
                console.log(`   ⚠️  测试执行失败: ${testError.message}`);
                isCompatible = false;
            }
        } else if (globby.default && globby.default.sync) {
            console.log('✅ CommonJS默认导出同步方式: 成功');
            loadMethod = 'CommonJS (globby.default.sync)';
            isCompatible = true;
            
            try {
                const testResults = globby.default.sync(['*.js'], { cwd: __dirname });
                console.log(`   测试结果: 找到 ${testResults.length} 个JS文件`);
            } catch (testError) {
                console.log(`   ⚠️  测试执行失败: ${testError.message}`);
                isCompatible = false;
            }
        } else {
            console.log('❌ 找不到sync方法，可能是异步版本');
            loadMethod = 'CommonJS (无sync方法)';
        }
        
    } catch (loadError) {
        if (loadError.code === 'ERR_REQUIRE_ESM' || loadError.message.includes('ES Module')) {
            console.log('❌ 检测到纯ESM模块 (v14+): 不兼容');
            console.log('💡 建议降级到兼容版本:');
            console.log('   npm install globby@^13.1.4  # 支持CommonJS的最后版本');
            console.log('   或者');
            console.log('   npm install globby@^11.1.0  # 稳定的旧版本');
            
            loadMethod = 'ESM (不兼容)';
        } else {
            console.log('❌ 加载失败:', loadError.message);
            loadMethod = 'Load Error';
        }
    }
    
    // 版本兼容性建议
    console.log('\n📊 兼容性报告:');
    console.log(`   版本: ${globbyVersion}`);
    console.log(`   加载方式: ${loadMethod}`);
    console.log(`   状态: ${isCompatible ? '✅ 兼容' : '❌ 不兼容'}`);
    
    // 基于版本号给出建议
    if (globbyVersion !== 'unknown') {
        const majorVersion = parseInt(globbyVersion.split('.')[0]);
        console.log('\n💡 版本建议:');
        
        if (majorVersion >= 14) {
            console.log('   ⚠️  v14+ 是纯ESM模块，建议降级到 v13.1.4');
            console.log('   📝 或考虑将项目转换为ESM模块');
        } else if (majorVersion === 13) {
            console.log('   ✅ v13.x 支持CommonJS，推荐版本');
        } else if (majorVersion <= 11) {
            console.log('   ✅ v11.x 稳定的CommonJS版本');
            console.log('   📈 可考虑升级到 v13.1.4 获得性能提升');
        } else {
            console.log('   ℹ️  v12.x 为过渡版本，建议使用 v13.1.4');
        }
    }
    
    if (!isCompatible) {
        console.log('\n❗ 需要处理兼容性问题');
        process.exit(1);
    }
    
    console.log('\n🎉 兼容性验证通过！');
    
} catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
} 