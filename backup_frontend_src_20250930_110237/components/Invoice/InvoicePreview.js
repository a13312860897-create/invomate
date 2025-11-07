import React, { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiDownload, FiSend, FiPrinter } from 'react-icons/fi';
import { clearTestData } from '../../utils/clearTestData';

const InvoicePreview = React.memo(({ 
  formData, 
  client, 
  user, 
  onGeneratePDF, 
  onSendInvoice, 
  onPrint,
  loading = false 
}) => {
  const { t, i18n } = useTranslation(['invoices', 'common']);
  
  // 注释掉自动清理逻辑，避免开发模式下的干扰
  // useEffect(() => {
  //   console.log('InvoicePreview: 开始清除测试数据');
  //   clearTestData();
  // }, []);

  // 格式化货币显示
  const formatCurrency = (amount) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    const currency = 'EUR';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale);
  };

  // 计算项目总计
  const calculateItemTotal = (item) => {
    const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
    const taxRate = typeof item.taxRate === 'object' ? 0 : (item.taxRate || 0);
    const tax = subtotal * (taxRate / 100);
    return subtotal + tax;
  };

  // 使用useMemo优化计算，避免重复计算
  const calculations = useMemo(() => {
    const subtotal = formData.items.reduce((total, item) => 
      total + ((item.quantity || 0) * (item.unitPrice || 0)), 0
    );
    
    const totalTax = formData.items.reduce((total, item) => {
      const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
      const taxRate = typeof item.taxRate === 'object' ? 0 : (item.taxRate || 0);
      return total + (itemSubtotal * (taxRate / 100));
    }, 0);
    
    const grandTotal = subtotal + totalTax;
    
    return { subtotal, totalTax, grandTotal };
  }, [formData.items]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        {/* 预览标题和操作按钮 */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('invoices:preview.title')}
          </h2>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <button
              onClick={onGeneratePDF}
              disabled={loading}
              className="flex items-center justify-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 w-full sm:w-auto"
            >
              <FiDownload className="w-4 h-4 mr-1" />
              PDF
            </button>
            <button
              onClick={onPrint}
              disabled={loading}
              className="flex items-center justify-center px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 w-full sm:w-auto"
            >
              <FiPrinter className="w-4 h-4 mr-1" />
              {t('invoices:print')}
            </button>
            <button
              onClick={onSendInvoice}
              disabled={loading}
              className="flex items-center justify-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 w-full sm:w-auto"
            >
              <FiSend className="w-4 h-4 mr-1" />
              {t('invoices:send')}
            </button>
          </div>
        </div>

        {/* 发票预览内容 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 lg:p-8 min-h-80 sm:min-h-96">
          {/* 发票头部 */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('invoices:preview.invoice')}
              </h1>
              <p className="text-gray-600">
                #{formData.invoiceNumber || 'INV-XXXX'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {t('invoices:preview.date')}: {formatDate(formData.issueDate)}
              </p>
              {formData.dueDate && (
                <p className="text-sm text-gray-600">
                  {t('invoices:preview.dueDate')}: {formatDate(formData.dueDate)}
                </p>
              )}
            </div>
          </div>

          {/* 发票方和收票方信息 */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                发票方
              </h3>
              <div className="text-sm text-gray-600">
                {(() => {
                  // 优先从localStorage获取设置，其次从user对象获取
                  const savedSettings = localStorage.getItem('frenchCompanySettings');
                  let companyInfo = null;
                  
                  if (savedSettings) {
                    try {
                      companyInfo = JSON.parse(savedSettings);
                    } catch (error) {
                      console.error('解析localStorage设置失败:', error);
                    }
                  }
                  
                  // 如果localStorage没有设置，从user对象构建
                  if (!companyInfo && user) {
                    companyInfo = {
                      sellerCompanyName: user.companyName || '',
                      sellerAddress: user.address || '',
                      sellerVATNumber: user.vatNumber || '',
                      sellerSIREN: user.siren || '',
                      sellerSIRET: user.siretNumber || '',
                      sellerPhone: user.phone || ''
                    };
                  }
                  
                  if (companyInfo && (companyInfo.sellerCompanyName || companyInfo.sellerVATNumber)) {
                    return (
                      <>
                        <p className="font-medium">{companyInfo.sellerCompanyName || '未设置公司名称'}</p>
                        {companyInfo.sellerAddress && <p>{companyInfo.sellerAddress}</p>}
                        {companyInfo.sellerVATNumber && (
                          <p>增值税号: {companyInfo.sellerVATNumber}</p>
                        )}
                        {companyInfo.sellerSIREN && (
                          <p>SIREN号码: {companyInfo.sellerSIREN}</p>
                        )}
                        {companyInfo.sellerSIRET && (
                          <p>SIRET号码: {companyInfo.sellerSIRET}</p>
                        )}
                        {companyInfo.sellerPhone && (
                          <p>电话: {companyInfo.sellerPhone}</p>
                        )}
                      </>
                    );
                  }
                  
                  return (
                    <p className="font-medium text-gray-400">请在设置页面配置法国公司信息</p>
                  );
                })()} 
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {t('invoices:preview.to')}
              </h3>
              <div className="text-sm text-gray-600">
                {client ? (
                  <>
                    <p className="font-medium">{client.name}</p>
                    {client.address && <p>{client.address}</p>}
                    {(client.city || client.postalCode) && (
                      <p>{[client.city, client.postalCode].filter(Boolean).join(', ')}</p>
                    )}
                    {client.country && <p>{client.country}</p>}
                    {client.vatNumber && (
                      <p>{t('invoices:preview.vatNumber')}: {client.vatNumber}</p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-400">{t('invoices:selectClient')}</p>
                )}
              </div>
            </div>
          </div>

          {/* 发票项目表格 */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-semibold text-gray-900">
                    {t('invoices:description')}
                  </th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-900">
                    {t('invoices:quantity')}
                  </th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-900">
                    {t('invoices:unitPrice')}
                  </th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-900">
                    {t('invoices:taxRate')}
                  </th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-900">
                    {t('invoices:total')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-900">
                      {item.description || t('common:noDescription')}
                    </td>
                    <td className="py-3 text-sm text-gray-600 text-right">
                      {item.quantity || 0}
                    </td>
                    <td className="py-3 text-sm text-gray-600 text-right">
                      {formatCurrency(item.unitPrice || 0)}
                    </td>
                    <td className="py-3 text-sm text-gray-600 text-right">
                      {typeof item.taxRate === 'object' ? '0' : (item.taxRate || 0)}%
                    </td>
                    <td className="py-3 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(calculateItemTotal(item))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 总计部分 */}
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-600">{t('invoices:subtotal')}:</span>
                <span className="text-gray-900">{formatCurrency(calculations.subtotal)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-600">{t('invoices:totalTax')}:</span>
                <span className="text-gray-900">{formatCurrency(calculations.totalTax)}</span>
              </div>
              <div className="flex justify-between py-2 text-lg font-bold border-t border-gray-200">
                <span className="text-gray-900">{t('invoices:grandTotal')}:</span>
                <span className="text-blue-600">{formatCurrency(calculations.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* 备注 */}
          {formData.notes && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {t('invoices:notes')}
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {formData.notes}
              </p>
            </div>
          )}

          {/* 法国合规信息和法定声明 */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="mb-4">
              <p className="text-xs text-gray-500">
                根据法国法规要求的合规信息
              </p>
            </div>
            
            {/* 法国法定声明 */}
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                法定声明
              </h4>
              <div className="space-y-3">
                <div>
                  <strong className="text-gray-900">合规保证声明：</strong><br />
                  <span className="text-xs text-gray-600">
                    根据法国商法典第L.441-3条和第L.441-6条的规定，本发票符合法国法定要求。延迟付款将产生利息，利率为欧洲央行再融资利率加10个百分点。延迟付款还将产生40欧元的固定赔偿金，用于收债费用，且不影响要求更高赔偿的权利。
                  </span>
                </div>
                <div>
                  <strong className="text-gray-900">隐藏缺陷保证：</strong><br />
                  <span className="text-xs text-gray-600">
                    根据法国民法典第1641条至第1649条的规定，卖方对商品的隐藏缺陷承担保证责任。买方应在发现缺陷后的合理时间内通知卖方。
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default InvoicePreview;