import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPrinter, FiEye, FiX, FiMaximize2, FiMinimize2 } from 'react-icons/fi';

/**
 * 全新的打印预览组件 - 基于InvoicePreview.jsx模板
 * 确保打印输出与前端预览完全一致
 */

const PrintPreviewNew = ({ 
  formData, 
  clients, 
  client,
  user, 
  calculateTotals, 
  calculateItemTotal, 
  formatCurrency, 
  invoiceMode,
  selectedTemplate,
  onClose 
}) => {
  const { t } = useTranslation(['common', 'invoiceform']);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(0.8);
  const printRef = useRef();

  const { subtotal, taxAmount, total } = calculateTotals();
  const selectedClient = client || (clients && clients.find(c => 
    c.id === formData.clientId || 
    String(c.id) === String(formData.clientId)
  ));

  // 生成预览发票编号 - 与InvoicePreview保持一致，并在FR模式下对齐格式转换
  const getInvoicePrefix = () => {
    switch(invoiceMode) {
      case 'fr': return 'FR-';
      default: return 'INV-';
    }
  };
  const previewInvoiceNumber = getInvoicePrefix() + 'PREVIEW-001';

  // 显示用发票编号（支持FR模式下将 INV-YYYY-NNN 转为 FR-YYYY-000NNN）
  const formatDisplayInvoiceNumber = (rawNumber) => {
    if (!rawNumber) return previewInvoiceNumber;
    if (invoiceMode === 'fr') {
      const match = rawNumber.match(/^INV-(\d{4})-(\d{1,6})$/);
      if (match) {
        const year = match[1];
        const seq = match[2].padStart(5, '0');
        return `FR-${year}-${seq}`;
      }
    }
    return rawNumber;
  };

  // 格式化日期 - 与InvoicePreview保持一致
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 统一的金额与税率格式化（优先使用 fr-FR，当 invoiceMode 为 fr）
  const currencyCode = formData?.currency || user?.Company?.currency || 'EUR';
  const formatCurrencyUnified = (amount) => {
    const num = Number(amount ?? 0);
    if (invoiceMode === 'fr') {
      try {
        const formatted = new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(num);
        return formatted.replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ');
      } catch (e) {
        return `${currencyCode} ${num.toFixed(2)}`;
      }
    }
    return typeof formatCurrency === 'function' ? formatCurrency(num, currencyCode) : `${currencyCode} ${num.toFixed(2)}`;
  };

  const formatPercentageUnified = (value) => {
    const rate = Number(value ?? 0);
    if (invoiceMode === 'fr') {
      try {
        return new Intl.NumberFormat('fr-FR', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }).format(rate / 100);
      } catch (e) {
        return `${rate.toFixed(1)} %`;
      }
    }
    return `${rate} %`;
  };

  // 获取交付地址 - 对齐后端 pdfServiceNew 的优先级并包含城市/邮编/国家
  const getDeliveryAddress = () => {
    const clientUseSameAddress = selectedClient?.sameAsAddress === true || formData?.deliveryAddressSameAsBilling === true;
    const hasClientBillingAddress = !!(selectedClient?.address || selectedClient?.city || selectedClient?.postalCode || selectedClient?.country);

    // 1) 发票级别地址（包含表单字段）
    if (formData?.deliveryAddress || formData?.deliveryCity || formData?.deliveryPostalCode || formData?.deliveryCountry || (formData?.customDeliveryAddress && formData.customDeliveryAddress.trim())) {
      return {
        type: 'invoice',
        address: (formData?.customDeliveryAddress?.trim()) || formData?.deliveryAddress || '',
        city: formData?.deliveryCity || '',
        postalCode: formData?.deliveryPostalCode || '',
        country: formData?.deliveryCountry || ''
      };
    }

    // 2) 与账单地址相同
    if (clientUseSameAddress && hasClientBillingAddress) {
      return {
        type: 'billing',
        address: selectedClient?.address || '',
        city: selectedClient?.city || '',
        postalCode: selectedClient?.postalCode || '',
        country: selectedClient?.country || ''
      };
    }

    // 3) 客户独立交付地址
    if (selectedClient?.deliveryAddress || selectedClient?.deliveryCity || selectedClient?.deliveryPostalCode || selectedClient?.deliveryCountry) {
      return {
        type: 'client',
        address: selectedClient?.deliveryAddress || '',
        city: selectedClient?.deliveryCity || '',
        postalCode: selectedClient?.deliveryPostalCode || '',
        country: selectedClient?.deliveryCountry || ''
      };
    }

    // 4) 无交付地址
    return { type: 'none', address: '', city: '', postalCode: '', country: '' };
  };

  // 获取TVA信息显示文本 - 与InvoicePreview保持一致
  const getTVAInfoText = () => {
    if (invoiceMode !== 'fr') return '';
    if (formData.tvaExempt) {
      return "TVA non applicable, art. 293 B du CGI";
    } else if (formData.autoLiquidation) {
      return "Autoliquidation de la TVA par le preneur";
    }
    return '';
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture ${previewInvoiceNumber}</title>
          <meta charset="utf-8">
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 12pt;
              line-height: 1.4;
              color: #000;
              background: white;
              margin: 0;
              padding: 0;
            }
            
            .print-container {
              max-width: 210mm;
              margin: 0 auto;
              background: white;
              padding: 0;
            }
            
            /* 头部信息样式 */
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 20px;
            }
            
            .company-info, .client-info {
              width: 45%;
            }
            
            .company-info h2, .client-info h2 {
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 10px;
              color: #1f2937;
            }
            
            .company-info p, .client-info p {
              margin: 3px 0;
              font-size: 11pt;
            }
            
            /* 发票详情样式 */
            .invoice-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            
            .invoice-details .left {
              width: 45%;
            }
            
            .invoice-details .right {
              width: 45%;
              text-align: right;
            }
            
            .invoice-info-item {
              margin-bottom: 8px;
              display: flex;
              justify-content: flex-end;
              align-items: baseline;
            }
            
            .invoice-info-item .label {
              font-size: 11pt;
              font-weight: normal;
              margin-right: 10px;
              min-width: 120px;
              text-align: right;
            }
            
            .invoice-info-item .value {
              font-size: 11pt;
              font-weight: normal;
            }
            
            /* 法国特定字段样式 */
            .french-fields {
              margin-bottom: 20px;
            }
            
            .french-fields h3 {
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 10px;
              color: #1f2937;
            }
            
            .french-fields p {
              margin: 5px 0;
              font-size: 11pt;
            }
            
            /* 交付地址样式 */
            .delivery-address {
              margin-bottom: 20px;
            }
            
            .delivery-address h3 {
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 10px;
              color: #1f2937;
            }
            
            /* 项目表格样式 */
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            
            .items-table th {
              background: #f9fafb;
              padding: 10px;
              text-align: left;
              font-weight: bold;
              border: 1px solid #e5e7eb;
              font-size: 11pt;
            }
            
            .items-table td {
              padding: 10px;
              border: 1px solid #e5e7eb;
              font-size: 10pt;
            }
            
            .items-table tr:nth-child(even) {
              background: #fafafa;
            }
            
            /* 总计样式 */
            .totals {
              text-align: right;
              margin-bottom: 30px;
            }
            
            .totals table {
              margin-left: auto;
              border-collapse: collapse;
            }
            
            .totals td {
              padding: 5px 15px;
              font-size: 11pt;
            }
            
            .totals .total-row {
              font-weight: bold;
              font-size: 12pt;
              border-top: 2px solid #1f2937;
            }
            
            /* TVA信息样式 */
            .tva-info {
              margin-bottom: 20px;
              padding: 10px;
              background: #f0f9ff;
              border-left: 4px solid #3b82f6;
            }
            
            .tva-info h3 {
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 5px;
              color: #1f2937;
            }
            
            /* 银行信息样式 */
            .bank-info {
              margin-bottom: 30px;
            }
            
            .bank-info h3 {
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 10px;
              color: #1f2937;
            }
            
            .bank-info p {
              margin: 5px 0;
              font-size: 11pt;
            }
            
            /* 法律条款样式 */
            .legal-clauses {
              margin-top: 30px;
              page-break-inside: avoid;
            }
            
            .legal-clauses h3 {
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 15px;
              color: #1f2937;
            }
            
            .legal-clause {
              margin-bottom: 15px;
            }
            
            .legal-clause h4 {
              font-size: 11pt;
              font-weight: bold;
              margin-bottom: 5px;
              color: #374151;
            }
            
            .legal-clause p {
              font-size: 10pt;
              line-height: 1.4;
              text-align: justify;
            }
            
            /* 分页样式 */
            .page {
              width: 210mm;
              min-height: 297mm;
              padding: 20mm;
              margin: 0 auto;
              background: white;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              page-break-after: always;
              position: relative;
            }
            
            .page:last-child {
              page-break-after: auto;
            }
            
            .page-1 {
              /* 第一页内容 */
            }
            
            .page-2 {
              /* 第二页内容 */
            }
            
            /* 打印时隐藏不必要元素 */
            @media print {
              .no-print {
                display: none !important;
              }
              
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                margin: 0;
                padding: 0;
              }
              
              .page {
                width: 210mm;
                height: 297mm;
                padding: 20mm;
                margin: 0;
                box-shadow: none;
                page-break-after: always;
              }
              
              .page:last-child {
                page-break-after: auto;
              }
              
              /* 确保内容不会跨页 */
              .legal-clauses {
                page-break-inside: avoid;
              }
              
              .legal-clause {
                page-break-inside: avoid;
                margin-bottom: 15px;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const deliveryInfo = getDeliveryAddress();
  const tvaInfoText = getTVAInfoText();

  // 统一银行信息映射：优先 Company.bankInfo，其次 settings 中的平铺字段
  const bankInfo = {
    iban: user?.Company?.bankInfo?.iban || user?.bankIBAN || formData?.bankIBAN || '',
    bic: user?.Company?.bankInfo?.bic || user?.bankBIC || formData?.bankBIC || '',
    bankName: user?.Company?.bankInfo?.bankName || user?.bankName || '',
    accountHolder: user?.Company?.bankInfo?.accountHolder || user?.accountHolder || [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  };

  // 统一的公司/法律信息映射优先级
  const sellerInfo = {
    name: formData?.sellerCompanyName || user?.companyName || user?.Company?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' '),
    address: formData?.sellerAddress || user?.address || user?.Company?.address,
    city: user?.city || user?.Company?.city,
    postalCode: user?.postalCode || user?.Company?.postalCode,
    phone: formData?.sellerPhone || user?.phone || user?.Company?.phone,
    email: formData?.sellerEmail || user?.email || user?.Company?.email,
    vatNumber: formData?.sellerVATNumber || user?.vatNumber || user?.Company?.vatNumber,
    siren: formData?.sellerSIREN || user?.sirenNumber || user?.siren || user?.Company?.sirenNumber,
    siret: formData?.sellerSIRET || user?.siretNumber || user?.Company?.siretNumber,
    legalForm: formData?.sellerLegalForm || user?.legalForm || user?.Company?.legalForm,
    registeredCapital: formData?.sellerRegisteredCapital || user?.registeredCapital || user?.Company?.registeredCapital,
    rcsNumber: formData?.sellerRCS || user?.rcsNumber || user?.Company?.rcsNumber,
    nafCode: formData?.sellerNAF || user?.Company?.nafCode || user?.nafCode
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-white rounded-lg shadow-xl ${isFullscreen ? 'w-full h-full' : 'max-w-6xl max-h-[90vh]'} flex flex-col`}>
        {/* 工具栏 */}
        <div className="flex justify-between items-center p-4 border-b no-print">
          <h2 className="text-xl font-bold text-gray-800">
            {t('common:printPreview')}
          </h2>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Zoom:</label>
              <select 
                value={scale} 
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={0.5}>50%</option>
                <option value={0.75}>75%</option>
                <option value={0.8}>80%</option>
                <option value={1}>100%</option>
                <option value={1.25}>125%</option>
              </select>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <FiPrinter size={16} />
              <span>{t('common:print')}</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title={isFullscreen ? "Exit full screen" : "Full screen"}
            >
              {isFullscreen ? <FiMinimize2 size={20} /> : <FiMaximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* 预览内容 */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          <div 
            className="mx-auto bg-white shadow-lg"
            style={{ 
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              width: '210mm',
              minHeight: '297mm'
            }}
          >
            <div ref={printRef} className="print-container">
              {/* 第一页 - 发票主要信息 */}
              <div className="page page-1">
                {/* 头部信息 - 基于InvoicePreview的header结构 */}
                <div className="header">
                  {/* 公司信息 */}
                  <div className="company-info">
                    <h2>Vendeur / Prestataire</h2>
                    {sellerInfo.name && (
                      <p><strong>{sellerInfo.name}</strong></p>
                    )}
                    {sellerInfo.address && (
                      <p>{sellerInfo.address}</p>
                    )}
                    {(sellerInfo.city || sellerInfo.postalCode) && (
                      <p>{[sellerInfo.city, sellerInfo.postalCode].filter(Boolean).join(', ')}</p>
                    )}
                    {sellerInfo.phone && (
                      <p>Tél: {sellerInfo.phone}</p>
                    )}
                    {sellerInfo.email && (
                      <p>Email: {sellerInfo.email}</p>
                    )}
                    {sellerInfo.vatNumber && (
                      <p>N° TVA: {sellerInfo.vatNumber}</p>
                    )}
                    {sellerInfo.siren && (
                      <p>SIREN: {sellerInfo.siren}</p>
                    )}
                    {sellerInfo.siret && (
                      <p>SIRET: {sellerInfo.siret}</p>
                    )}
                    {sellerInfo.legalForm && (
                      <p>Forme juridique: {sellerInfo.legalForm}</p>
                    )}
                    {sellerInfo.registeredCapital !== undefined && sellerInfo.registeredCapital !== null && (
                      <p>Capital social: {formatCurrencyUnified(sellerInfo.registeredCapital)}</p>
                    )}
                    {sellerInfo.rcsNumber && (
                      <p>RCS: {sellerInfo.rcsNumber}</p>
                    )}
                    {sellerInfo.nafCode && (
                      <p>Code NAF: {sellerInfo.nafCode}</p>
                    )}
                  </div>

                  {/* 客户信息 */}
                  <div className="client-info">
                    <h2>Adresse de facturation</h2>
                    {selectedClient && (
                      <>
                        {selectedClient.companyName && (
                          <p><strong>{selectedClient.companyName}</strong></p>
                        )}
                        {selectedClient.contactName && (
                          <p>À l'attention de: {selectedClient.contactName}</p>
                        )}
                        {selectedClient.address && (
                          <p>{selectedClient.address}</p>
                        )}
                        {(selectedClient.city || selectedClient.postalCode) && (
                          <p>{[selectedClient.city, selectedClient.postalCode].filter(Boolean).join(', ')}</p>
                        )}
                        {selectedClient.country && (
                          <p>{selectedClient.country}</p>
                        )}
                        {selectedClient.vatNumber && (
                          <p>Numéro de TVA: {selectedClient.vatNumber}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* 发票详情 - 右侧垂直排列格式 */}
                <div className="invoice-details">
                  <div className="left">
                    {/* 空白区域 */}
                  </div>
                  <div className="right">
                    <div className="invoice-info-item">
                      <span className="label">N° de facture:</span>
                      <span className="value">{formatDisplayInvoiceNumber(formData.invoiceNumber)}</span>
                    </div>
                    <div className="invoice-info-item">
                      <span className="label">Date de facture:</span>
                      <span className="value">{formatDate(formData.invoiceDate)}</span>
                    </div>
                    {formData.serviceDate && (
                      <div className="invoice-info-item">
                        <span className="label">Date de prestation:</span>
                        <span className="value">{formatDate(formData.serviceDate)}</span>
                      </div>
                    )}
                    {formData.dueDate && (
                      <div className="invoice-info-item">
                        <span className="label">Date d'échéance:</span>
                        <span className="value">{formatDate(formData.dueDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 移除了订单参考和合同参考的显示，以简化发票界面 */}

                {/* 交付地址 - 基于InvoicePreview的delivery-address */}
                {invoiceMode === 'fr' && (deliveryInfo.address || deliveryInfo.city || deliveryInfo.postalCode || deliveryInfo.country) && (
                  <div className="delivery-address">
                    <h3>Adresse de livraison</h3>
                    {selectedClient && (
                      <>
                        {selectedClient.companyName && (
                          <p><strong>{selectedClient.companyName}</strong></p>
                        )}
                        {selectedClient.contactName && (
                          <p>{selectedClient.contactName}</p>
                        )}
                        {deliveryInfo.address && (
                          <p>{deliveryInfo.address}</p>
                        )}
                        {(deliveryInfo.city || deliveryInfo.postalCode) && (
                          <p>{[deliveryInfo.city, deliveryInfo.postalCode].filter(Boolean).join(', ')}</p>
                        )}
                        {deliveryInfo.country && (
                          <p>{deliveryInfo.country}</p>
                        )}
                        {deliveryInfo.type === 'invoice' && (
                          <p style={{ fontSize: '9pt', color: '#2563eb' }}>📍 Adresse de livraison personnalisée</p>
                        )}
                        {deliveryInfo.type === 'billing' && (
                          <p style={{ fontSize: '9pt', color: '#2563eb' }}>✓ Identique à l'adresse de facturation</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* 项目表格 - 基于InvoicePreview的items-table */}
                <div>
                  <h3 style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '15px', color: '#1f2937' }}>
                    Détail des prestations
                  </h3>
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Qté</th>
                        <th>Prix unitaire</th>
                        <th>TVA</th>
                        <th>Total HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items && formData.items.length > 0 ? formData.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.description || '-'}</td>
                          <td>{item.quantity || 1}</td>
                          <td>{formatCurrencyUnified(item.unitPrice || 0)}</td>
                          <td>{formatPercentageUnified(item.taxRate || 0)}</td>
                          <td>{formatCurrencyUnified(calculateItemTotal(item))}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td>-</td>
                          <td>1</td>
                          <td>{formatCurrencyUnified(0)}</td>
                          <td>{formatPercentageUnified(0)}</td>
                          <td>{formatCurrencyUnified(0)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 总计 - 基于InvoicePreview的totals-section */}
                <div className="totals">
                  <table>
                    <tbody>
                      <tr>
                        <td>Sous-total HT :</td>
                        <td>{formatCurrencyUnified(subtotal)}</td>
                      </tr>
                      <tr>
                        <td>TVA {formData.items && formData.items.length > 0 && (formData.items[0].taxRate !== undefined && formData.items[0].taxRate !== null) ? formatPercentageUnified(formData.items[0].taxRate) : formatPercentageUnified(20)} :</td>
                        <td>{formatCurrencyUnified(taxAmount)}</td>
                      </tr>
                      <tr className="total-row">
                        <td>Total TTC :</td>
                        <td>{formatCurrencyUnified(total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Information TVA 块已移除，避免与底部法律条款重复显示 */}

                {/* 银行信息 - 恢复显示，来源于设置页字段 */}
                {invoiceMode === 'fr' && (bankInfo.iban || bankInfo.bic || bankInfo.bankName || bankInfo.accountHolder) && (
                  <div className="bank-info">
                    <h3>Informations bancaires</h3>
                    {bankInfo.iban && (
                      <p><strong>IBAN:</strong> <span style={{ fontFamily: 'monospace' }}>{bankInfo.iban}</span></p>
                    )}
                    {bankInfo.bic && (
                      <p><strong>BIC/SWIFT:</strong> <span style={{ fontFamily: 'monospace' }}>{bankInfo.bic}</span></p>
                    )}
                    {bankInfo.bankName && (
                      <p><strong>Banque:</strong> {bankInfo.bankName}</p>
                    )}
                    {bankInfo.accountHolder && (
                      <p><strong>Titulaire:</strong> {bankInfo.accountHolder}</p>
                    )}
                  </div>
                )}
              </div>

              {/* 第二页 - 法律条款 */}
              {invoiceMode === 'fr' && (
                <div className="page page-2">
                  <div className="legal-clauses">
                    <h3>Conditions légales</h3>
                    
                    <div className="legal-clause">
                      <h4>Identité du prestataire:</h4>
                      <p>Le prestataire certifie l'exactitude des informations figurant sur cette facture conformément à l'article 289 du Code général des impôts. Toutes les mentions légales obligatoires sont présentes sur cette facture.</p>
                    </div>
                    
                    <div className="legal-clause">
                      <h4>Conditions de paiement:</h4>
                      <p>Paiement à {formData.paymentTerms || '30'} jours. En cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux d'intérêt légal en vigueur seront appliquées de plein droit, ainsi qu'une indemnité forfaitaire de 40€ pour frais de recouvrement (articles L441-6 et D441-5 du Code de commerce).</p>
                    </div>
                    
                    <div className="legal-clause">
                      <h4>Clause de réserve de propriété:</h4>
                      <p>Les marchandises demeurent la propriété du vendeur jusqu'au paiement intégral du prix, conformément à la loi n°80-335 du 12 mai 1980. Le défaut de paiement à l'échéance rend exigible l'intégralité des sommes dues.</p>
                    </div>
                    
                    <div className="legal-clause">
                      <h4>Garantie de conformité:</h4>
                      <p>Les prestations sont réalisées conformément aux règles de l'art et aux normes en vigueur. Le prestataire garantit la conformité de ses prestations aux spécifications convenues. Toute réclamation doit être formulée par écrit dans les 8 jours suivant la livraison.</p>
                    </div>
                    
                    <div className="legal-clause">
                      <h4>Vices cachés:</h4>
                      <p>Conformément aux articles 1641 à 1649 du Code civil, le prestataire est tenu de la garantie à raison des défauts cachés qui rendent la chose impropre à l'usage auquel on la destine, ou qui diminuent tellement cet usage que l'acheteur ne l'aurait pas acquise.</p>
                    </div>
                    
                    <div className="legal-clause">
                      <h4>Règlement des litiges:</h4>
                      <p>Tout litige relatif à l'interprétation et à l'exécution des présentes sera soumis aux tribunaux compétents du ressort du siège social du prestataire. Le droit français est seul applicable.</p>
                    </div>
                    
                    <div className="legal-clause">
                      <h4>Protection des données:</h4>
                      <p>Conformément au RGPD et à la loi Informatique et Libertés, les données personnelles collectées sont traitées pour les besoins de la relation commerciale. Vous disposez d'un droit d'accès, de rectification et de suppression de vos données.</p>
                    </div>
                    
                    <div className="legal-clause">
                      <h4>Délai de prescription:</h4>
                      <p>Conformément à l'article L110-4 du Code de commerce, toute action judiciaire relative aux obligations nées du présent contrat se prescrit par 5 ans à compter de la naissance de l'obligation.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPreviewNew;