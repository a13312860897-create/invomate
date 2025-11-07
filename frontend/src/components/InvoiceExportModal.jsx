import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FiDownload, FiMail, FiPrinter, FiMaximize2, FiMinimize2, FiX, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import { toast } from 'react-toastify';

// 设置PDF.js worker为本地文件，避免跨域与模块Worker兼容性问题
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const InvoiceExportModal = ({ invoice, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // 生成PDF
  useEffect(() => {
    const generatePDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // 转换历史发票数据为导出所需的格式
        const exportData = transformInvoiceForExport(invoice);

        // 调用后端API生成PDF
        const response = await fetch(`/api/invoices/${invoice.id}/pdf`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 获取PDF blob
        const pdfBlob = await response.blob();
        const pdfObjectUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfObjectUrl);

      } catch (error) {
        console.error('PDF generation failed:', error);
        setError(error.message);
        toast.error('PDF generation failed: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (invoice) {
      generatePDF();
    }

    // 清理函数
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [invoice]);

  // 转换历史发票数据为导出格式
  const transformInvoiceForExport = (invoice) => {
    // 将历史发票数据转换为与NewInvoiceForm相同的格式
    return {
      formData: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        clientId: invoice.clientId,
        notes: invoice.notes,
        currency: invoice.currency,
        invoiceMode: invoice.invoiceMode,
        items: invoice.InvoiceItems || [],
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        // 法国特化字段
        tvaExempt: invoice.tvaExempt,
        tvaExemptClause: invoice.tvaExemptClause,
        autoLiquidation: invoice.autoLiquidation,
        // 其他字段
        deliveryAddress: invoice.deliveryAddress,
        deliveryCity: invoice.deliveryCity,
        deliveryPostalCode: invoice.deliveryPostalCode,
        deliveryCountry: invoice.deliveryCountry,
        deliveryDate: invoice.deliveryDate,
        paymentTerms: invoice.paymentTerms,
        paymentDays: invoice.paymentDays
      },
      client: invoice.Client,
      user: invoice.User
    };
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF downloaded successfully');
    }
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
      toast.success('Printing started');
    }
  };

  const handleSendEmail = async () => {
    if (!invoice.Client?.email) {
      toast.error('No email address found for this client');
      return;
    }

    try {
      setSendingEmail(true);

      // 使用包含支付按钮的邮件发送API
      const response = await fetch('/api/ai/send-invoice-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          recipientEmail: invoice.Client.email,
          type: 'invoice',
          attachPDF: true,
          useUserConfig: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      toast.success('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Error sending email: ' + error.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const scaleOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Generating PDF...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Error</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-white rounded-lg shadow-xl ${isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-5/6'} flex flex-col`}>
        {/* 头部控制栏 */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">
              Invoice {invoice.invoiceNumber}
            </h3>
            
            {/* 缩放控制 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleZoomOut}
                className="p-1 text-gray-600 hover:text-gray-800"
                title="Zoom out"
              >
                <FiZoomOut size={16} />
              </button>
              
              <select
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="text-sm border rounded px-2 py-1"
              >
                {scaleOptions.map(option => (
                  <option key={option} value={option}>
                    {Math.round(option * 100)}%
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleZoomIn}
                className="p-1 text-gray-600 hover:text-gray-800"
                title="Zoom in"
              >
                <FiZoomIn size={16} />
              </button>
            </div>

            {/* 页面导航 */}
            {numPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                  disabled={pageNumber <= 1}
                  className="px-2 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {pageNumber} of {numPages}
                </span>
                <button
                  onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                  disabled={pageNumber >= numPages}
                  className="px-2 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              title="Download PDF"
            >
              <FiDownload size={16} />
              <span>Download</span>
            </button>

            <button
              onClick={handleSendEmail}
              disabled={sendingEmail || !invoice.Client?.email}
              className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              title={invoice.Client?.email ? `Send to ${invoice.Client.email}` : 'No email address'}
            >
              <FiMail size={16} />
              <span>{sendingEmail ? 'Sending...' : 'Email'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              title="Print"
            >
              <FiPrinter size={16} />
              <span>Print</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:text-gray-800"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800"
              title="Close"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* PDF预览区域 */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="flex justify-center">
            {pdfUrl && (
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                }
                error={
                  <div className="text-red-600 p-8 text-center">
                    Error loading PDF
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  loading={
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  }
                />
              </Document>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceExportModal;