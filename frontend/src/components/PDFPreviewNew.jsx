import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FiPrinter, FiX, FiMaximize2, FiMinimize2, FiDownload, FiMail } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// 设置PDF.js worker为本地文件，避免跨域与模块Worker兼容性问题
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const PDFPreviewNew = ({ 
  formData, 
  selectedClient, 
  user, 
  onClose, 
  previewInvoiceNumber 
}) => {
  const { t } = useTranslation(['common', 'invoices']);
  const [scale, setScale] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // 生成PDF并获取URL
  useEffect(() => {
    const generatePDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // 添加API基础URL配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

        // 构建完整的用户Company对象
        const userWithCompany = {
          ...user,
          Company: {
            name: user?.companyName || user?.Company?.name || '',
            address: user?.address || user?.Company?.address || '',
            city: user?.city || user?.Company?.city || '',
            postalCode: user?.postalCode || user?.Company?.postalCode || '',
            country: user?.country || user?.Company?.country || '',
            phone: user?.phone || user?.Company?.phone || '',
            fax: user?.fax || user?.Company?.fax || '',
            email: user?.email || user?.Company?.email || '',
            website: user?.website || user?.Company?.website || '',
            vatNumber: user?.vatNumber || user?.Company?.vatNumber || '',
            // 修复字段映射：使用正确的数据库字段名
            sirenNumber: user?.siren || user?.sirenNumber || user?.Company?.sirenNumber || '',
            siretNumber: user?.siretNumber || user?.siret || user?.Company?.siretNumber || '',
            rcsNumber: user?.rcsNumber || user?.Company?.rcsNumber || '',
            nafCode: user?.nafCode || user?.Company?.nafCode || '',
            legalForm: user?.legalForm || user?.Company?.legalForm || '',
            registeredCapital: user?.registeredCapital || user?.Company?.registeredCapital || '',
            insuranceCompany: user?.insuranceCompany || user?.Company?.insuranceCompany || '',
            insurancePolicyNumber: user?.insurancePolicyNumber || user?.Company?.insurancePolicyNumber || '',
            insuranceCoverage: user?.insuranceCoverage || user?.Company?.insuranceCoverage || '',
            // 统一嵌套银行信息对象，兼容 settings 中的字段
            bankInfo: {
              iban: user?.Company?.bankInfo?.iban || user?.bankIBAN || user?.iban || '',
              bic: user?.Company?.bankInfo?.bic || user?.bankBIC || user?.bic || '',
              bankName: user?.Company?.bankInfo?.bankName || user?.bankName || '',
              accountHolder: user?.Company?.bankInfo?.accountHolder || user?.accountHolder || [user?.firstName, user?.lastName].filter(Boolean).join(' ')
            }
          }
        };

        // 准备发票数据 - 按照后端API期望的格式
        const invoiceData = {
          formData: {
            ...formData,
            invoiceNumber: formData.invoiceNumber || previewInvoiceNumber,
            currency: formData.currency || user?.currency || 'EUR',
            invoiceMode: formData.invoiceMode || 'fr'
          },
          client: selectedClient,
          user: userWithCompany
        };

        // 调用后端API生成PDF - 根据是否有发票ID选择不同的路由
        let response;
        if (invoiceData.formData.id) {
          // 已保存的发票，使用发票ID路由
          response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceData.formData.id}/pdf`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
        } else {
          // 未保存的发票，使用预览PDF生成路由
          response = await fetch(`${API_BASE_URL}/api/pdf/generate-preview`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(invoiceData)
          });
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 获取PDF blob
        const pdfBlob = await response.blob();
        const pdfObjectUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfObjectUrl);

      } catch (error) {
        console.error('PDF生成失败:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    generatePDF();

    // 清理函数
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [formData, selectedClient, user, previewInvoiceNumber]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handlePrint = () => {
    if (pdfUrl) {
      // 创建一个隐藏的iframe来打印PDF
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = pdfUrl;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        iframe.contentWindow.print();
        // 延迟移除iframe，确保打印对话框已打开
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      };
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${formData.invoiceNumber || previewInvoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedClient || !selectedClient.email) {
      setError('Please select a client and ensure the client has an email address');
      return;
    }

    setEmailSending(true);
    setError('');

    try {
      console.log('=== 开始邮件发送流程 ===');
      
      // 添加API基础URL配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      console.log('API_BASE_URL:', API_BASE_URL);

      // 构建用户数据，包含公司信息
      const userWithCompany = {
        ...user,
        Company: {
          ...(user.Company || {}),
          bankInfo: {
            iban: user?.Company?.bankInfo?.iban || user?.bankIBAN || user?.iban || '',
            bic: user?.Company?.bankInfo?.bic || user?.bankBIC || user?.bic || '',
            bankName: user?.Company?.bankInfo?.bankName || user?.bankName || '',
            accountHolder: user?.Company?.bankInfo?.accountHolder || user?.accountHolder || [user?.firstName, user?.lastName].filter(Boolean).join(' ')
          }
        }
      };

      const invoiceData = {
        formData: {
          ...formData,
          invoiceNumber: formData.invoiceNumber || previewInvoiceNumber
        },
        client: selectedClient,
        user: userWithCompany
      };

      console.log('=== 原始数据检查 ===');
      console.log('formData:', formData);
      console.log('selectedClient:', selectedClient);
      console.log('user:', user);
      console.log('previewInvoiceNumber:', previewInvoiceNumber);

      // 首先保存发票到数据库，然后使用包含支付按钮的邮件发送API
      // 确保items数组格式正确
      const validatedItems = (formData.items || []).map((item, index) => {
        console.log(`验证第${index + 1}项:`, item);
        const validatedItem = {
          description: item.description || '',
          quantity: parseFloat(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          taxRate: parseFloat(item.taxRate) || 20
        };
        console.log(`验证后第${index + 1}项:`, validatedItem);
        return validatedItem;
      });

      // 确保clientId是数字类型
      const clientId = parseInt(selectedClient.id, 10);
      console.log('clientId转换:', selectedClient.id, '->', clientId, 'type:', typeof clientId);

      // 计算金额
      console.log('=== 计算发票金额 ===');
      let calculatedSubtotal = 0;
      let calculatedTaxAmount = 0;
      
      validatedItems.forEach((item, index) => {
        const itemSubtotal = item.quantity * item.unitPrice;
        const itemTax = itemSubtotal * (item.taxRate / 100);
        
        console.log(`第${index + 1}项计算:`, {
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          itemSubtotal: itemSubtotal,
          itemTax: itemTax
        });
        
        calculatedSubtotal += itemSubtotal;
        calculatedTaxAmount += itemTax;
      });
      
      const calculatedTotal = calculatedSubtotal + calculatedTaxAmount;
      
      console.log('金额计算结果:', {
        subtotal: calculatedSubtotal,
        taxAmount: calculatedTaxAmount,
        total: calculatedTotal
      });

      const invoicePayload = {
        ...formData,
        invoiceNumber: formData.invoiceNumber || previewInvoiceNumber,
        currency: formData.currency || user?.currency || 'EUR',
        invoiceMode: formData.invoiceMode || 'fr',
        clientId: clientId,
        status: 'sent',
        // 确保包含后端API要求的必需字段
        issueDate: formData.issueDate || new Date().toISOString().split('T')[0],
        dueDate: formData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: validatedItems,
        subtotal: parseFloat(calculatedSubtotal.toFixed(2)),
        taxAmount: parseFloat(calculatedTaxAmount.toFixed(2)),
        total: parseFloat(calculatedTotal.toFixed(2)),
        totalAmount: parseFloat(calculatedTotal.toFixed(2))
      };

      // 添加调试日志
      console.log('=== 发送给后端的发票数据 ===');
      console.log('完整payload:', JSON.stringify(invoicePayload, null, 2));
      console.log('items数组:', invoicePayload.items);
      console.log('clientId:', invoicePayload.clientId, 'type:', typeof invoicePayload.clientId);
      console.log('issueDate:', invoicePayload.issueDate);

      // 验证必需字段
      console.log('=== 前端数据验证 ===');
      if (!invoicePayload.clientId || isNaN(invoicePayload.clientId)) {
        console.error('客户 ID validation failed:', invoicePayload.clientId);
        throw new Error('Invalid client ID');
      }
      console.log('✓ clientId验证通过');
      
      if (!invoicePayload.items || invoicePayload.items.length === 0) {
        console.error('Items validation failed:', invoicePayload.items);
        throw new Error('Invoice items cannot be empty');
      }
      console.log('✓ items数组验证通过，长度:', invoicePayload.items.length);

      // 验证每个item
      for (let i = 0; i < invoicePayload.items.length; i++) {
        const item = invoicePayload.items[i];
        console.log(`验证第${i + 1}项:`, item);
        
        if (!item.description || item.description.trim() === '') {
          console.error(`Item ${i + 1} description validation failed:`, item.description);
          throw new Error(`Item ${i + 1}: description is required`);
        }
        
        if (isNaN(item.quantity) || item.quantity <= 0) {
          console.error(`Item ${i + 1} quantity validation failed:`, item.quantity);
          throw new Error(`Item ${i + 1}: quantity must be greater than 0`);
        }
        
        if (isNaN(item.unitPrice) || item.unitPrice < 0) {
          console.error(`Item ${i + 1} unit price validation failed:`, item.unitPrice);
          throw new Error(`Item ${i + 1}: unit price cannot be negative`);
        }
        
        console.log(`✓ 第${i + 1}项验证通过`);
      }

      console.log('=== 发送HTTP请求到后端 ===');
      const requestUrl = `${API_BASE_URL}/api/invoices`;
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      };
      const requestBody = JSON.stringify(invoicePayload);
      
      console.log('请求URL:', requestUrl);
      console.log('请求头:', requestHeaders);
      console.log('请求体长度:', requestBody.length);
      console.log('请求体内容:', requestBody);

      const saveResponse = await fetch(requestUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody
      });

      console.log('=== 后端响应分析 ===');
      console.log('响应状态:', saveResponse.status);
      console.log('响应状态文本:', saveResponse.statusText);
      console.log('响应头:', Object.fromEntries(saveResponse.headers.entries()));

      // 获取响应文本内容
      const responseText = await saveResponse.text();
      console.log('响应原始内容:', responseText);

      if (!saveResponse.ok) {
      let errorMessage = 'Failed to save invoice';
        let errorDetails = null;
        
        try {
          errorDetails = JSON.parse(responseText);
          console.log('解析后的错误详情:', errorDetails);
          
          if (errorDetails.message) {
            errorMessage = errorDetails.message;
          }
          
          if (errorDetails.details && Array.isArray(errorDetails.details)) {
            errorMessage += ': ' + errorDetails.details.join(', ');
          }
        } catch (parseError) {
          console.error('解析错误响应失败:', parseError);
          errorMessage += ` (HTTP ${saveResponse.status})`;
        }
        
        console.error('保存发票失败，完整错误信息:', {
          status: saveResponse.status,
          statusText: saveResponse.statusText,
          responseText: responseText,
          errorDetails: errorDetails
        });
        
        throw new Error(errorMessage);
      }

      let savedInvoice = null;
      try {
        const responseData = JSON.parse(responseText);
        console.log('保存成功，完整响应数据:', responseData);
        
        // 检查响应格式并提取发票数据
        if (responseData.success && responseData.data && responseData.data.invoice) {
          savedInvoice = responseData.data.invoice;
          console.log('提取的发票数据:', savedInvoice);
        } else if (responseData.id) {
          // 兼容旧格式
          savedInvoice = responseData;
          console.log('使用直接格式的发票数据:', savedInvoice);
        } else {
          console.error('Unable to extract invoice data from response:', responseData);
          throw new Error('Invalid server response: missing invoice data');
        }
        
        console.log('发票ID检查:', {
          savedInvoice: savedInvoice,
          hasId: savedInvoice && 'id' in savedInvoice,
          idValue: savedInvoice ? savedInvoice.id : null,
          idType: savedInvoice ? typeof savedInvoice.id : 'undefined',
          keys: savedInvoice ? Object.keys(savedInvoice) : []
        });
      } catch (parseError) {
        console.error('Failed to parse successful response:', parseError);
        throw new Error('Invalid server response format');
      }

      // 检查发票对象和ID是否存在
      if (!savedInvoice || !savedInvoice.id) {
        console.error('Saved invoice is missing ID:', savedInvoice);
        throw new Error('Saved invoice missing ID; cannot send email');
      }

      // 使用包含支付按钮的邮件发送API
      console.log('=== 开始发送邮件 ===');
      const emailPayload = {
        invoiceId: savedInvoice.id,
        recipientEmail: selectedClient.email,
        type: 'invoice',
        attachPDF: true,
        useUserConfig: true
      };
      
      console.log('邮件发送payload:', emailPayload);

      const response = await fetch(`${API_BASE_URL}/api/ai/send-invoice-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(emailPayload)
      });

      console.log('邮件发送响应状态:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('邮件发送失败:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('邮件发送成功:', result);
      setEmailSent(true);
      
      // 显示成功消息
      alert(`邮件已成功发送至 ${selectedClient.email}`);

    } catch (error) {
      console.error('=== 邮件发送流程失败 ===');
      console.error('错误类型:', error.constructor.name);
      console.error('错误消息:', error.message);
      console.error('错误堆栈:', error.stack);
      
      setError(`邮件发送失败: ${error.message}`);
      alert(`邮件发送失败: ${error.message}`);
    } finally {
      setEmailSending(false);
    }
  };

  if (loading) {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`}>
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg">正在生成PDF预览...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`}>
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">PDF生成失败</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-white rounded-lg shadow-xl ${isFullscreen ? 'w-full h-full' : 'max-w-6xl max-h-[90vh]'} flex flex-col`}>
        {/* 工具栏 */}
        <div className="flex justify-between items-center p-4 border-b no-print">
          <h2 className="text-xl font-bold text-gray-800">
            {t('common:printPreview')} - PDF
          </h2>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">缩放:</label>
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
                <option value={1.5}>150%</option>
              </select>
            </div>
            {numPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  disabled={pageNumber <= 1}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  ←
                </button>
                <span className="text-sm">
                  {pageNumber} / {numPages}
                </span>
                <button
                  onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                  disabled={pageNumber >= numPages}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  →
                </button>
              </div>
            )}
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              title="下载PDF"
            >
              <FiDownload size={16} />
              <span>下载</span>
            </button>
            <button
              onClick={handleSendEmail}
              disabled={emailSending || !selectedClient?.email}
              className={`flex items-center space-x-2 px-4 py-2 rounded ${
                emailSending || !selectedClient?.email
                  ? 'bg-gray-400 cursor-not-allowed'
                  : emailSent
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              } text-white`}
              title={!selectedClient?.email ? "客户邮箱地址不存在" : emailSent ? "邮件已发送" : "发送邮件"}
            >
              <FiMail size={16} />
              <span>
                {emailSending ? '发送中...' : emailSent ? '已发送' : '发送邮件'}
              </span>
            </button>
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
              title={isFullscreen ? "退出全屏" : "全屏"}
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

        {/* PDF预览内容 */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          <div className="flex justify-center">
            {pdfUrl && (
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(error) => {
                  console.error('PDF加载错误:', error);
                  setError(`PDF加载失败: ${error.message}`);
                }}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">加载PDF中...</span>
                  </div>
                }
                error={
                  <div className="text-center p-8">
                    <div className="text-red-500 text-4xl mb-2">⚠️</div>
                    <p className="text-red-600">PDF加载失败</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      刷新页面重试
                    </button>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  onRenderError={(error) => {
                    console.error('页面渲染错误:', error);
                  }}
                />
              </Document>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewNew;