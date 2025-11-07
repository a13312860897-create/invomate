import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiDownload, FiMail, FiHome } from 'react-icons/fi';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* 成功图标 */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiCheck className="h-10 w-10 text-green-600" />
        </div>

        {/* 标题和描述 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">支付成功！</h1>
        <p className="text-gray-600 mb-8">
          感谢您的付款！您的支付已成功处理，发票已标记为已付款。
        </p>

        {/* 操作按钮 */}
        <div className="space-y-3">
          <button
            onClick={() => window.print()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center"
          >
            <FiDownload className="mr-2" />
            下载收据
          </button>

          <button
            onClick={() => {
              const subject = encodeURIComponent('支付确认');
              const body = encodeURIComponent('您好，\n\n我已成功完成发票支付。\n\n谢谢！');
              window.location.href = `mailto:?subject=${subject}&body=${body}`;
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center"
          >
            <FiMail className="mr-2" />
            发送确认邮件
          </button>

          <div className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center">
            <FiCheck className="mr-2" />
            支付完成
          </div>
        </div>

        {/* 额外信息 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            如果您有任何问题，请联系我们的客服团队。
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;