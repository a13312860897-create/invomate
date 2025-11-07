import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FiDollarSign, FiCalendar } from 'react-icons/fi';


const InvoicePreview = ({ formData, clients, user, calculateTotals, calculateItemTotal, formatCurrency, invoiceMode, selectedTemplate }) => {
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
  
  // 获取选中的客户信息 - 修复ID类型匹配问题
  const selectedClient = clients.find(client => 
    client.id === formData.clientId || 
    String(client.id) === String(formData.clientId)
  );

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

  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* 预览标题 */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">{t('preview')}</h3>
        <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">
          {formatDisplayInvoiceNumber(formData.invoiceNumber)}
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
              <p className="font-medium text-gray-900">{formData?.sellerCompanyName || user?.companyName || user?.firstName + ' ' + user?.lastName}</p>
              <p className="mt-1">{formData?.sellerEmail || user?.email}</p>
              <p className="mt-1">{formData?.sellerPhone || user?.phone}</p>
              <p className="mt-1">{formData?.sellerAddress || user?.address}</p>
              {(formData?.sellerVATNumber || user?.vatNumber) && (
                <p className="mt-1">VAT: {formData?.sellerVATNumber || user.vatNumber}</p>
              )}
              {(formData?.sellerSIREN || user?.sirenNumber || user?.siren) && (
                <p className="mt-1">SIREN: {formData?.sellerSIREN || user?.sirenNumber || user?.siren}</p>
              )}
              {(formData?.sellerSIRET || user?.siretNumber) && (
                <p className="mt-1">SIRET: {formData?.sellerSIRET || user.siretNumber}</p>
              )}
              {(formData?.sellerLegalForm) && (
                <p className="mt-1">Legal Form: {formData.sellerLegalForm}</p>
              )}
              {(formData?.sellerRegisteredCapital) && (
                <p className="mt-1">Registered Capital: {formatCurrencyUnified(formData.sellerRegisteredCapital)}</p>
              )}
              {(formData?.sellerRCS) && (
                <p className="mt-1">RCS Number: {formData.sellerRCS}</p>
              )}
              {(formData?.sellerNAF) && (
                <p className="mt-1">NAF Code: {formData.sellerNAF}</p>
              )}
            </div>
          </div>
          
          {/* 客户基本信息 */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">{t('to')}</h4>
            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border-l-4 border-gray-400">
              {selectedClient ? (
                <>
                  {/* 优先显示公司名，如果没有公司名则显示个人姓名 */}
                  {selectedClient.company ? (
                    <>
                      <p className="font-medium text-gray-900">{selectedClient.company}</p>
                      <p className="mt-1 text-gray-600">À l'attention de: {selectedClient.name}</p>
                    </>
                  ) : (
                    <p className="font-medium text-gray-900">{selectedClient.name}</p>
                  )}
                  {selectedClient.email && (
                    <p className="mt-1">✉️ {selectedClient.email}</p>
                  )}
                  {selectedClient.phone && (
                    <p className="mt-1">📞 {selectedClient.phone}</p>
                  )}
                  {selectedClient.vatNumber && (
                    <p className="mt-1 text-xs text-gray-600">Numéro de TVA: {selectedClient.vatNumber}</p>
                  )}
                  {selectedClient.siren && (
                    <p className="mt-1 text-xs text-gray-600">SIREN: {selectedClient.siren}</p>
                  )}
                  {selectedClient.siret && (
                    <p className="mt-1 text-xs text-gray-600">SIRET: {selectedClient.siret}</p>
                  )}
                </>
              ) : (
                <p className="text-gray-500 italic">{t('noselectedclient')}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* 地址信息区域 */}
        {(() => {
          // 检查是否有任何交付地址信息需要显示
          const hasInvoiceDeliveryAddress = formData.deliveryAddress || formData.deliveryCity || formData.deliveryPostalCode || formData.deliveryCountry;
          const hasClientDeliveryAddress = selectedClient?.deliveryAddress || selectedClient?.deliveryCity || selectedClient?.deliveryPostalCode || selectedClient?.deliveryCountry;
          const hasClientBillingAddress = selectedClient?.address || selectedClient?.city || selectedClient?.postalCode || selectedClient?.country;
          
          // 判断客户是否设置了"与账单地址相同"
          const clientUseSameAddress = selectedClient?.sameAsAddress === true;
          
          // 显示条件：有发票级别的交付地址 OR 有客户级别的交付地址 OR 客户设置了"与账单地址相同"且有账单地址 OR 有账单地址
          const shouldShowAddressSection = hasInvoiceDeliveryAddress || hasClientDeliveryAddress || hasClientBillingAddress;
          
          if (!shouldShowAddressSection) return null;
          
          return (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 账单地址 */}
                {hasClientBillingAddress && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">💳</span>
                      {t('billingAddress')}
                    </h4>
                    <div className="text-sm text-gray-700 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                      {selectedClient && (
                        <>
                          {/* 优先显示公司名，如果没有公司名则显示个人姓名 */}
                          {selectedClient.company ? (
                            <>
                              <p className="font-medium text-gray-900">{selectedClient.company}</p>
                              {selectedClient.name && (
                                <p className="mt-1 text-gray-600">À l'attention de: {selectedClient.name}</p>
                              )}
                            </>
                          ) : (
                            selectedClient.name && (
                              <p className="font-medium text-gray-900">{selectedClient.name}</p>
                            )
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
                            <p className="mt-1 text-xs text-gray-600">Numéro de TVA: {selectedClient.vatNumber}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 交付地址 */}
                {(hasInvoiceDeliveryAddress || hasClientDeliveryAddress || (clientUseSameAddress && hasClientBillingAddress)) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">🚚</span>
                      {t('deliveryAddress')}
                    </h4>
                    <div className="text-sm text-gray-700 bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                      {/* 优先级1: 发票级别的交付地址 */}
                      {hasInvoiceDeliveryAddress ? (
                        <>
                          {/* 优先显示公司名，如果没有公司名则显示个人姓名 */}
                          {selectedClient && (
                            selectedClient.company ? (
                              <>
                                <p className="font-medium text-gray-900">{selectedClient.company}</p>
                                {selectedClient.name && (
                                  <p className="mt-1 text-gray-600">À l'attention de: {selectedClient.name}</p>
                                )}
                              </>
                            ) : (
                              selectedClient.name && (
                                <p className="font-medium text-gray-900">{selectedClient.name}</p>
                              )
                            )
                          )}
                          {formData.deliveryAddress && (
                            <p className="mt-1">{formData.deliveryAddress}</p>
                          )}
                          {(formData.deliveryCity || formData.deliveryPostalCode) && (
                            <p className="mt-1">
                              {[formData.deliveryCity, formData.deliveryPostalCode].filter(Boolean).join(', ')}
                            </p>
                          )}
                          {formData.deliveryCountry && (
                            <p className="mt-1">{formData.deliveryCountry}</p>
                          )}
                          {formData.deliveryDate && (
                            <p className="mt-2 text-xs text-gray-600">
                              <span className="font-medium">{t('deliveryDate')}:</span> {formData.deliveryDate}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-green-600 font-medium">
                            📍 Adresse de livraison personnalisée
                          </p>
                        </>
                      ) : clientUseSameAddress && hasClientBillingAddress ? (
                        /* 优先级2: 客户设置"与账单地址相同"，显示账单地址 */
                        <>
                          {selectedClient && (
                            selectedClient.company ? (
                              <>
                                <p className="font-medium text-gray-900">{selectedClient.company}</p>
                                {selectedClient.name && (
                                  <p className="mt-1 text-gray-600">À l'attention de: {selectedClient.name}</p>
                                )}
                              </>
                            ) : (
                              selectedClient.name && (
                                <p className="font-medium text-gray-900">{selectedClient.name}</p>
                              )
                            )
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
                          <p className="mt-2 text-xs text-green-600 font-medium">
                            ✓ Identique à l'adresse de facturation
                          </p>
                        </>
                      ) : hasClientDeliveryAddress ? (
                        /* 优先级3: 客户级别的独立交付地址 */
                        <>
                          {selectedClient && (
                            selectedClient.company ? (
                              <>
                                <p className="font-medium text-gray-900">{selectedClient.company}</p>
                                {selectedClient.name && (
                                  <p className="mt-1 text-gray-600">À l'attention de: {selectedClient.name}</p>
                                )}
                              </>
                            ) : (
                              selectedClient.name && (
                                <p className="font-medium text-gray-900">{selectedClient.name}</p>
                              )
                            )
                          )}
                          {selectedClient?.deliveryAddress && (
                            <p className="mt-1">{selectedClient.deliveryAddress}</p>
                          )}
                          {(selectedClient?.deliveryCity || selectedClient?.deliveryPostalCode) && (
                            <p className="mt-1">
                              {[selectedClient?.deliveryCity, selectedClient?.deliveryPostalCode].filter(Boolean).join(', ')}
                            </p>
                          )}
                          {selectedClient?.deliveryCountry && (
                            <p className="mt-1">{selectedClient.deliveryCountry}</p>
                          )}
                          <p className="mt-2 text-xs text-green-600 font-medium">
                            🏢 Adresse de livraison du client
                          </p>
                        </>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
        
        {/* 发票详情 */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 左侧：日期信息 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Dates / 日期信息</h4>
              
              <div className="grid grid-cols-1 gap-3">
                {/* 发票日期 */}
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('invoicedate')}</h5>
                    <p className="text-sm text-gray-600 mt-1">Date de facturation</p>
                  </div>
                  <div className="flex items-center text-sm font-medium text-gray-900">
                    <FiCalendar className="mr-1.5 h-4 w-4 text-gray-400" />
                    {formData.issueDate}
                  </div>
                </div>

                {/* 服务提供日期 - 法国发票必需，独立显示 */}
                {(formData.serviceDate || formData.deliveryDate) && (
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                        Date de livraison
                      </h5>
                      <p className="text-sm text-blue-600 mt-1">Service fourni / Livraison</p>
                    </div>
                    <div className="flex items-center text-sm font-medium text-blue-900">
                      <FiCalendar className="mr-1.5 h-4 w-4 text-blue-500" />
                      {formData.serviceDate || formData.deliveryDate}
                    </div>
                  </div>
                )}

                {/* 到期日期 */}
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <h5 className="text-xs font-medium text-yellow-700 uppercase tracking-wide">{t('duedate')}</h5>
                    <p className="text-sm text-yellow-600 mt-1">Échéance de paiement</p>
                  </div>
                  <div className="flex items-center text-sm font-medium text-yellow-900">
                    <FiCalendar className="mr-1.5 h-4 w-4 text-yellow-500" />
                    {formData.dueDate}
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：金额和状态信息 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Montant / 金额信息</h4>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h5 className="text-xs font-medium text-green-700 uppercase tracking-wide mb-2">{t('amount')}</h5>
                <div className="flex items-center text-2xl font-bold text-green-900">
                  <FiDollarSign className="mr-2 h-6 w-6 text-green-600" />
                  {formatCurrency(total)}
                </div>
                <p className="text-sm text-green-600 mt-1">Montant TTC</p>
              </div>

            </div>
          </div>
        </div>
        
        {/* 移除了订单参考和合同参考的显示，以简化发票界面 */}
        
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
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Taux TVA</th>
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
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrencyUnified(item.unitPrice)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                        {formatPercentageUnified(item.taxRate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrencyUnified(calculateItemTotal(item))}</td>
                    </tr>

                  </React.Fragment>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="4" className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{t('subtotal')}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrencyUnified(subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan="4" className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">Montant TVA :</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrencyUnified(taxAmount)}</td>
                </tr>
                <tr>
                  <td colSpan="4" className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">{t('total')}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">{formatCurrencyUnified(total)}</td>
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

        {/* 法国发票法律条款 - 只在法国模板下显示 */}
        {(selectedTemplate && (selectedTemplate.startsWith('french-') || selectedTemplate === 'france-template')) && (
        <div className="mb-8 border-t pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Conditions Légales / Legal Terms</h4>
          <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
            
            {/* 服务提供者身份声明 */}
            <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
              <p className="font-medium text-blue-800 mb-1">Identité du prestataire de services</p>
              <p className="text-blue-700">
                Cette facture est émise par {formData.sellerCompanyName || user?.companyName || '[Nom de l\'entreprise]'}, 
                société immatriculée au RCS de {formData.sellerRcsNumber || user?.rcsNumber || '[Ville] sous le numéro [Numéro RCS]'}, 
                SIREN : {formData.sellerSiren || user?.sirenNumber || '[SIREN]'}, 
                SIRET : {formData.sellerSiret || user?.siretNumber || '[SIRET]'}.
              </p>
            </div>

            {/* 合规保证声明 */}
            <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
              <p className="font-medium text-green-800 mb-1">Déclaration de conformité</p>
              <p className="text-green-700">
                Cette facture est établie conformément aux dispositions du Code de commerce français, 
                du Code général des impôts et de la réglementation européenne en matière de facturation électronique. 
                Elle respecte les exigences légales françaises en vigueur.
              </p>
            </div>
            
            {/* 隐藏缺陷条款 */}
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-medium text-gray-700 mb-1">Garantie des vices cachés (Article 1641 du Code Civil)</p>
              <p>Le vendeur est tenu de la garantie à raison des défauts cachés de la chose vendue qui la rendent impropre à l'usage auquel on la destine, ou qui diminuent tellement cet usage que l'acheteur ne l'aurait pas acquise, ou n'en aurait donné qu'un moindre prix, s'il les avait connus.</p>
            </div>

            {/* 付款条件和逾期罚款 */}
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-medium text-gray-700 mb-1">Conditions de paiement</p>
              <p>Paiement à 30 jours net. En cas de retard de paiement, des pénalités de retard sont exigibles le jour suivant la date de règlement figurant sur la facture. Le taux d'intérêt de ces pénalités de retard est de trois fois le taux d'intérêt légal. Ces pénalités sont exigibles sans qu'un rappel soit nécessaire.</p>
            </div>

            {/* 保留所有权条款 */}
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-medium text-gray-700 mb-1">Clause de réserve de propriété</p>
              <p>Nous nous réservons la propriété des biens vendus jusqu'au paiement intégral du prix, en principal et accessoires. En cas de défaut de paiement, nous pourrons revendiquer ces biens.</p>
            </div>

            {/* 争议解决条款 */}
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-medium text-gray-700 mb-1">Règlement des différends</p>
              <p>Tout litige relatif à l'interprétation et à l'exécution des présentes conditions de vente est soumis au droit français. À défaut de résolution amiable, le litige sera porté devant les tribunaux compétents de Paris.</p>
            </div>

            {/* TVA信息 - 只在法国模板中显示 */}
            {(selectedTemplate && (selectedTemplate.startsWith('french-') || selectedTemplate === 'france-template')) && (
              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                <p className="font-medium text-blue-800 mb-1">Information TVA</p>
                <p className="text-blue-700">
                  {(() => {
                    if (selectedTemplate === 'french-exempt' || formData.tvaExempt) {
                      return 'TVA non applicable – Art. 293 B du CGI (Régime de la franchise en base de TVA). Cette facture est émise dans le cadre du régime de franchise en base de TVA prévu aux articles 293 B à 293 E du Code général des impôts.';
                    } else if (selectedTemplate === 'french-autoliquidation' || formData.autoLiquidation) {
                      return 'Auto-liquidation de la TVA - TVA due par le preneur selon l\'article 283-1 du CGI. Le destinataire de cette facture doit acquitter la TVA selon les modalités d\'auto-liquidation prévues par la réglementation en vigueur.';
                    } else {
                      return `TVA applicable selon les taux en vigueur (20 %) – Art. 256 du CGI. Numéro de TVA intracommunautaire : ${formData.sellerVATNumber || user?.vatNumber || 'FR12345678901'}. Cette facture est soumise aux dispositions du régime normal de TVA.`;
                    }
                  })()}
                </p>
              </div>
            )}

          </div>
        </div>
        )}

        {/* 付款信息 - 法国发票必需 */}
        <div className="mb-8 border-t pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Informations de Paiement / Payment Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 银行信息已移除 - 简化界面，详细信息已包含在PDF的法律条款中 */}

            {/* 付款方式和法律条款 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-800 mb-3">Modalités de Paiement</h5>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="font-medium">Mode de paiement:</span>
                  <span>{formData.paymentMethod || 'Virement bancaire'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Escompte:</span>
                  <span>Aucun escompte pour paiement anticipé</span>
                </div>
                <div className="bg-yellow-50 p-2 rounded border-l-2 border-yellow-400 mt-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Pénalités de retard:</strong> 3 fois le taux d'intérêt légal + indemnité forfaitaire de 40€ (Art. L441-6 du Code de commerce)
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
        )}

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