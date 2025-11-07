import React from 'react';
import { FiFileText } from 'react-icons/fi';

const EnhancedTerms = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <FiFileText className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">服务条款</h1>
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
          1.1 本服务条款（以下简称"本条款"）是您与本公司之间关于使用本电子发票管理系统（以下简称"本服务"）所订立的协议。
        </p>
        <p className="mb-4">
          1.2 本服务由本公司开发、运营并提供技术支持，旨在为用户提供专业的电子发票管理、生成、存储及相关服务。
        </p>
        <p className="mb-6">
          1.3 用户在注册、登录或使用本服务时，即表示已阅读、理解并同意接受本条款的全部内容。如用户不同意本条款，请立即停止使用本服务。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第二条 服务内容</h2>
        <p className="mb-4">
          2.1 本服务主要包括但不限于：电子发票生成、发票模板管理、客户信息管理、发票数据统计分析、云端存储服务等功能。
        </p>
        <p className="mb-4">
          2.2 本公司有权根据业务发展需要，对服务内容进行调整、升级或优化，并将通过适当方式通知用户。
        </p>
        <p className="mb-6">
          2.3 用户理解并同意，本服务可能因系统维护、升级或不可抗力等因素出现暂时中断，本公司将尽力减少此类情况的发生。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第三条 用户权利与义务</h2>
        <p className="mb-4">
          3.1 用户有权按照本条款约定使用本服务，享受本公司提供的技术支持和客户服务。
        </p>
        <p className="mb-4">
          3.2 用户应当提供真实、准确、完整的注册信息，并及时更新相关信息。用户对其账户信息的真实性、合法性承担全部责任。
        </p>
        <p className="mb-4">
          3.3 用户应当妥善保管账户密码，不得将账户借给他人使用。因用户原因导致的账户安全问题，由用户自行承担责任。
        </p>
        <p className="mb-6">
          3.4 用户承诺不利用本服务从事违法违规活动，不上传、传播违法有害信息，不侵犯他人合法权益。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第四条 知识产权</h2>
        <p className="mb-4">
          4.1 本服务的软件著作权、商标权、专利权等知识产权均归本公司所有，受相关法律法规保护。
        </p>
        <p className="mb-4">
          4.2 用户在使用本服务过程中产生的数据，其所有权归用户所有。本公司仅在提供服务的必要范围内使用相关数据。
        </p>
        <p className="mb-6">
          4.3 未经本公司书面许可，用户不得复制、修改、传播本服务的任何内容，不得进行反向工程、反汇编等行为。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第五条 隐私保护</h2>
        <p className="mb-4">
          5.1 本公司高度重视用户隐私保护，将按照相关法律法规和本公司隐私政策处理用户个人信息。
        </p>
        <p className="mb-4">
          5.2 本公司采用行业标准的安全措施保护用户数据，包括但不限于数据加密、访问控制、安全审计等。
        </p>
        <p className="mb-6">
          5.3 除法律法规要求或用户明确同意外，本公司不会向第三方披露用户个人信息。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第六条 费用与支付</h2>
        <p className="mb-4">
          6.1 本服务采用订阅制收费模式，具体收费标准以本公司官方网站公布的价格为准。
        </p>
        <p className="mb-4">
          6.2 用户应当按时支付服务费用。逾期未支付的，本公司有权暂停或终止提供服务。
        </p>
        <p className="mb-6">
          6.3 本公司保留调整收费标准的权利，调整前将提前30天通知用户。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第七条 免责声明</h2>
        <p className="mb-4">
          7.1 本公司对因不可抗力、网络故障、系统维护等原因导致的服务中断或数据丢失不承担责任。
        </p>
        <p className="mb-4">
          7.2 用户因使用本服务产生的税务、法律等问题，应当咨询相关专业人士，本公司不承担相应责任。
        </p>
        <p className="mb-6">
          7.3 本公司对用户使用本服务的结果不作任何明示或暗示的保证，用户应当自行承担使用风险。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第八条 违约责任</h2>
        <p className="mb-4">
          8.1 用户违反本条款约定的，本公司有权采取警告、暂停服务、终止服务等措施，并保留追究法律责任的权利。
        </p>
        <p className="mb-4">
          8.2 因用户违约给本公司造成损失的，用户应当承担赔偿责任。
        </p>
        <p className="mb-6">
          8.3 本公司违反本条款约定的，应当承担相应的违约责任。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第九条 争议解决</h2>
        <p className="mb-4">
          9.1 因本条款引起的争议，双方应当首先通过友好协商解决。
        </p>
        <p className="mb-4">
          9.2 协商不成的，任何一方均可向本公司所在地人民法院提起诉讼。
        </p>
        <p className="mb-6">
          9.3 本条款的解释、效力及争议解决均适用中华人民共和国法律。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第十条 其他条款</h2>
        <p className="mb-4">
          10.1 本条款构成双方就相关事项的完整协议，取代此前的任何口头或书面协议。
        </p>
        <p className="mb-4">
          10.2 本条款的修改需经本公司同意，修改后的条款将通过适当方式通知用户。
        </p>
        <p className="mb-4">
          10.3 本条款部分条款无效的，不影响其他条款的效力。
        </p>
        <p className="mb-8">
          10.4 本条款自发布之日起生效。
        </p>

        <div className="border-t pt-8 mt-12">
          <div className="text-center text-gray-600">
            <p className="mb-2">如有疑问，请联系我们：</p>
            <p className="mb-1">邮箱：support@invoicesystem.com</p>
            <p className="mb-1">电话：400-123-4567</p>
            <p>地址：北京市朝阳区xxx路xxx号</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTerms;