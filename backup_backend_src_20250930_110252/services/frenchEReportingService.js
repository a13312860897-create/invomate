/**
 * 法国电子发票报告服务
 * 实现DGFiP (Direction Générale des Finances Publiques) 集成
 * 支持Peppol网络和法国特定的电子发票要求
 */

const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 法国VAT税率配置
 */
const FRENCH_VAT_RATES = {
  standard: { rate: 20.0, code: 'S', description: 'Taux normal' },
  reduced: { rate: 10.0, code: 'AA', description: 'Taux réduit' },
  super_reduced: { rate: 5.5, code: 'AB', description: 'Taux super réduit' },
  special: { rate: 2.1, code: 'AC', description: 'Taux particulier' },
  zero: { rate: 0.0, code: 'Z', description: 'Exonéré' },
  exempt: { rate: 0.0, code: 'E', description: 'Non soumis' }
};

/**
 * DGFiP API配置
 */
const DGFIP_CONFIG = {
  sandbox: {
    baseUrl: 'https://sandbox-api.impots.gouv.fr/cpro/factures',
    authUrl: 'https://sandbox-oauth.impots.gouv.fr/auth/realms/dgfip/protocol/openid-connect/token'
  },
  production: {
    baseUrl: 'https://api.impots.gouv.fr/cpro/factures',
    authUrl: 'https://oauth.impots.gouv.fr/auth/realms/dgfip/protocol/openid-connect/token'
  }
};

/**
 * Peppol网络配置
 */
const PEPPOL_CONFIG = {
  sandbox: {
    baseUrl: 'https://sandbox.peppol.eu/api/v1',
    accessPointUrl: 'https://sandbox-ap.peppol.eu'
  },
  production: {
    baseUrl: 'https://api.peppol.eu/v1',
    accessPointUrl: 'https://ap.peppol.eu'
  }
};

class FrenchEReportingService {
  constructor() {
    this.environment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
    this.dgfipConfig = DGFIP_CONFIG[this.environment];
    this.peppolConfig = PEPPOL_CONFIG[this.environment];
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * 获取DGFiP访问令牌
   */
  async getDGFiPAccessToken() {
    try {
      // 检查现有令牌是否仍然有效
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.accessToken;
      }

      const response = await axios.post(this.dgfipConfig.authUrl, {
        grant_type: 'client_credentials',
        client_id: process.env.DGFIP_CLIENT_ID,
        client_secret: process.env.DGFIP_CLIENT_SECRET,
        scope: 'factures:write factures:read'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      // 设置令牌过期时间（提前5分钟刷新）
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 300) * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('DGFiP authentication error:', error.response?.data || error.message);
      throw new Error(`DGFiP认证失败: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * 生成UBL XML格式的发票
   */
  generateUBLXML(invoiceData) {
    const builder = new xml2js.Builder({
      rootName: 'Invoice',
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { pretty: true, indent: '  ' }
    });

    // 构建UBL发票结构
    const ublInvoice = {
      $: {
        'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
        'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2'
      },
      'cbc:UBLVersionID': '2.1',
      'cbc:CustomizationID': 'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0',
      'cbc:ProfileID': 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
      'cbc:ID': invoiceData.invoiceNumber,
      'cbc:IssueDate': invoiceData.issueDate.split('T')[0],
      'cbc:DueDate': invoiceData.dueDate.split('T')[0],
      'cbc:InvoiceTypeCode': '380', // Commercial invoice
      'cbc:Note': invoiceData.notes || '',
      'cbc:DocumentCurrencyCode': invoiceData.currency || 'EUR',
      
      // 供应商信息
      'cac:AccountingSupplierParty': {
        'cac:Party': {
          'cbc:EndpointID': {
            $: { schemeID: 'FR:SIREN' },
            _: invoiceData.supplier.siren
          },
          'cac:PartyName': {
            'cbc:Name': invoiceData.supplier.name
          },
          'cac:PostalAddress': {
            'cbc:StreetName': invoiceData.supplier.address,
            'cbc:CityName': invoiceData.supplier.city,
            'cbc:PostalZone': invoiceData.supplier.postalCode,
            'cac:Country': {
              'cbc:IdentificationCode': 'FR'
            }
          },
          'cac:PartyTaxScheme': {
            'cbc:CompanyID': invoiceData.supplier.vatNumber,
            'cac:TaxScheme': {
              'cbc:ID': 'VAT'
            }
          }
        }
      },
      
      // 客户信息
      'cac:AccountingCustomerParty': {
        'cac:Party': {
          'cac:PartyName': {
            'cbc:Name': invoiceData.customer.name
          },
          'cac:PostalAddress': {
            'cbc:StreetName': invoiceData.customer.address,
            'cbc:CityName': invoiceData.customer.city,
            'cbc:PostalZone': invoiceData.customer.postalCode,
            'cac:Country': {
              'cbc:IdentificationCode': invoiceData.customer.countryCode || 'FR'
            }
          }
        }
      },
      
      // 发票行项目
      'cac:InvoiceLine': invoiceData.items.map((item, index) => ({
        'cbc:ID': index + 1,
        'cbc:InvoicedQuantity': {
          $: { unitCode: 'C62' }, // 件数
          _: item.quantity
        },
        'cbc:LineExtensionAmount': {
          $: { currencyID: invoiceData.currency || 'EUR' },
          _: (item.quantity * item.unitPrice).toFixed(2)
        },
        'cac:Item': {
          'cbc:Description': item.description,
          'cbc:Name': item.description,
          'cac:ClassifiedTaxCategory': {
            'cbc:ID': this.getVATCode(item.taxRate),
            'cbc:Percent': item.taxRate,
            'cac:TaxScheme': {
              'cbc:ID': 'VAT'
            }
          }
        },
        'cac:Price': {
          'cbc:PriceAmount': {
            $: { currencyID: invoiceData.currency || 'EUR' },
            _: item.unitPrice.toFixed(2)
          }
        }
      })),
      
      // 税务汇总
      'cac:TaxTotal': {
        'cbc:TaxAmount': {
          $: { currencyID: invoiceData.currency || 'EUR' },
          _: invoiceData.totalTax.toFixed(2)
        },
        'cac:TaxSubtotal': this.generateTaxSubtotals(invoiceData.items, invoiceData.currency)
      },
      
      // 金额汇总
      'cac:LegalMonetaryTotal': {
        'cbc:LineExtensionAmount': {
          $: { currencyID: invoiceData.currency || 'EUR' },
          _: invoiceData.subtotal.toFixed(2)
        },
        'cbc:TaxExclusiveAmount': {
          $: { currencyID: invoiceData.currency || 'EUR' },
          _: invoiceData.subtotal.toFixed(2)
        },
        'cbc:TaxInclusiveAmount': {
          $: { currencyID: invoiceData.currency || 'EUR' },
          _: invoiceData.total.toFixed(2)
        },
        'cbc:PayableAmount': {
          $: { currencyID: invoiceData.currency || 'EUR' },
          _: invoiceData.total.toFixed(2)
        }
      }
    };

    return builder.buildObject(ublInvoice);
  }

  /**
   * 获取VAT代码
   */
  getVATCode(taxRate) {
    for (const [key, config] of Object.entries(FRENCH_VAT_RATES)) {
      if (Math.abs(config.rate - taxRate) < 0.01) {
        return config.code;
      }
    }
    return 'S'; // 默认标准税率
  }

  /**
   * 生成税务子项
   */
  generateTaxSubtotals(items, currency) {
    const taxGroups = {};
    
    items.forEach(item => {
      const taxRate = item.taxRate;
      if (!taxGroups[taxRate]) {
        taxGroups[taxRate] = {
          taxableAmount: 0,
          taxAmount: 0
        };
      }
      
      const lineAmount = item.quantity * item.unitPrice;
      const taxAmount = lineAmount * (taxRate / 100);
      
      taxGroups[taxRate].taxableAmount += lineAmount;
      taxGroups[taxRate].taxAmount += taxAmount;
    });
    
    return Object.entries(taxGroups).map(([rate, amounts]) => ({
      'cbc:TaxableAmount': {
        $: { currencyID: currency || 'EUR' },
        _: amounts.taxableAmount.toFixed(2)
      },
      'cbc:TaxAmount': {
        $: { currencyID: currency || 'EUR' },
        _: amounts.taxAmount.toFixed(2)
      },
      'cac:TaxCategory': {
        'cbc:ID': this.getVATCode(parseFloat(rate)),
        'cbc:Percent': parseFloat(rate),
        'cac:TaxScheme': {
          'cbc:ID': 'VAT'
        }
      }
    }));
  }

  /**
   * 提交发票到DGFiP
   */
  async submitToDGFiP(invoiceData) {
    try {
      const accessToken = await this.getDGFiPAccessToken();
      const xmlContent = this.generateUBLXML(invoiceData);
      
      const response = await axios.post(`${this.dgfipConfig.baseUrl}/submit`, {
        invoice: {
          format: 'UBL',
          content: Buffer.from(xmlContent).toString('base64'),
          metadata: {
            invoiceNumber: invoiceData.invoiceNumber,
            issueDate: invoiceData.issueDate,
            supplierVAT: invoiceData.supplier.vatNumber,
            customerVAT: invoiceData.customer.vatNumber,
            totalAmount: invoiceData.total,
            currency: invoiceData.currency || 'EUR'
          }
        }
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Environment': this.environment
        }
      });
      
      return {
        success: true,
        submissionId: response.data.submissionId,
        status: response.data.status,
        validationCode: response.data.validationCode,
        timestamp: new Date().toISOString(),
        environment: this.environment
      };
    } catch (error) {
      console.error('DGFiP submission error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.code,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 通过Peppol网络发送发票
   */
  async sendViaPeppol(invoiceData, recipientId) {
    try {
      const xmlContent = this.generateUBLXML(invoiceData);
      
      const response = await axios.post(`${this.peppolConfig.baseUrl}/documents/send`, {
        document: {
          format: 'UBL-Invoice-2.1',
          content: Buffer.from(xmlContent).toString('base64')
        },
        sender: {
          identifier: invoiceData.supplier.peppolId,
          scheme: 'FR:SIREN'
        },
        recipient: {
          identifier: recipientId,
          scheme: 'FR:SIREN'
        },
        metadata: {
          documentType: 'Invoice',
          processId: 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
          documentId: invoiceData.invoiceNumber
        }
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.PEPPOL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        messageId: response.data.messageId,
        status: response.data.status,
        timestamp: new Date().toISOString(),
        peppolNetwork: true
      };
    } catch (error) {
      console.error('Peppol submission error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.code,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 查询DGFiP提交状态
   */
  async checkDGFiPStatus(submissionId) {
    try {
      const accessToken = await this.getDGFiPAccessToken();
      
      const response = await axios.get(`${this.dgfipConfig.baseUrl}/status/${submissionId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return {
        success: true,
        submissionId,
        status: response.data.status,
        validationResult: response.data.validationResult,
        processingTime: response.data.processingTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('DGFiP status check error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 验证法国VAT号码
   */
  async validateFrenchVAT(vatNumber) {
    try {
      // 法国VAT号码格式: FR + 2位校验码 + 9位SIREN号码
      const vatRegex = /^FR[0-9A-Z]{2}[0-9]{9}$/;
      
      if (!vatRegex.test(vatNumber)) {
        return {
          valid: false,
          error: 'Invalid French VAT number format'
        };
      }
      
      // 调用欧盟VIES系统验证
      const response = await axios.get(`https://ec.europa.eu/taxation_customs/vies/rest-api/ms/FR/vat/${vatNumber.substring(2)}`);
      
      return {
        valid: response.data.valid,
        name: response.data.name,
        address: response.data.address,
        requestDate: response.data.requestDate
      };
    } catch (error) {
      console.error('VAT validation error:', error.message);
      return {
        valid: false,
        error: 'VAT validation service unavailable'
      };
    }
  }
}

module.exports = FrenchEReportingService;