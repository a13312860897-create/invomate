# 🎯 法国发票合规性验证工具使用指南

## 📋 参照模板已准备就绪

### ✅ 完全合规的发票模板已创建：

1. **JSON模板文件**: `compliant-invoice-template.json`
   - 包含所有必需的法国法律字段
   - 符合法国商业法典要求
   - 包含RCS、SIREN、SIRET等法律信息

2. **PDF模板文件**: `generated_pdfs/COMPLIANT_INVOICE_TEMPLATE.pdf`
   - 基于JSON模板生成的正式PDF发票
   - 包含完整的法律条款和格式
   - 可直接用作参考标准

## 🔍 如何验证其他发票

### 方法1：使用验证工具
```bash
# 验证任何JSON格式的发票文件
node check-invoice-compliance.js 路径/到/你的发票.json
```

### 方法2：快速测试
```bash
# 运行内置的测试发票验证
node validate-invoice.js
```

## 📊 合规性检查项目

### 必填字段（销售方信息）：
- ✅ 公司名称 (sellerCompanyName)
- ✅ 公司地址 (sellerCompanyAddress) 
- ✅ 税号 (sellerTaxId)
- ✅ SIREN号码 (sellerSiren)
- ✅ SIRET号码 (sellerSiret)
- ✅ 法律形式 (sellerLegalForm)
- ✅ 注册资本 (sellerRegisteredCapital)
- ✅ RCS号码 (sellerRcsNumber)
- ✅ NAF代码 (sellerNafCode)

### 必填字段（发票信息）：
- ✅ 发票号码 (invoiceNumber)
- ✅ 发票日期 (invoiceDate)
- ✅ 到期日期 (dueDate)
- ✅ 商品/服务列表 (items)
- ✅ 金额计算 (subtotal, taxAmount, total)
- ✅ 货币 (currency)

### 法律条款：
- ✅ 隐藏缺陷条款 (vicesCachés)
- ✅ 付款条件 (termsAndConditions)
- ✅ 逾期罚款信息
- ✅ TVA相关信息

## 🎯 使用步骤

1. **查看参照模板**:
   ```bash
   type compliant-invoice-template.json
   ```

2. **验证您的发票**:
   ```bash
   node check-invoice-compliance.js 你的发票文件.json
   ```

3. **检查验证结果**:
   - 合规性评分 (100分制)
   - 缺失字段提醒
   - 改进建议

## 📁 重要文件位置

- **参照模板**: `G:\发票软件\backend\compliant-invoice-template.json`
- **PDF模板**: `G:\发票软件\backend\generated_pdfs\COMPLIANT_INVOICE_TEMPLATE.pdf`
- **验证工具**: `G:\发票软件\backend\check-invoice-compliance.js`
- **测试工具**: `G:\发票软件\backend\validate-invoice.js`

## ✅ 当前状态

- ✅ 完全合规的发票模板已创建
- ✅ PDF格式的参照模板已生成
- ✅ 验证工具已准备就绪
- ✅ 所有法国法律要求字段已包含

您现在可以使用这些工具来验证任何发票是否符合法国法律要求和参照模板标准！