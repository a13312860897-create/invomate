import React from 'react';
import { FiFileText } from 'react-icons/fi';

const EnhancedTerms = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <FiFileText className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
        </div>
        <div className="text-gray-600 space-y-1">
          <p>Last updated: November 5, 2025</p>
          <p className="text-sm">English version prevails. A French translation is available upon request.</p>
        </div>
      </div>

      {/* Legal content */}
      <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">1. Introduction</h2>
        <p>
          Welcome to Invomate, an online invoicing and billing platform designed to help individuals and businesses generate and manage invoices easily.
        </p>
        <p>
          Invomate is developed and operated by an independent developer known as Shimingzi ("the Developer", "we", "us", "our").
        </p>
        <p>
          By using Invomate, you ("the User", "you", "your") agree to these Terms of Service ("Terms"). If you do not agree with these Terms, please stop using the Service immediately.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">2. Legal Status of the Provider</h2>
        <p>
          Invomate is operated by an independent software developer acting as a non-incorporated professional. This means that the Service is provided as-is, without any corporate legal entity. The Developer is based in France and acts under French law as an independent creator (développeur indépendant).
        </p>
        <p>
          For any inquiries, you can contact us at: <a href="mailto:a13312860897@163.com" className="text-blue-600">a13312860897@163.com</a>
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">3. Service Description</h2>
        <p>Invomate provides access to:</p>
        <ul>
          <li>Online invoice creation and preview</li>
          <li>Custom templates (standard VAT, VAT-exempt, and reverse-charge)</li>
          <li>Optional paid features and integrations</li>
        </ul>
        <p>
          We strive to ensure availability and accuracy, but the Service is provided "as is" and without guarantee of uninterrupted operation.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">4. User Responsibility</h2>
        <p>You are solely responsible for:</p>
        <ul>
          <li>The accuracy and legality of the data you input (including company information, VAT, SIREN/SIRET numbers, invoice content, etc.);</li>
          <li>Compliance with your own local tax obligations;</li>
          <li>Keeping your account credentials safe.</li>
        </ul>
        <p>
          The Developer cannot be held liable for any errors, omissions, or non-compliance in the invoices generated through the platform.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">5. Data &amp; Privacy</h2>
        <p>Invomate complies with the General Data Protection Regulation (GDPR).</p>
        <p>We collect only minimal technical data necessary for operation (e.g., IP, logs, email).</p>
        <p>We do not access, sell, or share the invoice content created by users.</p>
        <p>Users may request full deletion of their data by email at any time.</p>
        <p>
          <span className="font-semibold">Disclaimer:</span> Invomate is a self-service tool. The User remains fully responsible for verifying that all invoice data complies with applicable tax and accounting laws.
        </p>
        <p>See the Privacy Policy for more details.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">6. Payment &amp; Subscription</h2>
        <p>
          Certain advanced features may require payment. All prices are displayed before confirmation. Payments are processed via trusted third-party gateways (e.g., Stripe, PayPal).
        </p>
        <p>
          No refund will be issued once an invoice has been successfully generated or data exported, except as required by law.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">7. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law:</p>
        <ul>
          <li>The Developer shall not be liable for any direct, indirect, incidental, or consequential damages resulting from use or inability to use the Service.</li>
          <li>The Service is provided without warranties, including fitness for a particular purpose or legal accuracy.</li>
          <li>Users generate and use invoices at their own risk.</li>
        </ul>
        <p>
          If a dispute arises, the total liability of the Developer shall not exceed the total amount paid by the User during the last 12 months.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">8. Intellectual Property</h2>
        <p>
          All code, design, and documentation within Invomate are the intellectual property of the Developer. Users retain full ownership of the invoice content they create. You may not copy, resell, or reproduce the Service without explicit permission.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">9. Termination</h2>
        <p>
          The Developer reserves the right to suspend or terminate any account that violates these Terms or is used for fraudulent or illegal purposes. Users may delete their account at any time by contacting support.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">10. Governing Law &amp; Jurisdiction</h2>
        <p>
          These Terms are governed by French law. In the event of a dispute, jurisdiction is assigned to the courts of Paris, France.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">11. Language Clause</h2>
        <p>
          These Terms are written in English for international accessibility. A French translation is available upon request. In case of discrepancy, the English version shall prevail.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">12. Contact</h2>
        <p>
          For questions, concerns, or legal inquiries: <a href="mailto:a13312860897@163.com" className="text-blue-600">a13312860897@163.com</a> — Developer alias: Shimingzi
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Notes</h2>
        <ul>
          <li>Includes GDPR compliance and responsibility disclaimer.</li>
          <li>Independent developer status clearly stated (avoids company misrepresentation).</li>
          <li>French law applied (compliant with DGCCRF and CNIL expectations).</li>
          <li>Legal risks transferred to the user ("self-service tool").</li>
        </ul>
      </div>
    </div>
  );
};

export default EnhancedTerms;