import React from "react";
import { useTranslation } from "react-i18next";
import { FiSend, FiDownload, FiUpload } from "react-icons/fi";
/**
 * Props:
 * - invoice: {
 *   id, number, clientName, issuedAt, dueAt,
 *   total, currency, status // 'paid' | 'overdue' | 'due' | 'draft'
 * }
 * - onSendReminder(invoice)
 * - onDownloadPDF(invoice)
 * - onUploadProof(invoice)
 *
 * Usage:
 * <InvoiceHeader invoice={invoice} onSendReminder={handleSendReminder} ... />
 */
const STATUS_STYLES = {
  paid: { bg: "bg-green-100", text: "text-green-700", labelKey: "invoices:status.paid" },
  overdue: { bg: "bg-red-100", text: "text-red-700", labelKey: "invoices:status.overdue" },
  due: { bg: "bg-yellow-100", text: "text-yellow-800", labelKey: "invoices:status.due" },
  draft: { bg: "bg-gray-100", text: "text-gray-700", labelKey: "invoices:status.draft" },
};

export default function InvoiceHeader({ 
  invoice = {}, 
  onSendReminder = () => {}, 
  onDownloadPDF = () => {}, 
  onUploadProof = () => {}, 
}) {
  const { t } = useTranslation(['common', 'invoices']);
  const { 
    number = "—", 
    clientName = "Client", 
    issuedAt = "—", 
    dueAt = "—", 
    total = "0.00", 
    currency = "EUR", 
    status = "due", 
  } = invoice;
  
  const statusMeta = STATUS_STYLES[status] || STATUS_STYLES.due;
  const statusLabel = t(statusMeta.labelKey);
  
  return (
    <header role="banner" className="bg-white shadow-sm">
      {/* Desktop / large: header row */}
      <div className="hidden md:flex items-start justify-between px-4 py-4">
        <div>
          <div className="text-sm text-gray-500">
            Invoice <span className="font-medium">{number}</span>
          </div>
          <div className="mt-1 text-lg font-semibold text-gray-900">{clientName}</div>
          <div className="mt-1 text-sm text-gray-600">
            Issued {issuedAt} · Due {dueAt}
          </div>
        </div>
        <div className="flex flex-col items-end space-y-3">
          <div className="text-2xl font-bold text-gray-900">
            {currency} {total}
          </div>
          <div className="flex items-center space-x-2">
            <span 
              className={`px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.bg} ${statusMeta.text}`}
              aria-hidden="true"
            >
              {statusLabel}
            </span>
          </div>
          {/* 重新设计的按钮组 */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => onSendReminder(invoice)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
              aria-label={t('invoices:sendReminder')}
            >
              <FiSend className="w-4 h-4" />
              <span className="text-sm font-medium">{t('invoices:sendReminder')}</span>
            </button>
            <button 
              onClick={() => onDownloadPDF(invoice)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm"
              aria-label={t('invoices:downloadPdf')}
            >
              <FiDownload className="w-4 h-4" />
              <span className="text-sm font-medium">{t('invoices:downloadPdf')}</span>
            </button>
            <button 
              onClick={() => onUploadProof(invoice)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-sm"
              aria-label={t('invoices:uploadProof')}
            >
              <FiUpload className="w-4 h-4" />
              <span className="text-sm font-medium">{t('invoices:uploadProof')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / small: compact header + sticky pay bar */}
      <div className="md:hidden px-4 py-3 border-b">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs text-gray-500">Invoice <span className="font-medium">{number}</span></div>
            <div className="mt-1 text-sm font-semibold">{clientName}</div>
            <div className="mt-1 text-xs text-gray-600">Due {dueAt}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{currency} {total}</div>
            <div className={`mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusMeta.bg} ${statusMeta.text}`}>
              {statusLabel}
            </div>
          </div>
        </div>
        
        {/* Mobile 按钮组 */}
        <div className="mt-4 flex flex-col space-y-2">
          <div className="flex space-x-2">
            <button 
              onClick={() => onSendReminder(invoice)}
              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              aria-label={t('invoices:sendReminder')}
            >
              <FiSend className="w-4 h-4" />
              <span className="text-sm font-medium">{t('invoices:sendReminder')}</span>
            </button>
            <button 
              onClick={() => onDownloadPDF(invoice)}
              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              aria-label={t('invoices:downloadPdf')}
            >
              <FiDownload className="w-4 h-4" />
              <span className="text-sm font-medium">{t('invoices:downloadPdf')}</span>
            </button>
          </div>
          <button 
            onClick={() => onUploadProof(invoice)}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
            aria-label={t('invoices:uploadProof')}
          >
            <FiUpload className="w-4 h-4" />
            <span className="text-sm font-medium">{t('invoices:uploadProof')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}