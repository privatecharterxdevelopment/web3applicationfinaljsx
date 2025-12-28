import React from 'react';
import LandingHeader from '../../components/Landingpagenew/LandingHeader';
import Footer from '../../components/Landingpagenew/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100">
      <LandingHeader showInfoButton={false} />

      {/* Hero Section */}
      <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-4xl mx-auto text-center">
        <div className="mb-6">
          <span className="bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-medium tracking-wide uppercase">
            Legal
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-4 leading-tight">
          Privacy Policy
        </h1>
        <p className="text-gray-500 text-sm">Last Updated: December 2024</p>
      </section>

      {/* Content */}
      <section className="px-4 sm:px-8 pb-16 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 space-y-8">

          <p className="text-gray-600 leading-relaxed">
            PrivateCharterX is committed to protecting your privacy and ensuring the security of your personal information.
            This Privacy Policy outlines how we collect, use, disclose, and safeguard your data in compliance with applicable laws,
            including the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and other relevant regulations.
          </p>

          {/* Section 1 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">1. Information We Collect</h2>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Personal Information</h3>
              <p className="text-gray-600 text-sm leading-relaxed">We may collect personal information from you, including but not limited to:</p>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 text-sm ml-4">
                <li>Name and identity documents</li>
                <li>Contact information (email, phone number, address)</li>
                <li>Payment and billing information</li>
                <li>Travel preferences and booking history</li>
                <li>IP address, browser, and device information</li>
                <li>Wallet addresses for Web3/blockchain transactions</li>
                <li>Information provided through forms, surveys, or chat interactions</li>
              </ul>
            </div>
          </div>

          {/* Section 2 - AI Usage */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">2. AI Services & Data Processing</h2>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Sphera AI Assistant</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Our platform includes Sphera AI, an artificial intelligence assistant powered by advanced language models. When using Sphera AI:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 text-sm ml-4">
                <li>Your chat conversations are processed to provide personalized travel assistance</li>
                <li>Conversations may be stored to improve service quality and maintain booking context</li>
                <li>AI-generated recommendations are based on your stated preferences and travel requirements</li>
                <li>We do not use your personal conversations to train external AI models</li>
                <li>You can request deletion of your chat history at any time</li>
              </ul>
              <h3 className="text-sm font-medium text-gray-700 pt-2">AI Decision-Making</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Sphera AI assists with flight searches, pricing estimates, and booking recommendations. All significant decisions
                (booking confirmations, payments) require human confirmation. You have the right to request human review of any
                AI-assisted decision that significantly affects you.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">3. How We Use Your Information</h2>
            <p className="text-gray-600 text-sm leading-relaxed">We use your personal information for the following purposes:</p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 text-sm ml-4">
              <li>To provide and manage charter booking services</li>
              <li>To process payments and manage transactions</li>
              <li>To personalize your experience through AI-powered recommendations</li>
              <li>To communicate booking confirmations and travel updates</li>
              <li>To improve our platform, services, and AI capabilities</li>
              <li>To send promotional materials (with your consent)</li>
              <li>To comply with legal, regulatory, and aviation requirements</li>
              <li>To facilitate Web3 services including NFT membership and tokenization</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">4. Data Protection & Security</h2>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">GDPR Compliance</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We adhere to the principles of the GDPR, ensuring that your personal data is processed lawfully, fairly, and transparently.
                We implement appropriate technical and organizational measures to protect your data from unauthorized access, disclosure,
                alteration, or destruction.
              </p>
              <h3 className="text-sm font-medium text-gray-700 pt-2">CCPA Compliance</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                For users in California, we comply with the CCPA, providing you with the right to know, delete, and opt-out of the sale
                of your personal information.
              </p>
              <h3 className="text-sm font-medium text-gray-700 pt-2">Blockchain & Web3</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Transactions recorded on public blockchains (e.g., NFT purchases, token transfers) are immutable and publicly visible
                by design. We cannot delete or modify on-chain data. Wallet addresses are pseudonymous but may be linked to your
                identity through our platform records.
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">5. Data Retention</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy,
              unless a longer retention period is required by law. Booking records may be retained for up to 7 years for regulatory
              compliance. AI chat history is retained for 2 years unless you request earlier deletion.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">6. Your Rights</h2>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Under GDPR, you have the right to:</h3>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 text-sm ml-4">
                <li>Access your personal data</li>
                <li>Request rectification or erasure of your personal data</li>
                <li>Object to the processing of your personal data</li>
                <li>Request restriction of processing</li>
                <li>Data portability</li>
                <li>Object to automated decision-making, including AI profiling</li>
                <li>Lodge a complaint with a supervisory authority</li>
              </ul>
              <h3 className="text-sm font-medium text-gray-700 pt-2">Under CCPA, you have the right to:</h3>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 text-sm ml-4">
                <li>Know what personal information we collect about you</li>
                <li>Request deletion of your personal information</li>
                <li>Opt-out of the sale of your personal information</li>
                <li>Non-discrimination for exercising your privacy rights</li>
              </ul>
            </div>
          </div>

          {/* Section 7 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">7. Cookies & Tracking</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and personalize content.
              You can manage your cookie preferences through your browser settings. Essential cookies are required for the platform to function.
              Analytics and marketing cookies are optional and can be disabled.
            </p>
            <h3 className="text-sm font-medium text-gray-700 pt-2">Microsoft Clarity</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              We use Microsoft Clarity to understand how users interact with our website. Clarity captures anonymized session recordings
              and heatmaps to help us improve user experience. This data includes mouse movements, clicks, and scroll behavior, but does
              not collect personal information such as passwords or payment details. You can learn more about Microsoft Clarity's privacy
              practices at <a href="https://clarity.microsoft.com/terms" target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:underline">clarity.microsoft.com/terms</a>.
            </p>
          </div>

          {/* Section 8 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">8. Third-Party Services</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We may share your data with trusted third parties including charter operators, payment processors, identity verification
              services, and cloud infrastructure providers. All third parties are contractually bound to protect your data and use it
              only for specified purposes.
            </p>
          </div>

          {/* Section 9 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">9. Contact Us</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information,
              please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
              <p className="text-gray-600">
                Email: <a href="mailto:privacy@privatecharterx.com" className="text-gray-900 hover:underline">privacy@privatecharterx.com</a>
              </p>
              <p className="text-gray-600">
                Data Protection Officer: <a href="mailto:dpo@privatecharterx.com" className="text-gray-900 hover:underline">dpo@privatecharterx.com</a>
              </p>
              <p className="text-gray-600">
                Address: 1000 Brickell Ave., Suite 715, Miami, FL 33131, United States
              </p>
            </div>
          </div>

          {/* Section 10 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">10. Changes to This Policy</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational,
              or regulatory reasons. Any changes will be posted on this page with an updated effective date. We recommend reviewing
              this policy periodically. Continued use of our services after changes constitutes acceptance of the updated policy.
            </p>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
