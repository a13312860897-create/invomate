import React from 'react';
import { FiShield } from 'react-icons/fi';

const EnhancedPrivacy = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <FiShield className="w-8 h-8 text-green-600" />
          <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
        </div>
        <div className="text-gray-600 space-y-1">
          <p>Last updated: November 5, 2025</p>
        </div>
      </div>

      {/* 法律文书内容 */}
      <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">1. Introduction</h2>
        <p>
          This Privacy Policy explains how Invomate ("the Service") collects, uses, and protects your personal data. Invomate is operated by an independent developer known as Shimingzi ("the Developer", "we", "us").
        </p>
        <p>
          We take privacy seriously and apply the principle of data minimization — we only collect the information strictly necessary for the platform to function.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">2. Data Collected</h2>
        <p>Invomate collects only limited data:</p>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Account Data</td>
              <td>Email address and password (if registration is used)</td>
              <td>To identify your account</td>
            </tr>
            <tr>
              <td>Technical Data</td>
              <td>Browser type, IP address, logs</td>
              <td>For security and maintenance</td>
            </tr>
            <tr>
              <td>Payment Data</td>
              <td>Managed entirely by third-party payment processors (e.g., Stripe, PayPal)</td>
              <td>For subscription and billing</td>
            </tr>
            <tr>
              <td>Invoice Content</td>
              <td>Entered directly by users. Stored locally in your browser or encrypted in our server if saving is enabled. The developer does not access or review invoice data.</td>
              <td>To generate and manage invoices (user-controlled)</td>
            </tr>
          </tbody>
        </table>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">3. Purpose of Processing</h2>
        <ul>
          <li>To operate and improve the Service</li>
          <li>To provide customer support when requested</li>
          <li>To ensure compliance with applicable law (e.g., accounting retention obligations if applicable)</li>
        </ul>
        <p>We do not sell, rent, or share personal data with third parties.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">4. Legal Basis (GDPR Article 6)</h2>
        <ul>
          <li><span className="font-semibold">Contractual necessity:</span> To provide access to the Service you request</li>
          <li><span className="font-semibold">Legitimate interest:</span> To maintain security and prevent abuse</li>
          <li><span className="font-semibold">Consent:</span> When you voluntarily provide data (e.g., email contact)</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">5. Data Storage and Retention</h2>
        <p>User data is stored securely on servers located within the European Union.</p>
        <p>Invoice data is either stored locally in your browser or securely in encrypted form on the server (if you choose to save it).</p>
        <p>Data is retained only as long as necessary for operation, then deleted automatically.</p>
        <p>
          You may request deletion at any time by emailing <a href="mailto:a13312860897@163.com" className="text-blue-600">a13312860897@163.com</a>.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">6. User Rights (Under GDPR)</h2>
        <ul>
          <li>Right of access to your data</li>
          <li>Right of rectification</li>
          <li>Right to erasure ("right to be forgotten")</li>
          <li>Right to data portability</li>
          <li>Right to restrict or object to processing</li>
        </ul>
        <p>
          You may exercise these rights by contacting: <a href="mailto:a13312860897@163.com" className="text-blue-600">a13312860897@163.com</a>
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">7. Data Security</h2>
        <p>
          We use industry-standard technical measures (encryption, HTTPS, access control) to protect data. However, no system is 100% secure. You use the Service at your own risk.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">8. Data Disclosure</h2>
        <p>We may disclose data only:</p>
        <ul>
          <li>To comply with a legal obligation (e.g., court order)</li>
          <li>To protect the rights, property, or safety of the Developer or users</li>
        </ul>
        <p>We never disclose or sell data for marketing purposes.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">9. Third-Party Services</h2>
        <p>Invomate may rely on third-party providers such as:</p>
        <ul>
          <li>Payment processors (e.g., Stripe, PayPal)</li>
          <li>Analytics or hosting services (e.g., Cloudflare, Vercel, OVH)</li>
        </ul>
        <p>Each third-party service complies with GDPR and processes data under their own privacy terms.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">10. Children’s Privacy</h2>
        <p>
          The Service is not intended for users under 16 years of age. We do not knowingly collect personal data from minors.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">11. International Transfers</h2>
        <p>
          As the Developer is based outside the EU, some data may technically be processed outside the EU. In all cases, equivalent protection measures consistent with GDPR are applied.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">12. Liability Disclaimer</h2>
        <p>
          Invomate is a self-service tool. Users are solely responsible for the accuracy and legality of any data entered or documents generated. The Developer cannot be held liable for any data errors, legal non-compliance, or financial loss arising from user input or misuse of the Service.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">13. Contact</h2>
        <p>
          For any privacy-related inquiries or requests: <a href="mailto:a13312860897@163.com" className="text-blue-600">a13312860897@163.com</a> — Developer alias: Shimingzi
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">14. Governing Law</h2>
        <p>
          This Privacy Policy is governed by French law and the General Data Protection Regulation (EU 2016/679). Disputes shall be subject to the jurisdiction of the courts of Paris, France.
        </p>
      </div>
    </div>
  );
};

export default EnhancedPrivacy;