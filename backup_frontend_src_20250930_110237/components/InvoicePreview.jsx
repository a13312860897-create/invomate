import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FiDollarSign, FiCalendar } from 'react-icons/fi';


const InvoicePreview = ({ formData, clients, user, calculateTotals, calculateItemTotal, formatCurrency, invoiceMode }) => {
  const { t } = useTranslation(['common', 'invoiceform']);
  const { subtotal, taxAmount, total } = calculateTotals();
  const apiBaseUrl = process.env.REACT_APP_API_URL || '';
  
  // 生成预览发票编号
  const getInvoicePrefix = () => {
    switch(invoiceMode) {
      case 'fr': return 'FR-';
      default: return 'INV-';
    }
  };
  const previewInvoiceNumber = getInvoicePrefix() + 'PREVIEW-001';
  
  // 获取选中的客户信息
  const selectedClient = clients.find(client => client.id === formData.clientId);


  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* 预览标题 */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">{t('preview')}</h3>
        <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">
          {previewInvoiceNumber}
        </span>
      </div>
      
      {/* 预览内容 */}
      <div className="p-6">
        {/* 公司和客户信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* 公司信息 */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">{t('from')}</h4>
            <div className="text-sm text-gray-700">
              {user?.logo && (
                <div className="mb-3">
                  <img 
                    src={`${apiBaseUrl}${user.logo}`} 
                    alt={t('companylogo')} 
                    className="h-16 w-auto max-w-xs object-contain"
                  />
                </div>
              )}
              <p className="font-medium text-gray-900">{user?.companyName || user?.firstName + ' ' + user?.lastName}</p>
              <p className="mt-1">{user?.email}</p>
              <p className="mt-1">{user?.phone}</p>
              <p className="mt-1">{user?.address}</p>
            </div>
          </div>
          
          {/* 客户信息 */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">{t('to')}</h4>
            <div className="text-sm text-gray-700">
              {selectedClient ? (
                <>
                  <p className="font-medium text-gray-900">{selectedClient.name}</p>
                  {selectedClient.company && (
                    <p className="mt-1">{selectedClient.company}</p>
                  )}
                  {selectedClient.phone && (
                    <p className="mt-1">{selectedClient.phone}</p>
                  )}
                  {selectedClient.address && (
                    <p className="mt-1">{selectedClient.address}</p>
                  )}
                  {selectedClient.city && selectedClient.postalCode && (
                    <p className="mt-1">{selectedClient.city}, {selectedClient.postalCode}</p>
                  )}
                  {selectedClient.country && (
                    <p className="mt-1">{selectedClient.country}</p>
                  )}
                  {selectedClient.vatNumber && (
                    <p className="mt-1">VAT: {selectedClient.vatNumber}</p>
                  )}
                  {selectedClient.siren && (
                    <p className="mt-1">SIREN: {selectedClient.siren}</p>
                  )}
                  {selectedClient.siret && (
                    <p className="mt-1">SIRET: {selectedClient.siret}</p>
                  )}
                </>
              ) : (
                <p className="text-gray-500 italic">{t('noselectedclient')}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* 发票详情 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t('invoicedate')}</h5>
            <div className="flex items-center text-sm font-medium text-gray-900">
              <FiCalendar className="mr-1.5 h-4 w-4 text-gray-400" />
              {formData.issueDate}
            </div>
          </div>
          
          <div>
            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t('duedate')}</h5>
            <div className="flex items-center text-sm font-medium text-gray-900">
              <FiCalendar className="mr-1.5 h-4 w-4 text-gray-400" />
              {formData.dueDate}
            </div>
          </div>
          
          <div>
            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t('amount')}</h5>
            <div className="flex items-center text-lg font-bold text-gray-900">
              <FiDollarSign className="mr-1.5 h-5 w-5 text-gray-400" />
              {formatCurrency(total)}
            </div>
          </div>
        </div>
        
        {/* 发票项目 */}
        <div className="mb-8">
          <h4 className="text-sm font-medium text-gray-900 mb-4">{t('items')}</h4>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">{t('description')}</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('qty')}</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('price')}</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('taxpercent')}</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('total')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.items.map((item, index) => (
                  <React.Fragment key={item.id || index}>
                    <tr>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.description || <span className="text-gray-400 italic">{t('descriptionplaceholder')}</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{item.taxRate}%</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(calculateItemTotal(item))}</td>
                    </tr>

                  </React.Fragment>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="4" className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{t('subtotal')}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan="4" className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{t('tax')}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(taxAmount)}</td>
                </tr>
                <tr>
                  <td colSpan="4" className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">{t('total')}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        {/* 备注 */}
        {formData.notes && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">{t('notes')}</h4>
            <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
              {formData.notes}
            </div>
          </div>
        )}
        
        {/* 法国法定声明 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-gray-700 space-y-3">
            <div>
              <strong className="text-gray-900">合规保证声明：</strong><br />
              根据法国商法典第L.441-3条和第L.441-6条的规定，本发票符合法国法定要求。延迟付款将产生利息，利率为欧洲央行再融资利率加10个百分点。延迟付款还将产生40欧元的固定赔偿金，用于收债费用，且不影响要求更高赔偿的权利。
            </div>
            <div>
              <strong className="text-gray-900">隐藏缺陷保证：</strong><br />
              根据法国民法典第1641条至第1649条的规定，卖方对商品的隐藏缺陷承担保证责任。买方应在发现缺陷后的合理时间内通知卖方。
            </div>
          </div>
        </div>
        
        {/* 状态 */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm font-medium text-gray-500">{t('status')}:</span>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {t(`statusOptions.${formData.status}`)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;