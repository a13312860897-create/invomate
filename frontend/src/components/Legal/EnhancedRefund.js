import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';

const EnhancedRefund = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <FiRefreshCw className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">退款政策</h1>
        </div>
        <div className="text-gray-600 space-y-1">
          <p>生效日期：2024年1月1日</p>
          <p>最后更新：2024年1月1日</p>
        </div>
      </div>

      {/* 法律文书内容 */}
      <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第一条 总则</h2>
        <p className="mb-4">
          1.1 本退款政策（以下简称"本政策"）适用于本公司提供的电子发票管理系统及相关服务（以下简称"本服务"）的退款事宜。
        </p>
        <p className="mb-4">
          1.2 本公司致力于为用户提供优质的服务体验，同时建立公平合理的退款机制，保障用户和公司的合法权益。
        </p>
        <p className="mb-6">
          1.3 用户在申请退款前，请仔细阅读并充分理解本政策的全部内容。申请退款即表示您同意遵守本政策的相关规定。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第二条 退款适用范围</h2>
        <p className="mb-4">
          2.1 本政策适用于以下付费服务的退款申请：
        </p>
        <p className="mb-2 ml-6">
          (1) 专业版订阅服务；
        </p>
        <p className="mb-2 ml-6">
          (2) 企业版订阅服务；
        </p>
        <p className="mb-2 ml-6">
          (3) 增值服务包；
        </p>
        <p className="mb-2 ml-6">
          (4) 其他付费功能或服务。
        </p>
        <p className="mb-6">
          2.2 免费服务和试用服务不适用于本退款政策。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第三条 退款条件</h2>
        <p className="mb-4">
          3.1 用户可在以下情况下申请退款：
        </p>
        <p className="mb-2 ml-6">
          (1) 服务重大功能缺陷：服务存在严重影响正常使用的技术问题，且在合理期限内无法修复；
        </p>
        <p className="mb-2 ml-6">
          (2) 服务中断：因本公司原因导致服务连续中断超过24小时；
        </p>
        <p className="mb-2 ml-6">
          (3) 误操作购买：用户因操作失误购买了不需要的服务，且在购买后7日内未实际使用相关功能；
        </p>
        <p className="mb-2 ml-6">
          (4) 重复付费：因系统错误导致的重复扣费；
        </p>
        <p className="mb-6 ml-6">
          (5) 其他合理情况：经本公司审核认定的其他合理退款情形。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第四条 不予退款情形</h2>
        <p className="mb-4">
          4.1 以下情况不予退款：
        </p>
        <p className="mb-2 ml-6">
          (1) 用户违反服务条款被终止服务；
        </p>
        <p className="mb-2 ml-6">
          (2) 用户已正常使用服务超过30天；
        </p>
        <p className="mb-2 ml-6">
          (3) 因用户自身原因（如网络问题、设备问题等）无法使用服务；
        </p>
        <p className="mb-2 ml-6">
          (4) 用户对服务功能的主观不满意（非客观缺陷）；
        </p>
        <p className="mb-2 ml-6">
          (5) 已享受优惠价格或促销活动的订单；
        </p>
        <p className="mb-6 ml-6">
          (6) 超过退款申请时限的情况。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第五条 退款申请流程</h2>
        <p className="mb-4">
          5.1 退款申请应按以下流程进行：
        </p>
        <p className="mb-2 ml-6">
          (1) 提交申请：用户通过客服邮箱或在线客服系统提交退款申请；
        </p>
        <p className="mb-2 ml-6">
          (2) 提供材料：提供订单号、付款凭证、退款原因说明等必要材料；
        </p>
        <p className="mb-2 ml-6">
          (3) 审核处理：本公司在收到申请后5个工作日内完成审核；
        </p>
        <p className="mb-2 ml-6">
          (4) 结果通知：审核结果将通过邮件或站内消息通知用户；
        </p>
        <p className="mb-6 ml-6">
          (5) 退款执行：审核通过后，退款将在7个工作日内原路返回。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第六条 退款时限</h2>
        <p className="mb-4">
          6.1 退款申请时限规定：
        </p>
        <p className="mb-2 ml-6">
          (1) 订阅服务：自订阅开始之日起30日内可申请退款；
        </p>
        <p className="mb-2 ml-6">
          (2) 一次性付费服务：自购买之日起7日内可申请退款；
        </p>
        <p className="mb-2 ml-6">
          (3) 系统错误导致的问题：发现问题后30日内可申请退款；
        </p>
        <p className="mb-6 ml-6">
          (4) 特殊情况：根据具体情况确定申请时限。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第七条 退款金额计算</h2>
        <p className="mb-4">
          7.1 退款金额按以下方式计算：
        </p>
        <p className="mb-2 ml-6">
          (1) 未使用服务：全额退款；
        </p>
        <p className="mb-2 ml-6">
          (2) 部分使用服务：按未使用时间比例退款；
        </p>
        <p className="mb-2 ml-6">
          (3) 系统错误：全额退款并可能给予额外补偿；
        </p>
        <p className="mb-6 ml-6">
          (4) 特殊情况：根据实际情况确定退款金额。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第八条 退款方式</h2>
        <p className="mb-4">
          8.1 退款将通过以下方式进行：
        </p>
        <p className="mb-2 ml-6">
          (1) 原支付渠道退回：优先通过原支付方式退回款项；
        </p>
        <p className="mb-2 ml-6">
          (2) 银行转账：如原支付渠道无法退回，可通过银行转账方式退款；
        </p>
        <p className="mb-2 ml-6">
          (3) 账户余额：经用户同意，可退至用户账户余额；
        </p>
        <p className="mb-6 ml-6">
          (4) 其他方式：根据具体情况协商确定的其他退款方式。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第九条 争议处理</h2>
        <p className="mb-4">
          9.1 如用户对退款决定有异议，可通过以下方式申请复议：
        </p>
        <p className="mb-2 ml-6">
          (1) 在收到退款决定通知后7日内提出复议申请；
        </p>
        <p className="mb-2 ml-6">
          (2) 提供详细的异议理由和相关证据材料；
        </p>
        <p className="mb-2 ml-6">
          (3) 本公司将在收到复议申请后10个工作日内给出最终决定；
        </p>
        <p className="mb-6 ml-6">
          (4) 如仍有争议，可通过法律途径解决。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第十条 特殊说明</h2>
        <p className="mb-4">
          10.1 以下特殊情况的退款处理：
        </p>
        <p className="mb-2 ml-6">
          (1) 企业用户：企业用户的退款申请需提供企业授权书等额外材料；
        </p>
        <p className="mb-2 ml-6">
          (2) 批量订单：批量购买的订单退款需单独评估；
        </p>
        <p className="mb-2 ml-6">
          (3) 第三方支付：通过第三方支付平台的退款可能需要额外时间；
        </p>
        <p className="mb-6 ml-6">
          (4) 跨境支付：涉及跨境支付的退款可能产生汇率差异和手续费。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第十一条 政策更新</h2>
        <p className="mb-4">
          11.1 本公司保留随时修改本退款政策的权利。
        </p>
        <p className="mb-4">
          11.2 政策修改后，将在网站显著位置公布，并通过邮件等方式通知用户。
        </p>
        <p className="mb-6">
          11.3 修改后的政策自公布之日起生效，不影响已提交的退款申请。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第十二条 联系方式</h2>
        <p className="mb-4">
          12.1 如需申请退款或咨询退款相关问题，请通过以下方式联系我们：
        </p>
        <p className="mb-4 ml-6">
          退款专线：400-123-4567（工作时间：9:00-18:00）
        </p>
        <p className="mb-4 ml-6">
          邮箱：refund@invoicesystem.com
        </p>
        <p className="mb-4 ml-6">
          在线客服：登录系统后点击右下角客服图标
        </p>
        <p className="mb-8 ml-6">
          地址：北京市朝阳区xxx路xxx号
        </p>

        <div className="border-t pt-8 mt-12">
          <div className="text-center text-gray-600">
            <p className="mb-2">我们承诺公平、透明的退款处理</p>
            <p className="mb-1">如有任何退款相关问题，请随时联系我们</p>
            <p>我们将在24小时内回复您的咨询</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedRefund;