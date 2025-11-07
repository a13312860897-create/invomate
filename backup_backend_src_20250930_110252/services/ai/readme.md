# ai服务架构

本文档描述了发票软件中的ai服务架构，包括基础组件、使用方法和示例。

## 架构概述

ai服务架构采用模块化设计，包括以下核心组件：

1. **基础抽象类** (`baseaiservice.js`): 定义所有ai服务的通用接口和基础功能
2. **具体服务实现** (`openaiservice.js`): 实现openai api的具体调用
3. **服务工厂** (`aiservicefactory.js`): 创建和管理不同类型的ai服务实例
4. **功能服务** (`reminderemailservice.js`): 实现具体的ai功能，如自动催款邮件
5. **控制器** (`aicontroller.js`): 处理ai相关的api请求
6. **路由** (`ai.js`): 定义ai相关的api端点

## 快速开始

### 1. 环境配置

在`.env`文件中添加以下配置：

```env
# ai service configuration
openai_api_key=your_openai_api_key
openai_organization=your_openai_organization_id
openai_model=gpt-3.5-turbo
openai_base_url=https://api.openai.com/v1

# ai service settings
ai_default_provider=openai
ai_temperature=0.7
ai_max_tokens=1000
ai_max_retries=3
ai_timeout=30000
```

### 2. 运行测试

```bash
npm run test:ai
```

### 3. 启动服务器

```bash
npm start
```

## api端点

### 生成催款邮件内容

```http
post /api/ai/reminder-email/generate
content-type: application/json
authorization: bearer {token}

{
  "invoiceid": "inv-123",
  "clientid": "client-456",
  "options": {
    "template": "friendly",
    "language": "zh-cn"
  }
}
```

### 发送催款邮件

```http
post /api/ai/reminder-email/send
content-type: application/json
authorization: bearer {token}

{
  "invoiceid": "inv-123",
  "clientid": "client-456",
  "options": {
    "template": "friendly",
    "language": "zh-cn"
  }
}
```

### 批量发送催款邮件

```http
post /api/ai/reminder-email/bulk-send
content-type: application/json
authorization: bearer {token}

{
  "invoiceclientpairs": [
    {
      "invoice": {"id": "inv-123", ...},
      "client": {"id": "client-456", ...}
    },
    ...
  ],
  "options": {
    "template": "friendly",
    "delaybetweenemails": 1000
  }
}
```

### 获取ai服务状态

```http
get /api/ai/status
authorization: bearer {token}
```

## 代码示例

### 使用ai服务工厂

```javascript
const { aiservicefactory } = require('./services/ai');

// 获取默认ai服务
const aiservice = aiservicefactory.getdefaultservice();

// 生成文本
const result = await aiservice.generatetext('请写一封关于发票的催款邮件');

if (result.success) {
  console.log('生成的文本:', result.text);
} else {
  console.error('生成失败:', result.error);
}
```

### 使用催款邮件服务

```javascript
const { reminderemailservice } = require('./services/ai');

// 模拟发票数据
const invoice = {
  id: 'inv-123',
  invoicenumber: 'inv-2023-001',
  date: '2023-10-01',
  duedate: '2023-10-15',
  amount: 1500,
  currency: 'cny',
  overduedays: 5
};

// 模拟客户数据
const client = {
  id: 'client-456',
  name: '张三',
  companyname: 'abc科技有限公司',
  email: 'zhangsan@example.com'
};

// 生成催款邮件
const emailresult = await reminderemailservice.generatereminderemail(
  invoice,
  client,
  {
    template: 'friendly',
    language: 'zh-cn'
  }
);

if (emailresult.success) {
  console.log('邮件主题:', emailresult.subject);
  console.log('邮件内容:', emailresult.body);
} else {
  console.error('生成失败:', emailresult.error);
}
```

## 邮件模板

### 友好提醒 (friendly)
- 语气: 友好、礼貌
- 紧急程度: 低
- 适用场景: 首次提醒或轻微逾期

### 紧急提醒 (urgent)
- 语气: 紧急但专业
- 紧急程度: 高
- 适用场景: 中等逾期或多次提醒后

### 最后通知 (final)
- 语气: 严肃、专业
- 紧急程度: 非常高
- 适用场景: 严重逾期或最后提醒

## 扩展ai服务

### 添加新的ai服务提供商

1. 创建新的服务类，继承`baseaiservice`:

```javascript
const baseaiservice = require('./baseaiservice');

class newaiservice extends baseaiservice {
  constructor(config = {}) {
    super({
      provider: 'newai',
      ...config
    });
  }

  async generatetext(prompt, options = {}) {
    // 实现具体的ai调用逻辑
  }

  // 实现其他必要方法
}

module.exports = newaiservice;
```

2. 在`aiservicefactory.js`中注册新的服务提供商:

```javascript
const newaiservice = require('./newaiservice');

class aiservicefactory {
  createservice(provider, config = {}) {
    switch (provider.lowercase()) {
      // ... 现有case ...
      case 'newai':
        service = new newaiservice(config);
        break;
      default:
        throw new error(`unsupported ai provider: ${provider}`);
    }
    return service;
  }
  
  getsupportedproviders() {
    return ['openai', 'newai']; // 添加新的提供商
  }
}
```

### 添加新的ai功能

1. 创建新的功能服务类:

```javascript
const aiservicefactory = require('./aiservicefactory');

class newaifeatureservice {
  constructor(config = {}) {
    this.aiservice = aiservicefactory.getdefaultservice(config);
  }

  async newfeature(input, options = {}) {
    // 实现新功能的逻辑
    const prompt = `构建适合新功能的提示词: ${input}`;
    const result = await this.aiservice.generatetext(prompt, options);
    
    if (!result.success) {
      throw new error(result.error);
    }
    
    return {
      success: true,
      data: result.text
    };
  }
}

module.exports = newaifeatureservice;
```

2. 在控制器中添加新方法:

```javascript
const newaifeatureservice = require('../services/ai/newaifeatureservice');

class aicontroller {
  async newfeature(req, res) {
    try {
      const { input, options = {} } = req.body;
      
      const service = new newaifeatureservice();
      const result = await service.newfeature(input, options);
      
      return res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message
      });
    }
  }
}
```

3. 在路由中添加新端点:

```javascript
router.post('/new-feature', authmiddleware, aicontroller.newfeature);
```

## 注意事项

1. **api密钥安全**: 确保openai api密钥和其他敏感信息存储在环境变量中，不要提交到版本控制系统。

2. **错误处理**: 所有ai服务调用都应包含适当的错误处理，以应对网络问题、api限制等情况。

3. **成本控制**: 监控ai api的使用情况，避免意外产生高额费用。

4. **数据隐私**: 在发送数据给ai服务前，确保已处理敏感信息，如个人身份信息(pii)。

5. **测试**: 在生产环境中使用ai功能前，确保已进行充分测试。

## 故障排除

### 常见问题

1. **api密钥错误**: 检查`.env`文件中的`openai_api_key`是否正确设置。

2. **网络连接问题**: 确保服务器可以访问openai api端点。

3. **请求超时**: 检查`ai_timeout`设置是否合理，默认为30秒。

4. **配额限制**: 检查openai账户的配额和使用情况。

### 调试方法

1. 运行测试脚本:
   ```bash
   npm run test:ai
   ```

2. 检查日志输出，ai服务会记录请求和响应信息。

3. 使用调试模式运行服务器:
   ```bash
   npm run dev
   ```

## 更新日志

### v1.0.0 (2023-10-15)
- 初始版本发布
- 实现基础ai服务架构
- 实现自动催款邮件功能
- 添加openai服务支持
- 添加测试和文档