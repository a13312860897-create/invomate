/**
 * 法国发票合规性验证中间件
 * 根据Article 242 nonies A du CGI要求验证法国发票必填字段
 */

const frenchComplianceValidator = (req, res, next) => {
  try {
    const { invoiceMode } = req.body;
    
    // 只对法国模式发票进行验证
    if (invoiceMode !== 'fr') {
      return next();
    }

    const errors = [];
    const { 
      issueDate, 
      dueDate, 
      items,
      sellerCompanyName,
      sellerCompanyAddress,
      sellerTaxId,
      sellerSiren,
      clientId,
      tvaExemptClause,
      tvaExempt
    } = req.body;

    // 1. 验证发票日期（必填）
    if (!issueDate) {
      errors.push({
        field: 'issueDate',
        message: 'Date d\'émission obligatoire selon Article 242 nonies A',
        code: 'MISSING_ISSUE_DATE'
      });
    }

    // 2. 验证到期日期（必填）
    if (!dueDate) {
      errors.push({
        field: 'dueDate',
        message: 'Date d\'échéance obligatoire',
        code: 'MISSING_DUE_DATE'
      });
    }

    // 3. 验证卖方信息（必填）
    if (!sellerCompanyName) {
      errors.push({
        field: 'sellerCompanyName',
        message: 'Nom de l\'entreprise vendeur obligatoire',
        code: 'MISSING_SELLER_NAME'
      });
    }

    if (!sellerCompanyAddress) {
      errors.push({
        field: 'sellerCompanyAddress',
        message: 'Adresse du vendeur obligatoire',
        code: 'MISSING_SELLER_ADDRESS'
      });
    }

    // 4. 验证VAT号码（必填且格式正确）
    if (!sellerTaxId) {
      errors.push({
        field: 'sellerTaxId',
        message: 'Numéro de TVA obligatoire selon Article 242 nonies A',
        code: 'MISSING_VAT_NUMBER'
      });
    } else {
      const frenchVATRegex = /^FR[0-9A-Z]{2}[0-9]{9}$/;
      if (!frenchVATRegex.test(sellerTaxId)) {
        errors.push({
          field: 'sellerTaxId',
          message: 'Format de numéro de TVA français invalide (FR + 2 caractères + 9 chiffres)',
          code: 'INVALID_VAT_FORMAT'
        });
      }
    }

    // 5. 验证SIREN号码（必填且格式正确）
    if (!sellerSiren) {
      errors.push({
        field: 'sellerSiren',
        message: 'Numéro SIREN obligatoire selon Article 242 nonies A',
        code: 'MISSING_SIREN'
      });
    } else {
      const sirenRegex = /^[0-9]{9}$/;
      if (!sirenRegex.test(sellerSiren)) {
        errors.push({
          field: 'sellerSiren',
          message: 'Format SIREN invalide (9 chiffres requis)',
          code: 'INVALID_SIREN_FORMAT'
        });
      }
    }

    // 6. 验证买方信息（必填）
    if (!clientId) {
      errors.push({
        field: 'clientId',
        message: 'Informations de l\'acheteur obligatoires',
        code: 'MISSING_BUYER_INFO'
      });
    }

    // 7. 验证发票项目（必填）
    if (!items || items.length === 0) {
      errors.push({
        field: 'items',
        message: 'Au moins un article obligatoire',
        code: 'MISSING_ITEMS'
      });
    } else {
      // 验证每个项目的必填字段
      items.forEach((item, index) => {
        if (!item.description) {
          errors.push({
            field: `items[${index}].description`,
            message: `Description obligatoire pour l'article ${index + 1}`,
            code: 'MISSING_ITEM_DESCRIPTION'
          });
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push({
            field: `items[${index}].quantity`,
            message: `Quantité valide obligatoire pour l'article ${index + 1}`,
            code: 'INVALID_ITEM_QUANTITY'
          });
        }
        if (!item.unitPrice || item.unitPrice < 0) {
          errors.push({
            field: `items[${index}].unitPrice`,
            message: `Prix unitaire valide obligatoire pour l'article ${index + 1}`,
            code: 'INVALID_ITEM_PRICE'
          });
        }
      });
    }

    // 8. 验证TVA豁免条款（如果适用）
    if (tvaExempt === true) {
      if (!tvaExemptClause || tvaExemptClause.trim() === '') {
        errors.push({
          field: 'tvaExemptClause',
          message: 'Mention d\'exonération TVA obligatoire selon Article 242 nonies A',
          code: 'MISSING_TVA_EXEMPT_CLAUSE'
        });
      } else {
        // 验证豁免条款是否包含必要的法律依据
        const validExemptReferences = [
          'art. 293 B',
          'article 293 B',
          'CGI art. 293 B',
          'exonération',
          'TVA non applicable'
        ];
        
        const hasValidReference = validExemptReferences.some(ref => 
          tvaExemptClause.toLowerCase().includes(ref.toLowerCase())
        );
        
        if (!hasValidReference) {
          errors.push({
            field: 'tvaExemptClause',
            message: 'La mention d\'exonération doit inclure une référence légale (ex: art. 293 B du CGI)',
            code: 'INVALID_TVA_EXEMPT_CLAUSE'
          });
        }
      }
    }

    // 如果有验证错误，返回错误响应
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de conformité française détectées',
        errors: errors,
        complianceStandard: 'Article 242 nonies A du CGI'
      });
    }

    // 验证通过，继续处理
    next();
  } catch (error) {
    console.error('French compliance validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation de conformité',
      error: error.message
    });
  }
};

module.exports = frenchComplianceValidator;