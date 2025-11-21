import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '../components/Landing/Header';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Content */}
      <main className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12">
            <h1 className="text-5xl font-medium text-gray-900 mb-2 tracking-tight" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Privacy Policy
            </h1>
            <p className="text-sm text-gray-600 mb-8">Last updated: November 2025</p>

            <div className="max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-medium text-gray-900 mb-4">Introduction</h2>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  Welcome to DexRais.funds. We respect your privacy and are committed to protecting your personal data.
                  This privacy policy explains how we collect, use, and safeguard your information when you use our
                  decentralized fundraising platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-medium text-gray-900 mb-4">Information We Collect</h2>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 mb-4">
                  <li>Email address and account credentials</li>
                  <li>Wallet addresses (public blockchain data)</li>
                  <li>Campaign information and project details</li>
                  <li>Profile information and preferences</li>
                  <li>Transaction data (on-chain and off-chain)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-medium text-gray-900 mb-4">How We Use Your Information</h2>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 mb-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Comply with legal obligations and prevent fraud</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-medium text-gray-900 mb-4">Cookies and Tracking</h2>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  We use cookies and similar tracking technologies to track activity on our platform and hold certain information.
                  Cookies are files with a small amount of data which may include an anonymous unique identifier.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However,
                  if you do not accept cookies, you may not be able to use some portions of our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-medium text-gray-900 mb-4">Blockchain Data</h2>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  Please note that transactions on the blockchain are public and permanent. Any information you include
                  in blockchain transactions will be publicly visible and cannot be deleted or modified.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-medium text-gray-900 mb-4">Data Security</h2>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  We implement appropriate technical and organizational measures to protect your personal data against
                  unauthorized or unlawful processing, accidental loss, destruction, or damage.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-medium text-gray-900 mb-4">Your Rights</h2>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 mb-4">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to processing of your data</li>
                  <li>Request data portability</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-medium text-gray-900 mb-4">Contact Us</h2>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  If you have any questions about this Privacy Policy, please contact us at{' '}
                  <a href="mailto:privacy@dexrais.funds" className="text-sm text-gray-900 hover:text-gray-700 underline transition-colors">
                    privacy@dexrais.funds
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-xl font-medium text-gray-900 mb-4">Changes to This Policy</h2>
                <p className="text-sm text-gray-700 leading-relaxed">
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting
                  the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
