import React from 'react';
import { FiShield } from 'react-icons/fi';

const EnhancedPrivacy = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <FiShield className="w-8 h-8 text-green-600" />
          <h1 className="text-4xl font-bold text-gray-900">隐私政策</h1>
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
          1.1 本隐私政策（以下简称"本政策"）适用于本公司提供的电子发票管理系统及相关服务（以下简称"本服务"）。
        </p>
        <p className="mb-4">
          1.2 本公司深知个人信息对您的重要性，并会尽全力保护您的个人信息安全可靠。我们致力于维持您对我们的信任，恪守以下原则，保护您的个人信息。
        </p>
        <p className="mb-6">
          1.3 在使用本服务前，请您仔细阅读并充分理解本政策。一旦您开始使用本服务，即表示您已充分理解并同意本政策的全部内容。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第二条 信息收集</h2>
        <p className="mb-4">
          2.1 为了向您提供更好的服务，我们可能会收集、储存和使用下列与您有关的信息。若您不提供相关信息，可能无法注册成为我们的用户或无法享受我们提供的某些服务。
        </p>
        <p className="mb-4">
          2.2 您提供的信息：
        </p>
        <p className="mb-2 ml-6">
          (1) 您在注册账户或使用我们的服务时，向我们提供的相关个人信息，例如姓名、电话号码、电子邮件地址、公司名称、税务登记号等；
        </p>
        <p className="mb-2 ml-6">
          (2) 您通过我们的服务向其他方提供的共享信息，以及您使用我们的服务时所储存的信息。
        </p>
        <p className="mb-4">
          2.3 其他方分享的您的信息：
        </p>
        <p className="mb-6 ml-6">
          其他方使用我们的服务时所提供有关您的共享信息。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第三条 信息使用</h2>
        <p className="mb-4">
          3.1 我们可能将在向您提供服务的过程之中所收集的信息用作下列用途：
        </p>
        <p className="mb-2 ml-6">
          (1) 向您提供服务；
        </p>
        <p className="mb-2 ml-6">
          (2) 在我们提供服务时，用于身份验证、客户服务、安全防范、诈骗监测、存档和备份用途，确保我们向您提供的产品和服务的安全性；
        </p>
        <p className="mb-2 ml-6">
          (3) 帮助我们设计新服务，改善我们现有服务；
        </p>
        <p className="mb-2 ml-6">
          (4) 使我们更加了解您如何接入和使用我们的服务，从而针对性地回应您的个性化需求；
        </p>
        <p className="mb-6 ml-6">
          (5) 向您提供与您更加相关的广告以替代普遍投放的广告。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第四条 信息分享</h2>
        <p className="mb-4">
          4.1 我们不会向其他任何公司、组织和个人分享您的个人信息，但以下情况除外：
        </p>
        <p className="mb-2 ml-6">
          (1) 在获取明确同意的情况下分享：获得您的明确同意后，我们会与其他方分享您的个人信息；
        </p>
        <p className="mb-2 ml-6">
          (2) 在法定情形下的分享：我们可能会根据法律法规规定，或按政府主管部门的强制性要求，对外分享您的个人信息；
        </p>
        <p className="mb-2 ml-6">
          (3) 与我们的关联公司分享：您的个人信息可能会与我们的关联公司分享。我们只会分享必要的个人信息，且受本隐私政策中所声明目的的约束；
        </p>
        <p className="mb-6 ml-6">
          (4) 与授权合作伙伴分享：仅为实现本政策中声明的目的，我们的某些服务将由授权合作伙伴提供。我们可能会与合作伙伴分享您的某些个人信息，以提供更好的客户服务和用户体验。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第五条 信息安全</h2>
        <p className="mb-4">
          5.1 我们使用各种安全技术和程序，以防信息的丢失、不当使用、未经授权阅览或披露。
        </p>
        <p className="mb-4">
          5.2 我们将在合理的安全水平内使用各种安全保护措施以保障信息的安全。例如，我们会使用加密技术（如SSL）、匿名化处理等手段来保护您的个人信息。
        </p>
        <p className="mb-4">
          5.3 我们建立专门的管理制度、流程和组织确保信息安全。例如，我们严格限制访问信息的人员范围，要求他们遵守保密义务，并进行审计。
        </p>
        <p className="mb-6">
          5.4 若发生个人信息安全事件，我们会按照法律法规的要求，及时向您告知：安全事件的基本情况和可能的影响、我们已采取或将要采取的处置措施、您可自主防范和降低风险的建议、对您的补救措施等。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第六条 您的权利</h2>
        <p className="mb-4">
          6.1 按照中国相关的法律、法规、标准，以及其他国家、地区的通行做法，我们保障您对自己的个人信息行使以下权利：
        </p>
        <p className="mb-2 ml-6">
          (1) 访问您的个人信息：您有权访问您的个人信息，法律法规规定的例外情况除外；
        </p>
        <p className="mb-2 ml-6">
          (2) 更正您的个人信息：当您发现我们处理的关于您的个人信息有错误时，您有权要求我们做出更正；
        </p>
        <p className="mb-2 ml-6">
          (3) 删除您的个人信息：在以下情形中，您可以向我们提出删除个人信息的请求；
        </p>
        <p className="mb-2 ml-6">
          (4) 改变您授权同意的范围：每个业务功能需要一些基本的个人信息才能得以完成。对于额外收集的个人信息的收集和使用，您可以随时给予或收回您的授权同意；
        </p>
        <p className="mb-6 ml-6">
          (5) 注销账户：您随时可注销此前注册的账户。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第七条 未成年人保护</h2>
        <p className="mb-4">
          7.1 我们非常重视对未成年人个人信息的保护。如果您是18周岁以下的未成年人，在使用我们的服务前，应事先取得您的家长或法定监护人的同意。
        </p>
        <p className="mb-4">
          7.2 对于经父母或法定监护人同意而收集未成年人个人信息的情况，我们只会在受到法律允许、父母或监护人明确同意或者保护未成年人所必要的情况下使用或公开披露此信息。
        </p>
        <p className="mb-6">
          7.3 如果我们发现自己在未事先获得可证实的父母或法定监护人同意的情况下收集了未成年人的个人信息，则会设法尽快删除相关数据。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第八条 Cookie和类似技术</h2>
        <p className="mb-4">
          8.1 为确保网站正常运转，我们会在您的计算机或移动设备上存储名为Cookie的小数据文件。Cookie通常包含标识符、站点名称以及一些号码和字符。
        </p>
        <p className="mb-4">
          8.2 借助于Cookie，网站能够存储您的偏好或购物篮内的商品等数据。我们不会将Cookie用于本政策所述目的之外的任何用途。
        </p>
        <p className="mb-6">
          8.3 您可根据自己的偏好管理或删除Cookie。您可以清除计算机上保存的所有Cookie，大部分网络浏览器都设有阻止Cookie的功能。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第九条 政策更新</h2>
        <p className="mb-4">
          9.1 我们可能适时修订本政策的条款，该等修订构成本政策的一部分。
        </p>
        <p className="mb-4">
          9.2 如该等修订造成您在本政策下权利的实质减少，我们将在修订生效前通过在主页上显著位置提示或向您发送电子邮件或以其他方式通知您。
        </p>
        <p className="mb-6">
          9.3 在该种情况下，若您继续使用我们的服务，即表示同意受经修订的本政策的约束。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">第十条 联系我们</h2>
        <p className="mb-4">
          10.1 如果您对本隐私政策有任何疑问、意见或建议，请通过以下方式与我们联系：
        </p>
        <p className="mb-4 ml-6">
          邮箱：privacy@invoicesystem.com
        </p>
        <p className="mb-4 ml-6">
          电话：400-123-4567
        </p>
        <p className="mb-8 ml-6">
          地址：北京市朝阳区xxx路xxx号
        </p>

        <div className="border-t pt-8 mt-12">
          <div className="text-center text-gray-600">
            <p className="mb-2">我们承诺保护您的隐私权益</p>
            <p className="mb-1">如有任何隐私相关问题，请随时联系我们</p>
            <p>我们将在24小时内回复您的咨询</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPrivacy;