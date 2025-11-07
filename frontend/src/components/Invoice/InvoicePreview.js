import React, { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../contexts/SettingsContext';
import { useUnifiedData } from '../../contexts/UnifiedDataContext';
import { getFrenchLabel } from '../../utils/frenchLabels';

const InvoicePreview = React.memo(({ 
  formData, 
  client, 
  user,
  selectedTemplate,
  loading = false 
}) => {
  // 深度调试客户数据和交付地址
  const hasInvoiceDeliveryAddress = !!(formData.deliveryAddress || formData.deliveryCity || formData.deliveryPostalCode || formData.deliveryCountry);
  const hasClientDeliveryAddress = !!(client?.deliveryAddress || client?.deliveryCity || client?.deliveryPostalCode || client?.deliveryCountry);
  const clientUseSameAddress = client?.sameAsAddress === true;
  const hasClientBillingAddress = !!(client?.address || client?.city || client?.postalCode || client?.country);
  const shouldShowDeliveryAddress = hasInvoiceDeliveryAddress || hasClientDeliveryAddress || (clientUseSameAddress && hasClientBillingAddress);

  const { t, i18n } = useTranslation(['invoices', 'common']);
  const { getCompanySettings } = useSettings();
  const { userProfile } = useUnifiedData();
  
  // 添加useEffect来监听selectedTemplate和formData的变化
  useEffect(() => {
  }, [selectedTemplate, formData]);
  
  // 注释掉自动清理逻辑，避免开发模式下的干扰
  // useEffect(() => {
  //   console.log('InvoicePreview: 开始清除测试数据');
  //   clearTestData();
  // }, []);

  // 格式化货币显示 - 使用formData或用户设置中的货币，保持与PDF一致
  const formatCurrency = (amount) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    const currency = formData?.currency || user?.currency || 'EUR';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // 格式化日期 - 预览界面使用ISO格式 (YYYY-MM-DD)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // 计算项目总计
  const calculateItemTotal = (item) => {
    const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
    // 如果是TVA豁免或自清算，税额为0
    if (formData.tvaExempt || formData.autoLiquidation) {
      return subtotal;
    }
    const taxRate = typeof item.taxRate === 'object' ? 0 : (item.taxRate || 0);
    const tax = subtotal * (taxRate / 100);
    return subtotal + tax;
  };

  // 使用useMemo优化计算，避免重复计算
  const calculations = useMemo(() => {
    const subtotal = formData.items.reduce((total, item) => 
      total + ((item.quantity || 0) * (item.unitPrice || 0)), 0
    );
    
    let totalTax = 0;
    // 如果不是TVA豁免或自清算，才计算税额
    if (!formData.tvaExempt && !formData.autoLiquidation) {
      totalTax = formData.items.reduce((total, item) => {
        const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
        const taxRate = typeof item.taxRate === 'object' ? 0 : (item.taxRate || 0);
        return total + (itemSubtotal * (taxRate / 100));
      }, 0);
    }
    
    const grandTotal = subtotal + totalTax;
    
    return { subtotal, totalTax, grandTotal };
  }, [formData.items, formData.tvaExempt, formData.autoLiquidation]);

  // 银行信息（优先读取设置中的 Company.bankInfo，其次平铺字段，最后回退到表单）
  const companySettings = getCompanySettings();
  const bankIBAN = user?.Company?.bankInfo?.iban
    || userProfile?.Company?.bankInfo?.iban
    || user?.bankIBAN
    || userProfile?.bankIBAN
    || formData?.bankIBAN;
  const bankBIC = user?.Company?.bankInfo?.bic
    || userProfile?.Company?.bankInfo?.bic
    || user?.bankBIC
    || userProfile?.bankBIC
    || formData?.bankBIC;
  const bankName = user?.Company?.bankInfo?.bankName
    || userProfile?.Company?.bankInfo?.bankName
    || user?.bankName
    || userProfile?.bankName
    || formData?.bankName;
  const accountHolder = user?.Company?.bankInfo?.accountHolder
    || userProfile?.Company?.bankInfo?.accountHolder
    || user?.accountHolder
    || userProfile?.accountHolder
    || formData?.accountHolder
    || companySettings?.name
    || user?.companyName
    || '';
  const hasBankInfo = !!(bankIBAN || bankBIC || bankName || accountHolder);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        {/* 预览标题 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {getFrenchLabel('preview', 'Aperçu')}
          </h2>
        </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 lg:p-8 min-h-80 sm:min-h-96 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {getFrenchLabel('invoice')}
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  #{(() => {
                    // 与PDF生成逻辑保持一致：法国模式下将 INV-YYYY-NNN 转换为 FR-YYYY-000NNN
                    if (formData?.invoiceNumber) {
                      if (selectedTemplate && (selectedTemplate.startsWith('french-') || selectedTemplate === 'france-template')) {
                        if (String(formData.invoiceNumber).startsWith('INV-')) {
                          const parts = String(formData.invoiceNumber).split('-');
                          if (parts.length >= 3) {
                            const year = new Date().getFullYear();
                            const number = String(parts[2]).padStart(6, '0');
                            return `FR-${year}-${number}`;
                          }
                        }
                      }
                      return formData.invoiceNumber;
                    }
                    return 'INV-XXXX';
                  })()}
                </p>
                {(selectedTemplate && (selectedTemplate.startsWith('french-') || selectedTemplate === 'france-template')) && formData.invoiceType && (
                  <div className="mt-2 px-3 py-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-800 font-bold">🆕 Invoice Type:</span>
                      <span className="text-gray-700 font-semibold">
                        {getFrenchLabel(`invoiceTypes.${formData.invoiceType}`, formData.invoiceType)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      ✅ {getFrenchLabel('frenchCompliance')} - {getFrenchLabel('complianceAdded')}
                    </div>
                  </div>
                )}
                {selectedTemplate && (
                  <div className="mt-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    {getFrenchLabel('template')}: {(selectedTemplate.startsWith('french-') || selectedTemplate === 'france-template')
                      ? `${getFrenchLabel('frenchTemplate')} - ${selectedTemplate.replace('french-', '') === 'standard' ? getFrenchLabel('standardVAT') : 
                          selectedTemplate.replace('french-', '') === 'exempt' ? getFrenchLabel('exemptVAT') : 
                          selectedTemplate === 'france-template' ? getFrenchLabel('frenchTemplate') : getFrenchLabel('autoLiquidationVAT')}`
                      : selectedTemplate}
                  </div>
                )}
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-gray-600 mb-1">
                  {getFrenchLabel('invoiceDate')}: {formatDate(formData.issueDate)}
                </p>
                {formData.dueDate && (
                  <p className="text-sm text-gray-600 mb-1">
                    {getFrenchLabel('dueDate')}: {formatDate(formData.dueDate)}
                  </p>
                )}
                {(formData.serviceDate || formData.deliveryDate) && (
                  <p className="text-sm text-gray-600">
                    {getFrenchLabel('deliveryDate')}: {formatDate(formData.serviceDate || formData.deliveryDate)}
                  </p>
                )}
              </div>
            </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {getFrenchLabel('from')}
              </h3>
              <div className="text-sm text-gray-600">
                {(() => {
                  // 只使用SettingsContext的统一设置，不再回退到localStorage
                  const companySettings = getCompanySettings();
                  
                  // 添加调试信息
                  let companyInfo = null;
                  
                  // 使用SettingsContext的统一数据
                  if (companySettings && (companySettings.name || companySettings.vatNumber)) {
                    companyInfo = {
                      sellerCompanyName: companySettings.name || '',
                      sellerAddress: [companySettings.address, companySettings.city, companySettings.postalCode]
                        .filter(Boolean).join(' ') || '',
                      sellerVATNumber: companySettings.vatNumber || '',
                      sellerSIREN: companySettings.siren || '',
                      sellerSIRET: companySettings.siret || '',
                      sellerPhone: companySettings.phone || '',
                      sellerEmail: companySettings.email || '',
                      sellerLegalForm: companySettings.legalForm || '',
                      sellerRegisteredCapital: companySettings.registeredCapital || '',
                      sellerRcsNumber: companySettings.rcsNumber || '',
                      sellerNafCode: companySettings.nafCode || ''
                    };
                  }
                  
                  // 如果SettingsContext没有数据，从user对象构建（降级方案）
                  if (!companyInfo && user) {
                    companyInfo = {
                      sellerCompanyName: user.companyName || '',
                      sellerAddress: user.address || '',
                      sellerVATNumber: user.vatNumber || '',
                      sellerSIREN: user.siren || '',
                      sellerSIRET: user.siretNumber || '',
                      sellerPhone: user.phone || '',
                      sellerEmail: user.email || '',
                      sellerLegalForm: user.legalForm || '',
                      sellerRegisteredCapital: user.registeredCapital || '',
                      sellerRcsNumber: user.rcsNumber || '',
                      sellerNafCode: user.nafCode || ''
                    };
                  }
                  
                  if (companyInfo && (companyInfo.sellerCompanyName || companyInfo.sellerVATNumber)) {
                    return (
                      <>
                        <p className="font-medium">{companyInfo.sellerCompanyName || 'Company name not set'}</p>
                        {companyInfo.sellerAddress && <p>{companyInfo.sellerAddress}</p>}
                        {companyInfo.sellerPhone && (
                          <p>Phone: {companyInfo.sellerPhone}</p>
                        )}
                        {companyInfo.sellerEmail && (
                          <p>Email: {companyInfo.sellerEmail}</p>
                        )}
                        {companyInfo.sellerVATNumber && (
                          <p className="mt-1 text-xs text-gray-500">
                            {getFrenchLabel('vatNumber')}: {companyInfo.sellerVATNumber}
                          </p>
                        )}
                        {companyInfo.sellerSIREN && (
                          <p className="mt-1 text-xs text-gray-500">
                            {getFrenchLabel('sirenNumber')}: {companyInfo.sellerSIREN}
                          </p>
                        )}
                        {companyInfo.sellerSIRET && (
                          <p className="mt-1 text-xs text-gray-500">
                            {getFrenchLabel('siretNumber')}: {companyInfo.sellerSIRET}
                          </p>
                        )}
                        {companyInfo.sellerPhone && (
                          <p className="mt-1 text-xs text-gray-500">
                            {getFrenchLabel('phone')}: {companyInfo.sellerPhone}
                          </p>
                        )}
                        {companyInfo.sellerEmail && (
                          <p className="mt-1 text-xs text-gray-500">
                            {getFrenchLabel('email')}: {companyInfo.sellerEmail}
                          </p>
                        )}
                        {companyInfo.sellerLegalForm && (
                          <p>Forme: {companyInfo.sellerLegalForm}</p>
                        )}
                        {companyInfo.sellerRegisteredCapital && (
                          <p>Capital: {companyInfo.sellerRegisteredCapital} €</p>
                        )}
                        {companyInfo.sellerNafCode && (
                          <p>NAF: {companyInfo.sellerNafCode}</p>
                        )}
                        {companyInfo.sellerRcsNumber && (
                          <p>RCS: {companyInfo.sellerRcsNumber}</p>
                        )}
                        {/* 移除卖方信息下方的 TVA 状态显示，避免与底部法律条款重复 */}
                      </>
                    );
                  }
                  
                  return (
                    <p className="text-gray-400 italic">
                      {getFrenchLabel('companyName')} non défini
                    </p>
                  );
                })()} 
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {getFrenchLabel('to')}
              </h3>
              
              {/* 账单地址区域 */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <span className="mr-2">🏢</span>
                  {getFrenchLabel('billingAddress')}
                </h4>
                <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                  {client ? (
                    <>
                      {/* 优先显示公司名，如果没有公司名则显示个人姓名 */}
                      {client.company ? (
                        <>
                          <p className="font-medium text-gray-900">{client.company}</p>
                          {client.name && (
                            <p className="mt-1 text-gray-600">À l'attention de: {client.name}</p>
                          )}
                        </>
                      ) : (
                        client.name && (
                          <p className="font-medium text-gray-900">{client.name}</p>
                        )
                      )}
                      {client.address && <p className="mt-1">{client.address}</p>}
                      {(client.city || client.postalCode) && (
                        <p className="mt-1">{[client.city, client.postalCode].filter(Boolean).join(', ')}</p>
                      )}
                      {client.country && <p className="mt-1">{client.country}</p>}
                      {client.vatNumber && (
                        <p className="mt-2 text-xs text-gray-600">
                          <span className="font-medium">{getFrenchLabel('vatNumber')}:</span> {client.vatNumber}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400">{getFrenchLabel('selectClient')}</p>
                  )}
                </div>
              </div>

              {/* 交付地址区域 */}
              {(() => {
                const hasInvoiceDeliveryAddress = !!(formData.deliveryAddress || formData.deliveryCity || formData.deliveryPostalCode || formData.deliveryCountry);
                const hasClientDeliveryAddress = !!(client?.deliveryAddress || client?.deliveryCity || client?.deliveryPostalCode || client?.deliveryCountry);
                const clientUseSameAddress = client?.sameAsAddress === true;
                const hasClientBillingAddress = !!(client?.address || client?.city || client?.postalCode || client?.country);
                
                const shouldShowDeliveryAddress = hasInvoiceDeliveryAddress || hasClientDeliveryAddress || (clientUseSameAddress && hasClientBillingAddress);
                
                if (shouldShowDeliveryAddress) {
                  return (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <span className="mr-2">🚚</span>
                        {getFrenchLabel('deliveryAddress')}
                      </h4>
                      <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                        {/* 优先级1: 发票级别的交付地址 */}
                        {hasInvoiceDeliveryAddress ? (
                          <>
                            {/* 优先显示公司名，如果没有公司名则显示个人姓名 */}
                            {client && client.company ? (
                              <>
                                <p className="font-medium text-gray-900">{client.company}</p>
                                {client.name && (
                                  <p className="mt-1 text-gray-600">À l'attention de: {client.name}</p>
                                )}
                              </>
                            ) : (
                              client && client.name && (
                                <p className="font-medium text-gray-900">{client.name}</p>
                              )
                            )}
                            {formData.deliveryAddress && <p className="mt-1">{formData.deliveryAddress}</p>}
                            {(formData.deliveryCity || formData.deliveryPostalCode) && (
                              <p className="mt-1">
                                {[formData.deliveryCity, formData.deliveryPostalCode].filter(Boolean).join(', ')}
                              </p>
                            )}
                            {formData.deliveryCountry && <p className="mt-1">{formData.deliveryCountry}</p>}
                            <p className="mt-2 text-xs text-gray-600 font-medium">
                              📍 Adresse de livraison personnalisée
                            </p>
                          </>
                        ) : clientUseSameAddress && hasClientBillingAddress ? (
                          /* 优先级2: 客户设置"与账单地址相同"，显示账单地址 */
                          <>
                            {/* 优先显示公司名，如果没有公司名则显示个人姓名 */}
                            {client && client.company ? (
                              <>
                                <p className="font-medium text-gray-900">{client.company}</p>
                                {client.name && (
                                  <p className="mt-1 text-gray-600">À l'attention de: {client.name}</p>
                                )}
                              </>
                            ) : (
                              client && client.name && (
                                <p className="font-medium text-gray-900">{client.name}</p>
                              )
                            )}
                            {client.address && <p className="mt-1">{client.address}</p>}
                            {(client.city || client.postalCode) && (
                              <p className="mt-1">{[client.city, client.postalCode].filter(Boolean).join(', ')}</p>
                            )}
                            {client.country && <p className="mt-1">{client.country}</p>}
                            <p className="mt-2 text-xs text-gray-600 font-medium">
                              ✓ {getFrenchLabel('sameAsBilling')}
                            </p>
                          </>
                        ) : hasClientDeliveryAddress ? (
                          /* 优先级3: 客户级别的独立交付地址 */
                          <>
                            {/* 优先显示公司名，如果没有公司名则显示个人姓名 */}
                            {client && client.company ? (
                              <>
                                <p className="font-medium text-gray-900">{client.company}</p>
                                {client.name && (
                                  <p className="mt-1 text-gray-600">À l'attention de: {client.name}</p>
                                )}
                              </>
                            ) : (
                              client && client.name && (
                                <p className="font-medium text-gray-900">{client.name}</p>
                              )
                            )}
                            {client.deliveryAddress && <p className="mt-1">{client.deliveryAddress}</p>}
                            {(client.deliveryCity || client.deliveryPostalCode) && (
                              <p className="mt-1">
                                {[client.deliveryCity, client.deliveryPostalCode].filter(Boolean).join(', ')}
                              </p>
                            )}
                            {client.deliveryCountry && <p className="mt-1">{client.deliveryCountry}</p>}
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                }
                return null;
              })()} 
            </div>
          </div>

          {/* 移除了法国模板特殊信息显示，以简化发票界面 */}
          {/* 发票项目表格 */}
          <div className="mb-8 overflow-x-auto">
            <table className="w-full min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-900">
                    {getFrenchLabel('description')}
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-900 min-w-16">
                    {getFrenchLabel('quantity')}
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-900 min-w-20">
                    {getFrenchLabel('unitPrice')}
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-900 min-w-16">
                    {formData.tvaExempt ? 'TVA (Exonérée)' : getFrenchLabel('taxRate')}
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-900 min-w-20">
                    {getFrenchLabel('total')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.items.length > 0 ? formData.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                    <td className="py-3 px-2 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={item.description}>
                        {item.description || 'Aucune description'}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 text-right">
                      {item.quantity || 0}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 text-right">
                      {formatCurrency(item.unitPrice || 0)}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 text-right">
                      {formData.tvaExempt ? (
                        <span className="text-blue-600 font-medium">Exonérée</span>
                      ) : (() => {
                        if (item.taxRate === null || item.taxRate === undefined || item.taxRate === '') {
                          return '%';
                        }
                        if (typeof item.taxRate === 'object') {
                          return '0%';
                        }
                        return `${item.taxRate}%`;
                      })()}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(calculateItemTotal(item))}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-400 text-sm">
                      {getFrenchLabel('itemsRequired')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 总计部分 */}
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-600">{getFrenchLabel('subtotal')}:</span>
                <span className="text-gray-900">{formatCurrency(calculations.subtotal)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-600">
                  {formData.tvaExempt ? 'TVA (Exonérée)' : formData.autoLiquidation ? 'TVA (Autoliquidation)' : getFrenchLabel('totalTax')}:
                </span>
                <span className={`text-gray-900 ${formData.tvaExempt || formData.autoLiquidation ? 'text-blue-600' : ''}`}>
                  {formData.tvaExempt || formData.autoLiquidation ? '€0.00' : formatCurrency(calculations.totalTax)}
                </span>
              </div>
              <div className="flex justify-between py-2 text-lg font-bold border-t border-gray-200">
                <span className="text-gray-900">{getFrenchLabel('grandTotal')}:</span>
                <span className="text-blue-600">{formatCurrency(calculations.grandTotal)}</span>
              </div>
              {/* TVA 豁免说明 */}
              {formData.tvaExempt && formData.tvaExemptClause && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                  <strong>Exonération de TVA:</strong> {formData.tvaExemptClause}
                </div>
              )}
              {formData.tvaExempt && !formData.tvaExemptClause && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                  <strong>TVA Exonérée:</strong> Exonération de TVA selon l'article 262 ter I du Code général des impôts (CGI) - Livraisons intracommunautaires de biens
                </div>
              )}
              {formData.autoLiquidation && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                  <strong>Autoliquidation:</strong> Autoliquidation de la TVA par le preneur selon l'article 283-1 du Code général des impôts (CGI) - Prestations de services B to B
                </div>
              )}
            </div>
          </div>

          {/* 银行信息（来自设置） - 显示在备注上方 */}
          {hasBankInfo && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Coordonnées Bancaires
              </h3>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 items-center text-sm">
                <span className="text-gray-600">IBAN:</span>
                <span className="text-gray-900 font-mono">{bankIBAN || ''}</span>

                <span className="text-gray-600">BIC/SWIFT:</span>
                <span className="text-gray-900 font-mono">{bankBIC || ''}</span>

                <span className="text-gray-600">Banque:</span>
                <span className="text-gray-900">{bankName || ''}</span>

                <span className="text-gray-600">Titulaire:</span>
                <span className="text-gray-900">{accountHolder || companySettings?.name || user?.companyName || 'Nom de l\'entreprise'}</span>
              </div>
            </div>
          )}

          {/* 备注 */}
          {formData.notes && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {getFrenchLabel('notes')}
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {formData.notes}
              </p>
            </div>
          )}

          {/* 法国发票法律条款 - 只在法国模板下显示 */}
          {(selectedTemplate && (selectedTemplate.startsWith('french-') || selectedTemplate === 'france-template')) && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-4">{getFrenchLabel('legalTerms')}</h4>
              <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
                
                {/* 隐藏缺陷条款 */}
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-700 mb-1">Garantie des vices cachés (Article 1641 du Code Civil)</p>
                  <p>Le vendeur est tenu de la garantie à raison des défauts cachés de la chose vendue qui la rendent impropre à l'usage auquel on la destine, ou qui diminuent tellement cet usage que l'acheteur ne l'aurait pas acquise, ou n'en aurait donné qu'un moindre prix, s'il les avait connus.</p>
                </div>

                {/* 付款条件和逾期罚款 */}
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-700 mb-1">{getFrenchLabel('paymentConditions')}</p>
                  <p>Paiement à 30 jours net. En cas de retard de paiement, des pénalités de retard sont exigibles le jour suivant la date de règlement figurant sur la facture. Le taux d'intérêt de ces pénalités de retard est de trois fois le taux d'intérêt légal. Ces pénalités sont exigibles sans qu'un rappel soit nécessaire.</p>
                </div>

                {/* 保留所有权条款 */}
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-700 mb-1">Réserve de propriété</p>
                  <p>Nous nous réservons la propriété des biens vendus jusqu'au paiement intégral du prix. En cas de défaut de paiement, nous pourrons revendiquer les marchandises où qu'elles se trouvent.</p>
                </div>

                {/* 争议解决条款 */}
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-700 mb-1">Règlement des litiges</p>
                  <p>Tout litige relatif à l'interprétation et à l'exécution des présentes conditions de vente est soumis au droit français. En cas de contestation, seuls les tribunaux français seront compétents.</p>
                </div>

                {/* TVA 信息 */}
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="font-medium text-blue-700 mb-1">{getFrenchLabel('vatInformation')}</p>
                  {formData.tvaExempt ? (
                    <p className="text-blue-600">{getFrenchLabel('vatStatus.exempt')}</p>
                  ) : formData.autoLiquidation ? (
                    <p className="text-blue-600">{getFrenchLabel('vatStatus.autoLiquidation')}</p>
                  ) : (
                    <p className="text-blue-600">{getFrenchLabel('vatStatus.standard')}</p>
                  )}
                </div>

                {/* 银行信息已移除 - 简化界面，详细信息已包含在PDF的法律条款中 */}

                {/* 条件de paiement et pénalités */}
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="font-medium text-yellow-700 mb-1">Conditions de paiement et pénalités</p>
                  <div className="text-xs text-yellow-600 space-y-1">
                    <p>• Échéance de paiement: 30 jours à compter de la date de facture</p>
                    <p>• Mode de paiement: Virement bancaire, chèque, ou espèces (si montant ≤ 1000€)</p>
                    <p>• Escompte pour paiement anticipé: 2% si paiement sous 10 jours</p>
                    <p>• Pénalités de retard: Taux = 3 × taux d'intérêt légal (actuellement {(3 * 3.15).toFixed(2)}%)</p>
                    <p>• Indemnité forfaitaire pour frais de recouvrement: 40€ (Art. L441-6 du Code de commerce)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default InvoicePreview;