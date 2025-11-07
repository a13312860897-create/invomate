import React from "react";
import { useTranslation } from "react-i18next";
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
        <div className="flex flex-col items-end space-y-2">
          <div className="text-2xl font-bold text-gray-900">
            {currency} {total}
          </div>
          <div className="flex items-center space-x-3">
            <span 
              className={`px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.bg} ${statusMeta.text}`}
              aria-hidden="true"
            >
              {statusLabel}
            </span>
            <button 
              onClick={() => onSendReminder(invoice)}
              className="px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50"
              aria-label={t('invoices:sendReminder')}
            >
              {t('invoices:sendReminder')}
            </button>
          </div>
          <div className="flex space-x-3 mt-1 text-sm">
            <button 
              onClick={() => onDownloadPDF(invoice)}
              className="underline text-gray-600"
              aria-label={t('invoices:downloadPdf')}
            >
              {t('invoices:downloadPdf')}
            </button>
            <button 
              onClick={() => onUploadProof(invoice)}
              className="underline text-gray-600"
              aria-label={t('invoices:uploadProof')}
            >
              {t('invoices:uploadProof')}
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
      </div>

      {/* Mobile sticky pay bar - 移除支付功能 */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-white border-t p-3 flex items-center justify-between">
        <div className="flex-1 pr-3">
          <div className="text-sm font-medium">{currency} {total}</div>
          <div className="text-xs text-gray-500">Due {dueAt}</div>
        </div>
        <div>
          <button 
            onClick={() => onSendReminder(invoice)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={t('invoices:sendReminder')}
          >
            {t('invoices:sendReminder')}
          </button>
        </div>
      </div>
    </header>
  );
}