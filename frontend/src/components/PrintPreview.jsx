import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPrinter, FiEye, FiX, FiMaximize2, FiMinimize2 } from 'react-icons/fi';

const PrintPreview = ({ 
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

  // 生成预览发票编号
  const getInvoicePrefix = () => {
    switch(invoiceMode) {
      case 'fr': return 'FR-';
      default: return 'INV-';
    }
  };
  const previewInvoiceNumber = getInvoicePrefix() + 'PREVIEW-001';

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
            
            .invoice-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              background: #f9fafb;
              padding: 15px;
              border-radius: 8px;
            }
            
            .invoice-details div {
              text-align: center;
            }
            
            .invoice-details h3 {
              font-size: 10pt;
              font-weight: bold;
              text-transform: uppercase;
              color: #6b7280;
              margin-bottom: 5px;
            }
            
            .invoice-details p {
              font-size: 12pt;
              font-weight: bold;
              color: #1f2937;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            
            .items-table th {
              background: #f3f4f6;
              padding: 12px 8px;
              text-align: left;
              font-size: 10pt;
              font-weight: bold;
              text-transform: uppercase;
              color: #374151;
              border: 1px solid #d1d5db;
            }
            
            .items-table td {
              padding: 10px 8px;
              border: 1px solid #d1d5db;
              font-size: 11pt;
            }
            
            .items-table .text-right {
              text-align: right;
            }
            
            .totals {
              margin-left: auto;
              width: 300px;
              margin-bottom: 30px;
            }
            
            .totals table {
              width: 100%;
              border-collapse: collapse;
            }
            
            .totals td {
              padding: 8px 12px;
              border: 1px solid #d1d5db;
              font-size: 11pt;
            }
            
            .totals .total-row {
              font-weight: bold;
              background: #f3f4f6;
            }
            
            .notes-section {
              margin-bottom: 25px;
              padding: 15px;
              background: #f8fafc;
              border-left: 4px solid #3b82f6;
              border-radius: 4px;
            }
            
            .notes-section h3 {
              font-size: 12pt;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 8px;
            }
            
            .notes-section p {
              font-size: 11pt;
              line-height: 1.5;
              color: #374151;
              margin: 0;
            }
            
            .tva-exempt-section {
              margin-bottom: 25px;
              padding: 15px;
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              border-radius: 4px;
            }
            
            .tva-exempt-section h3 {
              font-size: 12pt;
              font-weight: bold;
              color: #92400e;
              margin-bottom: 8px;
            }
            
            .tva-exempt-section p {
              font-size: 11pt;
              line-height: 1.5;
              color: #451a03;
              margin: 0;
              font-style: italic;
            }
              .legal-section {
              margin-top: 40px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            
            .legal-section h3 {
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 15px;
              color: #1f2937;
            }
            
            .legal-clause {
              background: #f9fafb;
              padding: 12px;
              margin-bottom: 10px;
              border-radius: 4px;
              border-left: 3px solid #3b82f6;
            }
            
            .legal-clause h4 {
              font-size: 10pt;
              font-weight: bold;
              margin-bottom: 5px;
              color: #1f2937;
            }
            
            .legal-clause p {
              font-size: 9pt;
              line-height: 1.3;
              color: #4b5563;
            }
            
            .payment-info {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
            }
            
            .payment-info > div {
              width: 48%;
              background: #f9fafb;
              padding: 15px;
              border-radius: 4px;
            }
            
            .payment-info h4 {
              font-size: 11pt;
              font-weight: bold;
              margin-bottom: 10px;
              color: #1f2937;
            }
            
            .payment-info .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 10pt;
            }
            
            .warning-box {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              padding: 8px;
              border-radius: 4px;
              margin-top: 10px;
            }
            
            .warning-box p {
              font-size: 9pt;
              color: #92400e;
              margin: 0;
            }
            
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .page-break { page-break-before: always; }
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
    setScale(isFullscreen ? 0.8 : 1);
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-white rounded-lg shadow-xl ${isFullscreen ? 'w-full h-full' : 'max-w-6xl max-h-[90vh]'} flex flex-col`}>
        
        {/* 工具栏 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">打印预览 - {previewInvoiceNumber}</h2>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">缩放:</label>
              <select 
                value={scale} 
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={0.5}>50%</option>
                <option value={0.6}>60%</option>
                <option value={0.7}>70%</option>
                <option value={0.8}>80%</option>
                <option value={0.9}>90%</option>
                <option value={1}>100%</option>
                <option value={1.1}>110%</option>
                <option value={1.2}>120%</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPrinter className="mr-2 h-4 w-4" />
              打印
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {isFullscreen ? <FiMinimize2 className="h-4 w-4" /> : <FiMaximize2 className="h-4 w-4" />}
            </button>
            
            <button
              onClick={onClose}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 预览内容 */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div 
            className="mx-auto bg-white shadow-lg"
            style={{ 
              width: `${210 * scale}mm`,
              minHeight: `${297 * scale}mm`,
              transform: `scale(${scale})`,
              transformOrigin: 'top center'
            }}
          >
            <div ref={printRef} className="print-container p-8">
              
              {/* 发票头部 */}
              <div className="header">
                <div className="company-info">
                  <h2>De / From</h2>
                  {user?.logo && (
                    <div className="mb-4">
                      <img 
                        src={`${process.env.REACT_APP_API_URL || ''}${user.logo}`} 
                        alt="Company Logo" 
                        style={{ height: '60px', width: 'auto', maxWidth: '200px', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                  <p><strong>{formData?.sellerCompanyName || user?.companyName || user?.firstName + ' ' + user?.lastName}</strong></p>
                  <p>{formData?.sellerEmail || user?.email}</p>
                  <p>{formData?.sellerPhone || user?.phone}</p>
                  <p>{formData?.sellerAddress || user?.address}</p>
                  {(formData?.sellerVATNumber || user?.vatNumber) && (
                    <p>TVA: {formData?.sellerVATNumber || user.vatNumber}</p>
                  )}
                  {(formData?.sellerSIREN || user?.siren) && (
                    <p>SIREN: {formData?.sellerSIREN || user.siren}</p>
                  )}
                  {(formData?.sellerSIRET || user?.siretNumber) && (
                    <p>SIRET: {formData?.sellerSIRET || user.siretNumber}</p>
                  )}
                  {(formData?.sellerLegalForm || user?.legalForm) && (
                    <p>Forme juridique: {formData?.sellerLegalForm || user.legalForm}</p>
                  )}
                  {(formData?.sellerRegisteredCapital || user?.registeredCapital) && (
                    <p>Capital social: {formData?.sellerRegisteredCapital || user.registeredCapital}</p>
                  )}
                  {(formData?.sellerRCS || user?.rcs) && (
                    <p>RCS: {formData?.sellerRCS || user.rcs}</p>
                  )}
                  {(formData?.sellerNAF || user?.nafCode) && (
                    <p>Code NAF: {formData?.sellerNAF || user.nafCode}</p>
                  )}
                </div>
                
                <div className="client-info">
                  <h2>À / To</h2>
                  {selectedClient ? (
                    <>
                      {/* 优先显示公司名，如果没有公司名则显示个人姓名 */}
                      {selectedClient.company ? (
                        <>
                          <p><strong>{selectedClient.company}</strong></p>
                          {selectedClient.name && (
                            <p>À l'attention de: {selectedClient.name}</p>
                          )}
                        </>
                      ) : (
                        selectedClient.name && (
                          <p><strong>{selectedClient.name}</strong></p>
                        )
                      )}
                      {selectedClient.phone && <p>{selectedClient.phone}</p>}
                      {selectedClient.address && <p>{selectedClient.address}</p>}
                      {selectedClient.city && selectedClient.postalCode && (
                        <p>{selectedClient.city}, {selectedClient.postalCode}</p>
                      )}
                      {selectedClient.country && <p>{selectedClient.country}</p>}
                      {selectedClient.vatNumber && <p>TVA: {selectedClient.vatNumber}</p>}
                    </>
                  ) : (
                    <p style={{ fontStyle: 'italic', color: '#6b7280' }}>Aucun client sélectionné</p>
                  )}
                </div>
              </div>

              {/* 发票详情 */}
              <div className="invoice-details">
                <div>
                  <h3>Date de Facture</h3>
                  <p>{formData.issueDate}</p>
                </div>
                <div>
                  <h3>Date d'Échéance</h3>
                  <p>{formData.dueDate}</p>
                </div>
                <div>
                  <h3>Date de Service</h3>
                  <p>{formData.serviceDate || formData.deliveryDate || formData.issueDate}</p>
                </div>
                <div>
                  <h3>Montant Total</h3>
                  <p>{formatCurrency(total)}</p>
                </div>
              </div>

              {/* 项目表格 */}
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Description</th>
                    <th className="text-right" style={{ width: '10%' }}>Qté</th>
                    <th className="text-right" style={{ width: '15%' }}>Prix Unit.</th>
                    <th className="text-right" style={{ width: '10%' }}>TVA</th>
                    <th className="text-right" style={{ width: '15%' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.description || 'Description du service'}</td>
                      <td className="text-right">{item.quantity}</td>
                      <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="text-right">{item.taxRate}%</td>
                      <td className="text-right">{formatCurrency(calculateItemTotal(item))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 总计 */}
              <div className="totals">
                <table>
                  <tr>
                    <td>Sous-total</td>
                    <td className="text-right">{formatCurrency(subtotal)}</td>
                  </tr>
                  <tr>
                    <td>TVA</td>
                    <td className="text-right">{formatCurrency(taxAmount)}</td>
                  </tr>
                  {formData.tvaExempt && (
                    <tr>
                      <td colSpan="2" style={{ fontSize: '10pt', fontStyle: 'italic', textAlign: 'center' }}>
                        TVA non applicable, art. 293 B du CGI
                      </td>
                    </tr>
                  )}
                  {formData.reverseCharge && (
                    <tr>
                      <td colSpan="2" style={{ fontSize: '10pt', fontStyle: 'italic', textAlign: 'center' }}>
                        Autoliquidation - Article 196 de la Directive 2006/112/CE
                      </td>
                    </tr>
                  )}
                  <tr className="total-row">
                    <td><strong>Total</strong></td>
                    <td className="text-right"><strong>{formatCurrency(total)}</strong></td>
                  </tr>
                </table>
              </div>

              {/* 备注已移除 - 简化界面，详细信息已包含在PDF的法律条款中 */}

              {/* 备注 */}
              {formData.notes && (
                <div className="notes-section">
                  <h3>Notes</h3>
                  <p>{formData.notes}</p>
                </div>
              )}

              {/* TVA豁免条款 */}
              {formData.tvaExempt && formData.tvaExemptClause && (
                <div className="tva-exempt-section">
                  <h3>Exonération de TVA</h3>
                  <p>{formData.tvaExemptClause}</p>
                </div>
              )}

              {/* 法律条款 */}
              <div className="legal-section">
                <h3>Conditions Légales / Legal Terms</h3>
                
                <div className="legal-clause">
                  <h4>Garantie des vices cachés (Article 1641 du Code Civil)</h4>
                  <p>Le vendeur est tenu de la garantie à raison des défauts cachés de la chose vendue qui la rendent impropre à l'usage auquel on la destine, ou qui diminuent tellement cet usage que l'acheteur ne l'aurait pas acquise, ou n'en aurait donné qu'un moindre prix, s'il les avait connus.</p>
                </div>

                {/* TVA信息 - 只在法国模板中显示 */}
                {(selectedTemplate && (selectedTemplate.startsWith('french-') || selectedTemplate === 'france-template')) && (
                  <div className="legal-clause">
                    <h4>Information TVA</h4>
                    <p>
                      {(() => {
                        if (formData.tvaExempt) {
                          return 'Cette facture est exonérée de TVA conformément à la réglementation applicable. TVA non applicable – Art. 293 B du CGI (Régime de la franchise en base de TVA).';
                        } else if (formData.autoLiquidation) {
                          return 'TVA à la charge du preneur conformément à l\'article 283-2 du CGI (auto-liquidation). Le destinataire de cette facture doit acquitter la TVA selon les modalités d\'auto-liquidation prévues par la réglementation en vigueur.';
                        } else {
                          return `TVA applicable selon l'article 256 du Code général des impôts. Numéro de TVA intracommunautaire : ${formData.sellerVATNumber || user?.vatNumber || 'FR12345678901'}`;
                        }
                      })()}
                    </p>
                  </div>
                )}

                {/* 付款信息 */}
                <div className="payment-info">
                  <div>
                    <h4>Coordonnées Bancaires</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px', alignItems: 'center' }}>
                      <span>IBAN:</span>
                      <span style={{ fontFamily: 'monospace' }}>
                        {user?.Company?.bankInfo?.iban || user?.bankIBAN || formData.bankIBAN || ''}
                      </span>
                      
                      <span>BIC/SWIFT:</span>
                      <span style={{ fontFamily: 'monospace' }}>
                        {user?.Company?.bankInfo?.bic || user?.bankBIC || formData.bankBIC || ''}
                      </span>
                      
                      <span>Banque:</span>
                      <span>
                        {user?.Company?.bankInfo?.bankName || user?.bankName || formData.bankName || ''}
                      </span>
                      
                      <span>Titulaire:</span>
                      <span>
                        {user?.Company?.bankInfo?.accountHolder || user?.accountHolder || formData.accountHolder || user?.companyName || formData.sellerCompanyName || 'Nom de l\'entreprise'}
                      </span>
                    </div>
                    <div className="info-row">
                      <span>Mode:</span>
                      <span>{formData.paymentMethod || 'Virement bancaire'}</span>
                    </div>
                    {formData.paymentReference && (
                      <div className="info-row">
                        <span>Référence:</span>
                        <span>{formData.paymentReference}</span>
                      </div>
                    )}
                    {formData.discountTerms && (
                      <div className="info-row">
                        <span>Escompte:</span>
                        <span>{formData.discountTerms}</span>
                      </div>
                    )}
                    <div className="warning-box">
                      <p><strong>Pénalités de retard:</strong> 3 fois le taux d'intérêt légal + indemnité forfaitaire de 40€ (Art. L441-6 du Code de commerce)</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4>Clause de réserve de propriété</h4>
                    <p style={{ fontSize: '10pt', lineHeight: '1.3', color: '#4b5563' }}>Nous nous réservons la propriété des biens vendus jusqu'au paiement intégral du prix, en principal et accessoires. En cas de défaut de paiement, nous pourrons revendiquer ces biens.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPreview;