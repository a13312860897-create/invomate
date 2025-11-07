# 发票自然语言问答服务

## 概述

发票自然语言问答服务是一个基于AI的智能查询系统，允许用户使用自然语言查询账务信息。用户可以通过简单的自然语言问题获取发票、支付、客户和收入等方面的信息，无需了解复杂的数据库查询或报表操作。

## 功能特点

- **自然语言理解**：理解用户的自然语言查询，自动识别查询意图
- **多种查询类型**：支持客户发票查询、支付状态查询、收入摘要查询、逾期发票查询和客户摘要查询
- **智能回答生成**：将结构化数据转换为自然语言回答
- **多意图支持**：支持复杂查询和多种查询意图
- **上下文感知**：根据用户上下文提供更准确的回答
- **可扩展性**：易于扩展新的查询类型和功能

## 环境配置

在.env文件中添加以下配置：

```env
# 发票自然语言问答服务配置
INVOICE_QA_MAX_RESULTS=10
INVOICE_QA_CONFIDENCE_THRESHOLD=0.7
INVOICE_QA_USE_RAG=false
INVOICE_QA_ENABLE_DATA_ANALYSIS=true
```

## 依赖项

确保已安装以下依赖项：

```bash
npm install uuid
```

## API端点

### 1. 处理自然语言查询

**端点**：`POST /api/invoice-qa/query`

**请求体**：
```json
{
  "query": "客户A的发票有哪些？",
  "options": {
    "maxResults": 10,
    "confidenceThreshold": 0.7
  }
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "success": true,
    "query": "客户A的发票有哪些？",
    "intent": {
      "type": "client_invoices",
      "params": {
        "clientName": "A"
      }
    },
    "response": "客户\"A\"共有5张发票，总金额为25000元。其中已付3张，逾期1张，待处理1张。",
    "data": {
      "found": true,
      "client": {
        "id": 1,
        "name": "A",
        "email": "clientA@example.com"
      },
      "invoices": [...],
      "stats": {...}
    },
    "requestId": "qa_1234567890_abc123",
    "processingTime": 1200
  },
  "message": "查询处理成功",
  "requestId": "qa_1234567890_abc123"
}
```

### 2. 获取支持的查询类型

**端点**：`GET /api/invoice-qa/query-types`

**响应**：
```json
{
  "success": true,
  "data": [
    {
      "type": "client_invoices",
      "name": "客户发票查询",
      "description": "查询特定客户的发票信息",
      "examples": [
        "客户A的发票有哪些？",
        "显示客户B的所有发票",
        "客户C最近三个月的发票"
      ]
    },
    {
      "type": "payment_status",
      "name": "支付状态查询",
      "description": "查询支付状态和统计信息",
      "examples": [
        "我的支付状态如何？",
        "已收和未收款项统计",
        "最近的支付记录"
      ]
    },
    ...
  ],
  "message": "获取支持的查询类型成功"
}
```

### 3. 获取查询历史

**端点**：`GET /api/invoice-qa/history?limit=10&offset=0`

**响应**：
```json
{
  "success": true,
  "data": {
    "history": [],
    "total": 0,
    "limit": 10,
    "offset": 0
  },
  "message": "获取查询历史成功"
}
```

### 4. 获取查询建议

**端点**：`GET /api/invoice-qa/suggestions`

**响应**：
```json
{
  "success": true,
  "data": [
    "客户A的发票有哪些？",
    "上个月收入多少？",
    "有哪些逾期发票？",
    "客户B的付款情况如何？",
    "我的支付状态如何？",
    "今年收入最高的客户是谁？",
    "逾期超过30天的发票有哪些？",
    "客户C的平均付款周期是多少？",
    "最近30天的收入统计",
    "未付发票总金额是多少？"
  ],
  "message": "获取查询建议成功"
}
```

## 支持的查询类型

### 1. 客户发票查询

**意图类型**：`client_invoices`

**描述**：查询特定客户的发票信息

**示例查询**：
- "客户A的发票有哪些？"
- "显示客户B的所有发票"
- "客户C最近三个月的发票"

### 2. 支付状态查询

**意图类型**：`payment_status`

**描述**：查询支付状态和统计信息

**示例查询**：
- "我的支付状态如何？"
- "已收和未收款项统计"
- "最近的支付记录"

### 3. 收入摘要查询

**意图类型**：`revenue_summary`

**描述**：查询收入摘要和趋势

**示例查询**：
- "上个月收入多少？"
- "今年的收入趋势"
- "最近30天的收入统计"

### 4. 逾期发票查询

