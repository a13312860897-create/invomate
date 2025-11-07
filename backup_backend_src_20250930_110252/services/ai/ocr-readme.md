# ocr服务

## 概述

ocr（光学字符识别）服务是发票软件系统中的一个关键组件，它能够从发票、收据等文档中自动提取文本信息，并使用ai技术分析这些文本，识别出发票的关键数据，如发票号码、日期、金额等。这些数据可以自动填充到系统中，减少手动输入的工作量，提高数据录入的准确性和效率。

## 功能特点

- **多格式支持**：支持pdf、jpg、jpeg、png等多种文档格式
- **多语言识别**：支持中文和英文的文本识别
- **智能数据提取**：使用ai技术从提取的文本中识别发票数据
- **数据验证**：提供发票数据验证功能，确保数据的完整性和准确性
- **错误处理**：完善的错误处理和日志记录机制

## 环境配置

在使用ocr服务之前，需要配置以下环境变量：

```bash
# ocr服务配置
ocr_provider=tesseract
ocr_confidence_threshold=0.7
ocr_supported_formats=pdf,jpg,jpeg,png
ocr_max_file_size=10485760
ocr_temp_dir=temp
ocr_language=chi_sim+eng
```

## 依赖项

ocr服务依赖于以下npm包：

- `pdf-parse`：用于从pdf文件中提取文本
- `tesseract.js`：用于从图像文件中提取文本
- `sharp`：用于图像处理

## api端点

ocr服务提供以下api端点：

### 1. 处理文档并提取发票信息

**端点**：`post /api/ocr/process`

**描述**：上传文档并提取发票信息

**请求**：
- **方法**：post
- **内容类型**：multipart/form-data
- **认证**：需要（使用jwt令牌）
- **参数**：
  - `document`（文件，必需）：要处理的文档文件（pdf、jpg、jpeg、png）
  - `options`（字符串，可选）：处理选项的json字符串

**响应**：
```json
{
  "success": true,
  "data": {
    "invoicedata": {
      "invoicenumber": "inv-2023-001",
      "invoicedate": "2023-11-15",
      "totalamount": 1000.00,
      "currency": "cny",
      "items": [
        {
          "description": "测试项目1",
          "quantity": 1,
          "unitprice": 500.00,
          "amount": 500.00
        }
      ]
    },
    "extractedtext": "从文档中提取的完整文本...",
    "requestid": "ocr_1234567890_abcdef",
    "processingtime": 2500
  }
}
```

### 2. 获取ocr服务状态

**端点**：`get /api/ocr/status`

**描述**：获取ocr服务的状态信息

**请求**：
- **方法**：get
- **认证**：需要（使用jwt令牌）

**响应**：
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "supportedformats": ["pdf", "jpg", "jpeg", "png"],
    "maxfilesize": 10485760,
    "ocrprovider": "tesseract",
    "features": [
      {
        "name": "发票信息提取",
        "description": "从发票、收据等文档中自动提取关键信息",
        "enabled": true
      }
    ]
  }
}
```

### 3. 验证提取的发票数据

**端点**：`post /api/ocr/validate`

**描述**：验证提取的发票数据是否完整和有效

**请求**：
- **方法**：post
- **内容类型**：application/json
- **认证**：需要（使用jwt令牌）
- **参数**：
  - `invoicedata`（对象，必需）：要验证的发票数据

**响应**：
```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": [],
    "warnings": [],
    "suggestions": []
  }
}
```

## 代码示例

### 使用ocr服务处理文档

```javascript
const ocrservice = require('./src/services/ai/ocrservice');

// 创建ocr服务实例
const ocr = new ocrservice();

// 处理文档
async function processinvoice(filepath) {
  try {
    const result = await ocr.processdocument(filepath);
    
    if (result.success) {
      console.log('发票数据:', result.data.invoicedata);
      console.log('处理时间:', result.data.processingtime, 'ms');
      return result.data.invoicedata;
    } else {
      console.error('处理失败:', result.error);
      return null;
    }
  } catch (error) {
    console.error('处理出错:', error);
    return null;
  }
}

