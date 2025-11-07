const express = require('express');
const path = require('path');
const cors = require('cors');

/**
 * 统一模板系统演示服务器
 * 提供一个交互式的Web界面来展示模板系统功能
 */
class DemoServer {
  constructor(port = 3001) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '..', 'templates', 'unified')));
  }

  setupRoutes() {
    // 主页路由
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'templates', 'unified', 'demo.html'));
    });

    // API状态检查
    this.app.get('/api/status', (req, res) => {
      res.json({
        success: true,
        message: '统一模板系统演示服务器运行中',
        timestamp: new Date().toISOString(),
        features: [
          '智能模板选择',
          '数据标准化',
          '多格式输出',
          '法国法律合规性',
          '错误处理'
        ]
      });
    });

    // 获取可用模板类型
    this.app.get('/api/templates', (req, res) => {
      res.json({
        success: true,
        templates: [
          {
            id: 'french-standard',
            name: '标准法国发票模板',
            description: '适用于一般商业交易的标准法国发票模板',
            features: ['完整TVA信息', '法律要求', '标准格式']
          },
          {
            id: 'tva-exempt',
            name: 'TVA免税发票模板',
            description: '适用于免税交易的特殊发票模板',
            features: ['免税声明', '法规引用', '特殊格式']
          },
          {
            id: 'self-liquidation',
            name: '自清算发票模板',
            description: '适用于B2B跨境交易的自清算发票模板',
            features: ['自清算声明', '跨境适用', 'B2B专用']
          }
        ]
      });
    });

    // 获取可用输出格式
    this.app.get('/api/formats', (req, res) => {
      res.json({
        success: true,
        formats: [
          {
            id: 'email',
            name: '邮件格式',
            description: '适用于邮件发送的发票格式',
            contentTypes: ['text/html', 'text/plain']
          },
          {
            id: 'pdf',
            name: 'PDF格式',
            description: '适用于文档保存的PDF格式',
            contentTypes: ['application/pdf']
          },
          {
            id: 'print',
            name: '打印格式',
            description: '适用于打印输出的优化格式',
            contentTypes: ['text/html']
          }
        ]
      });
    });
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`🚀 统一模板系统演示服务器启动`);
      console.log(`📋 演示页面: http://localhost:${this.port}`);
      console.log(`🔧 API状态: http://localhost:${this.port}/api/status`);
      console.log(`📄 可用模板: http://localhost:${this.port}/api/templates`);
      console.log(`📧 输出格式: http://localhost:${this.port}/api/formats`);
      console.log('');
      console.log('🎯 功能特性:');
      console.log('  • 智能模板选择');
      console.log('  • 数据标准化');
      console.log('  • 法国法律合规性');
      console.log('  • 多格式输出支持');
      console.log('  • 实时预览');
    });

    // 优雅关闭
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  shutdown() {
    console.log('\n🛑 正在关闭演示服务器...');
    if (this.server) {
      this.server.close(() => {
        console.log('✅ 演示服务器已关闭');
        process.exit(0);
      });
    }
  }
}

// 如果直接运行此文件，启动演示服务器
if (require.main === module) {
  const demoServer = new DemoServer(3001);
  demoServer.start();
}

module.exports = DemoServer;