**意图类型**：`overdue_invoices`

**描述**：查询逾期发票信息

**示例查询**：
- "有哪些逾期发票？"
- "逾期超过60天的发票"
- "逾期发票总金额"

### 5. 客户摘要查询

**意图类型**：`client_summary`

**描述**：查询客户摘要信息

**示例查询**：
- "客户A的付款情况如何？"
- "客户B的平均付款周期"
- "客户C的财务摘要"

### 6. 一般性查询

**意图类型**：`general`

**描述**：处理一般性查询

**示例查询**：
- "我的业务概况如何？"
- "给我一个财务摘要"

## 代码示例

### 前端调用示例

```javascript
// 发送自然语言查询
async function sendQuery(query) {
  try {
    const response = await fetch('/api/invoice-qa/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // 显示回答
      console.log(data.data.response);
      
      // 显示详细数据（可选）
      console.log('详细数据:', data.data.data);
    } else {
      // 处理错误
      console.error('查询失败:', data.message);
    }
  } catch (error) {
    console.error('请求错误:', error);
  }
}

// 获取查询建议
async function getQuerySuggestions() {
  try {
    const response = await fetch('/api/invoice-qa/suggestions', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      // 显示查询建议
      console.log('查询建议:', data.data);
    } else {
      console.error('获取查询建议失败:', data.message);
    }
  } catch (error) {
    console.error('请求错误:', error);
  }
}
```

### 后端服务使用示例

```javascript
const { InvoiceQAService } = require('./src/services/ai');

// 创建服务实例
const qaService = new InvoiceQAService({
  maxResults: 10,
  confidenceThreshold: 0.7,
  useRAG: false,
  enableDataAnalysis: true
});

// 处理查询
async function handleQuery(query, userId) {
  try {
    const result = await qaService.processQuery(query, {}, userId);
    
    if (result.success) {
      console.log('回答:', result.response);
      console.log('详细数据:', result.data);
    } else {
      console.error('查询失败:', result.error);
    }
  } catch (error) {
    console.error('处理查询时发生错误:', error);
  }
}

// 使用示例
handleQuery('客户A的发票有哪些？', 1);
```

## 测试

运行测试：

```bash
npm run test:invoice-qa
```

测试文件位于：`src/services/ai/test/invoiceQAService.test.js`

## 注意事项

1. **数据安全**：确保用户只能查询自己的数据，服务已内置用户ID验证
2. **AI服务依赖**：自然语言理解和回答生成依赖于AI服务，确保AI服务正常工作
3. **性能考虑**：复杂查询可能需要较长时间处理，考虑添加加载状态指示
4. **错误处理**：前端应妥善处理各种错误情况，提供友好的错误提示
5. **查询限制**：考虑添加查询频率限制，防止滥用

## 故障排除

### 常见问题

1. **查询返回空结果**
   - 检查数据库中是否有相关数据
   - 确认用户ID是否正确
   - 检查查询意图识别是否正确

2. **回答不准确**
   - 检查AI服务配置
   - 调整提示词模板
   - 增加上下文信息

3. **性能问题**
   - 检查数据库查询性能
   - 考虑添加缓存
   - 优化AI服务调用

### 调试方法

1. 启用详细日志
   ```env
   LOG_LEVEL=debug
   ```

2. 检查请求ID
   每个查询都有唯一的请求ID，可用于追踪问题

3. 检查意图分析结果
   查询结果中包含意图分析结果，可用于调试意图识别问题

## 扩展自定义

### 添加新的查询类型

1. 在`InvoiceQAService`中添加新的处理方法
2. 更新`understandIntent`方法以识别新的意图类型
3. 更新`generateNaturalLanguageResponse`方法以生成相应的回答
4. 更新API文档和示例

### 自定义意图分析

1. 实现`understandIntent`方法的自定义逻辑
2. 或使用自定义的AI服务进行意图分析
3. 更新`parseIntentData`方法以解析新的意图格式

### 自定义回答生成

1. 实现`generateNaturalLanguageResponse`方法的自定义逻辑
2. 或使用自定义的AI服务进行回答生成
3. 更新`buildResponseGenerationPrompt`方法以构建自定义提示词

## 未来改进

1. **RAG支持**：实现基于RAG的更高级问答系统
2. **多语言支持**：支持多种语言的查询
3. **上下文记忆**：记住之前的查询上下文，提供更连贯的对话体验
4. **个性化回答**：根据用户偏好和历史行为提供个性化回答
5. **预测性分析**：基于历史数据提供预测性分析和建议