// 使用示例
processinvoice('/path/to/invoice.pdf')
  .then(invoicedata => {
    if (invoicedata) {
      // 使用提取的发票数据
      console.log('提取的发票数据:', invoicedata);
    }
  });
```

### 验证发票数据

```javascript
const ocrcontroller = require('./src/controllers/ocrcontroller');

// 创建控制器实例
const controller = new ocrcontroller();

// 验证发票数据
const invoicedata = {
  invoicenumber: 'inv-2023-001',
  invoicedate: '2023-11-15',
  totalamount: 1000.00,
  currency: 'cny',
  items: [
    {
      description: '测试项目1',
      quantity: 1,
      unitprice: 500.00,
      amount: 500.00
    }
  ]
};

const validation = controller.validateinvoicedata(invoicedata);

console.log('验证结果:', validation.valid ? '通过' : '失败');
if (!validation.valid) {
  console.log('错误:', validation.errors);
}
if (validation.warnings.length > 0) {
  console.log('警告:', validation.warnings);
}
if (validation.suggestions.length > 0) {
  console.log('建议:', validation.suggestions);
}
```

## 测试

运行ocr服务测试：

```bash
npm run test:ocr
```

## 注意事项

1. **文件大小限制**：ocr服务对上传的文件大小有限制，默认为10mb。如果需要处理更大的文件，请调整`ocr_max_file_size`环境变量。

2. **支持的格式**：ocr服务目前支持pdf、jpg、jpeg和png格式。如果需要支持其他格式，请扩展`ocrsupportedformats`配置。

3. **语言支持**：ocr服务默认支持中文和英文。如果需要支持其他语言，请调整`ocr_language`环境变量。

4. **临时文件**：ocr服务在处理文件时会创建临时文件，处理完成后会自动删除。如果处理过程中出现异常，可能需要手动清理临时文件。

5. **隐私和安全**：ocr服务处理的文档可能包含敏感信息，请确保适当保护这些数据，并遵守相关的隐私法规。

## 故障排除

### 常见问题

1. **pdf文本提取失败**
   - 确保pdf文件不是扫描件或图像型pdf
   - 检查pdf文件是否损坏
   - 确保安装了最新版本的pdf-parse包

2. **图像文本提取失败**
   - 确保图像清晰度足够高
   - 检查图像格式是否受支持
   - 确保安装了最新版本的tesseract.js包

3. **ai分析失败**
   - 检查openai api密钥是否正确配置
   - 确保网络连接正常
   - 检查提取的文本是否包含足够的信息

### 日志和调试

ocr服务提供了详细的日志记录，可以帮助诊断问题。可以通过以下方式启用调试日志：

```javascript
// 创建ocr服务实例时启用调试
const ocr = new ocrservice({
  debug: true
});
```

## 扩展和自定义

### 添加新的ocr提供商

如果需要使用其他ocr提供商（如google cloud vision、aws textract等），可以扩展ocrservice类：

```javascript
const baseaiservice = require('./baseaiservice');

class customocrservice extends baseaiservice {
  constructor(config = {}) {
    super({
      provider: 'custom',
      ...config
    });
    
    // 自定义配置
    this.customapikey = config.customapikey;
  }
  
  async extracttextfromimage(filepath) {
    // 实现自定义的图像文本提取逻辑
  }
  
  async extracttextfrompdf(filepath) {
    // 实现自定义的pdf文本提取逻辑
  }
}

module.exports = customocrservice;
```

### 自定义发票数据提取

如果需要提取特定类型的发票数据，可以自定义提示词和解析逻辑：

```javascript
const ocrservice = require('./src/services/ai/ocrservice');

class custominvoiceocrservice extends ocrservice {
  buildinvoiceanalysisprompt(text, options = {}) {
    // 自定义提示词构建逻辑
    let prompt = `请从以下医疗发票文本中提取信息...\n\n`;
    prompt += `文本内容：\n${text}\n\n`;
    // 添加特定于医疗发票的字段
    prompt += `请提取以下字段：\n`;
    prompt += `- patientname\n`;
    prompt += `- medicalrecordnumber\n`;
    // ...
    return prompt;
  }
  
  parseinvoicedata(text) {
    // 自定义数据解析逻辑
    // ...
  }
}

module.exports = custominvoiceocrservice;
```