import React from 'react';

const LegalNotice = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-6">法律声明（Mentions légales）</h1>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">公司信息</h2>
          <p>公司名称：示例科技有限公司</p>
          <p>注册地址：法国巴黎示例街 123 号</p>
          <p>SIRET：123 456 789 00012</p>
          <p>欧盟增值税号（TVA）：FR12 3456789</p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">出版责任人</h2>
          <p>负责人：Jean Dupont</p>
          <p>联系邮箱：support@example.com</p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">网站托管商</h2>
          <p>托管服务商：Netlify（或其他）</p>
          <p>地址：2325 3rd Street, Suite 215, San Francisco, CA 94107</p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">联系信息</h2>
          <p>邮箱：support@example.com</p>
          <p>电话：+33 1 23 45 67 89</p>
        </section>

        <section className="mt-8 text-sm text-gray-500">
          <p>
            本页面用于满足欧盟/法国法律对网站基础信息公开的要求。若需数据处理协议（DPA）或安全说明，请联系我们以获取正式文本。
          </p>
        </section>
      </div>
    </div>
  );
};

export default LegalNotice;