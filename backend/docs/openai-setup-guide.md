# OpenAI API 开发环境设置指南

本指南将帮助您设置本地开发环境以使用 OpenAI API。

## 1. 创建并导出 API 密钥

在开始之前，请在 [OpenAI 仪表板](https://platform.openai.com/api-keys) 中创建一个 API 密钥。

### 在 Windows 系统上设置环境变量

有两种方法可以设置 OpenAI API 密钥：

#### 方法一：使用 .env 文件（推荐）

1. 在项目根目录下找到 `.env` 文件
2. 添加以下行：
   ```
   OPENAI_API_KEY="your_api_key_here"
   ```
3. 将 `your_api_key_here` 替换为您的实际 API 密钥

#### 方法二：使用命令行

在 PowerShell 中运行：
```powershell
$env:OPENAI_API_KEY="your_api_key_here"
```

在命令提示符中运行：
```cmd
set OPENAI_API_KEY="your_api_key_here"
```

## 2. 安装 OpenAI SDK

我们已经为您安装了 OpenAI SDK。如果您需要手动安装，可以运行：

```bash
npm install openai
```

## 3. 测试基本 API 请求

我们提供了一个测试脚本，用于验证 OpenAI API 的连接和功能：

```bash
node scripts/test-openai.js
```

### 测试脚本示例代码

```javascript
import OpenAI from "openai";
const client = new OpenAI();

const response = await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "请用一句话介绍你自己" }],
    max_tokens: 100
});

console.log(response.choices[0].message.content);
```

## 4. 在项目中使用 OpenAI API

我们的项目已经集成了 OpenAI 服务，您可以在以下位置找到相关代码：

- `src/services/ai/openaiService.js` - OpenAI 服务实现
- `src/services/ai/baseAIService.js` - AI 服务基础类
- `src/services/ai/aiServiceFactory.js` - AI 服务工厂
- `src/services/ai/invoiceQAService.js` - 发票问答服务（使用 OpenAI）
- `src/services/ai/ocrService.js` - OCR 服务（使用 OpenAI）

## 5. 故障排除

### 常见问题

1. **未找到 API 密钥错误**
   - 确保 `.env` 文件中设置了 `OPENAI_API_KEY`
   - 确保 API 密钥没有额外的空格或引号

2. **API 请求失败**
   - 检查网络连接
   - 验证 API 密钥是否有效
   - 检查 OpenAI 账户是否有足够的配额

3. **模块未找到错误**
   - 确保 OpenAI SDK 已正确安装：`npm install openai`
   - 尝试清除 npm 缓存：`npm cache clean --force`

### 获取帮助

如果遇到问题，请参考以下资源：
- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)
- [OpenAI SDK 文档](https://github.com/openai/openai-node)
- [OpenAI 社区论坛](https://community.openai.com/)

## 6. 下一步

设置完成后，您可以：

1. 运行发票问答服务测试：`npm run test:invoice-qa`
2. 运行 OCR 服务测试：`npm run test:ocr`
3. 运行 AI 服务测试：`npm run test:ai`
4. 开发自定义 AI 功能

祝您使用愉快！