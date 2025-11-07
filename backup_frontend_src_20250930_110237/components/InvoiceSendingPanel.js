import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const InvoiceSendingPanel = ({ invoice, onSendSuccess, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sendingHistory, setSendingHistory] = useState(null);
  const [emailOptions, setEmailOptions] = useState({
    subject: '',
    customMessage: '',
    method: 'auto',
    regeneratePDF: false
  });
  const [peppolOptions, setPeppolOptions] = useState({
    recipientId: ''
  });
  const [activeTab, setActiveTab] = useState('email');

  useEffect(() => {
    if (invoice) {
      // 设置默认邮件主题
      setEmailOptions(prev => ({
        ...prev,
        subject: `${t('invoices:email.defaultSubject')} #${invoice.invoiceNumber} - ${user?.companyName || user?.firstName + ' ' + user?.lastName}`
      }));
      
      // 加载发送历史
      loadSendingHistory();
    }
  }, [invoice, user, t]);

  const loadSendingHistory = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/sending-history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSendingHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to load sending history:', error);
    }
  };

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(emailOptions)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(t('invoices:email.sendSuccess'));
        loadSendingHistory();
        if (onSendSuccess) onSendSuccess('email', data);
      } else {
        alert(t('invoices:email.sendError') + ': ' + data.message);
      }
    } catch (error) {
      console.error('Send email error:', error);
      alert(t('invoices:email.sendError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDGFiP = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/submit-dgfip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(t('invoices:dgfip.submitSuccess') + ' ID: ' + data.submissionId);
        loadSendingHistory();
        if (onSendSuccess) onSendSuccess('dgfip', data);
      } else {
        alert(t('invoices:dgfip.submitError') + ': ' + data.message);
      }
    } catch (error) {
      console.error('DGFiP submission error:', error);
      alert(t('invoices:dgfip.submitError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPeppol = async () => {
    if (!peppolOptions.recipientId) {
      alert(t('invoices:peppol.recipientRequired'));
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/send-peppol`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(peppolOptions)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(t('invoices:peppol.sendSuccess') + ' ID: ' + data.messageId);
        loadSendingHistory();
        if (onSendSuccess) onSendSuccess('peppol', data);
      } else {
        alert(t('invoices:peppol.sendError') + ': ' + data.message);
      }
    } catch (error) {
      console.error('Peppol sending error:', error);
      alert(t('invoices:peppol.sendError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkDGFiPStatus = async () => {
    if (!sendingHistory?.dgfip?.submissionId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/dgfip-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`${t('invoices:dgfip.status')}: ${data.status}`);
        loadSendingHistory();
      } else {
        alert(t('invoices:dgfip.statusError') + ': ' + data.message);
      }
    } catch (error) {
      console.error('DGFiP status check error:', error);
      alert(t('invoices:dgfip.statusError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status, type) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    
    if (type === 'email') {
      return status ? 
        `${baseClasses} bg-green-100 text-green-800` : 
        `${baseClasses} bg-gray-100 text-gray-800`;
    }
    
    if (type === 'dgfip') {
      const statusColors = {
        'submitted': 'bg-blue-100 text-blue-800',
        'processing': 'bg-yellow-100 text-yellow-800',
        'approved': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800'
      };
      return `${baseClasses} ${statusColors[status] || 'bg-gray-100 text-gray-800'}`;
    }
    
    if (type === 'peppol') {
      return status ? 
        `${baseClasses} bg-green-100 text-green-800` : 
        `${baseClasses} bg-gray-100 text-gray-800`;
    }
    
    return `${baseClasses} bg-gray-100 text-gray-800`;
  };

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {t('invoices:sending.title')} #{invoice.invoiceNumber}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 标签页导航 */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('email')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'email'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('invoices:sending.emailTab')}
              </button>
              
              {user?.invoiceMode === 'france' && (
                <>
                  <button
                    onClick={() => setActiveTab('dgfip')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'dgfip'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {t('invoices:sending.dgfipTab')}
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('peppol')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'peppol'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {t('invoices:sending.peppolTab')}
                  </button>
                </>
              )}
              
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('invoices:sending.historyTab')}
              </button>
            </nav>
          </div>

          {/* 邮件发送标签页 */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('invoices:email.subject')}
                </label>
                <input
                  type="text"
                  value={emailOptions.subject}
                  onChange={(e) => setEmailOptions(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('invoices:email.customMessage')}
                </label>
                <textarea
                  value={emailOptions.customMessage}
                  onChange={(e) => setEmailOptions(prev => ({ ...prev, customMessage: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('invoices:email.messagePlaceholder')}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('invoices:email.method')}
                  </label>
                  <select
                    value={emailOptions.method}
                    onChange={(e) => setEmailOptions(prev => ({ ...prev, method: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="auto">{t('invoices:email.methodAuto')}</option>
                    <option value="smtp">{t('invoices:email.methodSMTP')}</option>
                    <option value="resend">{t('invoices:email.methodResend')}</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="regeneratePDF"
                    checked={emailOptions.regeneratePDF}
                    onChange={(e) => setEmailOptions(prev => ({ ...prev, regeneratePDF: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="regeneratePDF" className="text-sm text-gray-700">
                    {t('invoices:email.regeneratePDF')}
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleSendEmail}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('common:sending') : t('invoices:email.send')}
                </button>
              </div>
            </div>
          )}

          {/* DGFiP e-reporting标签页 */}
          {activeTab === 'dgfip' && user?.invoiceMode === 'france' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  {t('invoices:dgfip.title')}
                </h3>
                <p className="text-blue-700 text-sm mb-4">
                  {t('invoices:dgfip.description')}
                </p>
                
                {!user?.vatNumber || !user?.siren ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <p className="text-yellow-800 text-sm">
                      {t('invoices:dgfip.missingInfo')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p><strong>{t('invoices:dgfip.vatNumber')}:</strong> {user.vatNumber}</p>
                    <p><strong>{t('invoices:dgfip.siren')}:</strong> {user.siren}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <button
                  onClick={handleSubmitDGFiP}
                  disabled={loading || !user?.vatNumber || !user?.siren}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('common:submitting') : t('invoices:dgfip.submit')}
                </button>
                
                {sendingHistory?.dgfip?.submissionId && (
                  <button
                    onClick={checkDGFiPStatus}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? t('common:checking') : t('invoices:dgfip.checkStatus')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Peppol网络标签页 */}
          {activeTab === 'peppol' && user?.invoiceMode === 'france' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-purple-900 mb-2">
                  {t('invoices:peppol.title')}
                </h3>
                <p className="text-purple-700 text-sm mb-4">
                  {t('invoices:peppol.description')}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('invoices:peppol.recipientId')}
                </label>
                <input
                  type="text"
                  value={peppolOptions.recipientId}
                  onChange={(e) => setPeppolOptions(prev => ({ ...prev, recipientId: e.target.value }))}
                  placeholder="FR12345678901"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('invoices:peppol.recipientIdHelp')}
                </p>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleSendPeppol}
                  disabled={loading || !peppolOptions.recipientId || !user?.peppolId}
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('common:sending') : t('invoices:peppol.send')}
                </button>
              </div>
              
              {!user?.peppolId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-yellow-800 text-sm">
                    {t('invoices:peppol.missingPeppolId')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 发送历史标签页 */}
          {activeTab === 'history' && sendingHistory && (
            <div className="space-y-6">
              {/* 邮件发送历史 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  {t('invoices:history.email')}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">{t('invoices:history.status')}:</span>
                    <span className={`ml-2 ${getStatusBadge(sendingHistory.email.sent, 'email')}`}>
                      {sendingHistory.email.sent ? t('common:sent') : t('common:notSent')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">{t('invoices:history.sentAt')}:</span>
                    <span className="ml-2">{formatDate(sendingHistory.email.sentAt)}</span>
                  </div>
                  <div>
                    <span className="font-medium">{t('invoices:history.recipient')}:</span>
                    <span className="ml-2">{sendingHistory.email.recipient || '-'}</span>
                  </div>
                  <div>
                    <span className="font-medium">{t('invoices:history.provider')}:</span>
                    <span className="ml-2">{sendingHistory.email.provider || '-'}</span>
                  </div>
                </div>
              </div>

              {/* DGFiP提交历史 */}
              {user?.invoiceMode === 'france' && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {t('invoices:history.dgfip')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">{t('invoices:history.status')}:</span>
                      <span className={`ml-2 ${getStatusBadge(sendingHistory.dgfip.status, 'dgfip')}`}>
                        {sendingHistory.dgfip.status || t('common:notSubmitted')}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">{t('invoices:history.submittedAt')}:</span>
                      <span className="ml-2">{formatDate(sendingHistory.dgfip.submittedAt)}</span>
                    </div>
                    <div>
                      <span className="font-medium">{t('invoices:history.submissionId')}:</span>
                      <span className="ml-2 font-mono text-xs">{sendingHistory.dgfip.submissionId || '-'}</span>
                    </div>
                    <div>
                      <span className="font-medium">{t('invoices:history.validationCode')}:</span>
                      <span className="ml-2">{sendingHistory.dgfip.validationCode || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Peppol发送历史 */}
              {user?.invoiceMode === 'france' && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {t('invoices:history.peppol')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">{t('invoices:history.status')}:</span>
                      <span className={`ml-2 ${getStatusBadge(sendingHistory.peppol.sent, 'peppol')}`}>
                        {sendingHistory.peppol.sent ? t('common:sent') : t('common:notSent')}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">{t('invoices:history.sentAt')}:</span>
                      <span className="ml-2">{formatDate(sendingHistory.peppol.sentAt)}</span>
                    </div>
                    <div>
                      <span className="font-medium">{t('invoices:history.messageId')}:</span>
                      <span className="ml-2 font-mono text-xs">{sendingHistory.peppol.messageId || '-'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceSendingPanel;