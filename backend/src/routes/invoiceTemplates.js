const express = require('express');
const router = express.Router();
const { InvoiceTemplate, TemplateField, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// 将实例转换为普通对象（兼容 Sequelize 与内存适配器）
const toPlain = (obj) => (obj && typeof obj.toJSON === 'function' ? obj.toJSON() : obj);

// 获取用户的所有模板
router.get('/', authenticateToken, async (req, res) => {
  try {
    const templates = await InvoiceTemplate.findAll({
      where: { userId: req.user.id }
    });
    
    // 为每个模板获取字段（均转换为 plain 对象，确保含有 id 等字段）
    const templatesWithFields = await Promise.all(templates.map(async (template) => {
      const plainTemplate = toPlain(template);
      const templateFields = await TemplateField.findAll({
        where: { templateId: plainTemplate.id }
      });
      const fieldsPlain = (templateFields || []).map(f => toPlain(f));
      return {
        ...plainTemplate,
        TemplateFields: fieldsPlain
      };
    }));
    
    res.json(templatesWithFields);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// 获取默认模板
router.get('/default', authenticateToken, async (req, res) => {
  try {
    const template = await InvoiceTemplate.findOne({
      where: { 
        userId: req.user.id,
        isDefault: true,
        isActive: true 
      }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Default template not found' });
    }

    const plainTemplate = toPlain(template);
    const templateFields = await TemplateField.findAll({
      where: { templateId: plainTemplate.id }
    });
    const fieldsPlain = (templateFields || []).map(f => toPlain(f));
    const responseTemplate = { ...plainTemplate, TemplateFields: fieldsPlain };
    
    res.json({ template: responseTemplate });
  } catch (error) {
    console.error('Error fetching default template:', error);
    res.status(500).json({ error: 'Failed to fetch default template' });
  }
});

// 获取特定模板
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await InvoiceTemplate.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const plainTemplate = toPlain(template);
    const templateFields = await TemplateField.findAll({
      where: { templateId: plainTemplate.id }
    });
    const fieldsPlain = (templateFields || []).map(f => toPlain(f));
    const responseTemplate = { ...plainTemplate, TemplateFields: fieldsPlain };
    
    res.json({ template: responseTemplate });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// 创建新模板
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, templateConfig, fieldMappings, isDefault } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Template name cannot be empty' });
    }
    
    // 如果没有提供templateConfig，使用默认配置
    const defaultTemplateConfig = {
      layout: 'standard',
      showLogo: true,
      showCompanyInfo: true,
      showClientInfo: true,
      showItemDetails: true,
      showTotals: true,
      fields: []
    };
    
    const finalTemplateConfig = templateConfig || defaultTemplateConfig;
    
    // 从templateConfig中提取fields
    const fields = finalTemplateConfig.fields || [];
    
    // 如果设置为默认模板，取消其他默认模板
    if (isDefault) {
      await InvoiceTemplate.update(
        { isDefault: false },
        { where: { userId: req.user.id, isDefault: true } }
      );
    }
    
    const template = await InvoiceTemplate.create({
      name,
      description,
      templateConfig: JSON.stringify(finalTemplateConfig),
      fieldMappings: fieldMappings ? JSON.stringify(fieldMappings) : null,
      isDefault: isDefault || false,
      isActive: true,
      userId: req.user.id
    });
    
    // 创建模板字段
    if (fields && fields.length > 0) {
      const templateFields = fields.map(field => ({
        ...field,
        templateId: toPlain(template).id,
        options: field.options ? JSON.stringify(field.options) : null,
        validation: field.validation ? JSON.stringify(field.validation) : null
      }));
      
      await TemplateField.bulkCreate(templateFields);
    }
    
    // 获取完整的模板数据（转换为 plain）
    const fullTemplate = await InvoiceTemplate.findOne({
      where: { id: toPlain(template).id }
    });
    
    const plainTemplate = toPlain(fullTemplate);
    const templateFields = await TemplateField.findAll({
      where: { templateId: plainTemplate.id }
    });
    const fieldsPlain = (templateFields || []).map(f => toPlain(f));
    
    const templateWithFields = {
      ...plainTemplate,
      TemplateFields: fieldsPlain
    };
    
    res.status(201).json({ template: templateWithFields });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// 更新模板
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await InvoiceTemplate.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });
    
    if (!template) {
      return res.status(404).json({ error: '模板未找到' });
    }
    
    const { name, description, templateConfig, fieldMappings, fields, isDefault } = req.body;
    
    // 如果设置为默认模板，取消其他默认模板
    if (isDefault && !toPlain(template).isDefault) {
      await InvoiceTemplate.update(
        { isDefault: false },
        { where: { userId: req.user.id, isDefault: true } }
      );
    }
    
    // 更新模板基本信息
    await template.update({
      name: name || toPlain(template).name,
      description: description !== undefined ? description : toPlain(template).description,
      templateConfig: templateConfig ? JSON.stringify(templateConfig) : toPlain(template).templateConfig,
      fieldMappings: fieldMappings ? JSON.stringify(fieldMappings) : toPlain(template).fieldMappings,
      isDefault: isDefault !== undefined ? isDefault : toPlain(template).isDefault
    });
    
    // 更新模板字段
    if (fields) {
      // 删除现有字段
      await TemplateField.destroy({
        where: { templateId: toPlain(template).id }
      });
      
      // 创建新字段
      if (fields.length > 0) {
        const templateFields = fields.map(field => ({
          ...field,
          templateId: toPlain(template).id,
          options: field.options ? JSON.stringify(field.options) : null,
          validation: field.validation ? JSON.stringify(field.validation) : null
        }));
        
        await TemplateField.bulkCreate(templateFields);
      }
    }
    
    // 获取更新后的完整模板数据（转换为 plain）
    const updatedTemplate = await InvoiceTemplate.findOne({
      where: { id: toPlain(template).id }
    });
    
    const plainUpdated = toPlain(updatedTemplate);
    const templateFields = await TemplateField.findAll({
      where: { templateId: plainUpdated.id }
    });
    const fieldsPlain = (templateFields || []).map(f => toPlain(f));
    
    const templateWithFields = {
      ...plainUpdated,
      TemplateFields: fieldsPlain
    };
    
    res.json({ template: templateWithFields });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// 删除模板
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await InvoiceTemplate.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });
    
    if (!template) {
      return res.status(404).json({ error: '模板未找到' });
    }
    
    // 不能删除默认模板
    if (toPlain(template).isDefault) {
      return res.status(400).json({ error: '不能删除默认模板' });
    }
    
    // 删除关联的字段
    await TemplateField.destroy({
      where: { templateId: toPlain(template).id }
    });
    
    // 删除模板 - 使用静态方法适配内存数据库模式
    await InvoiceTemplate.destroy({
      where: { id: toPlain(template).id }
    });
    
    res.json({ message: '模板删除成功' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: '删除模板失败' });
  }
});

// 设置默认模板
router.post('/:id/set-default', authenticateToken, async (req, res) => {
  try {
    const template = await InvoiceTemplate.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });
    
    if (!template) {
      return res.status(404).json({ error: '模板未找到' });
    }
    
    // 取消其他默认模板
    await InvoiceTemplate.update(
      { isDefault: false },
      { where: { userId: req.user.id, isDefault: true } }
    );
    
    // 设置当前模板为默认
    await template.update({ isDefault: true });
    
    res.json({ message: '默认模板设置成功', template: toPlain(template) });
  } catch (error) {
    console.error('Error setting default template:', error);
    res.status(500).json({ error: '设置默认模板失败' });
  }
});

module.exports = router;