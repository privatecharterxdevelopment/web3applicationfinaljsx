import React from 'react';
import LandingHeader from '../../components/Landingpagenew/LandingHeader';
import Footer from '../../components/Landingpagenew/Footer';

export default function TermsConditions() {
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
          Terms & Conditions
        </h1>
        <p className="text-gray-500 text-sm">Last Updated: December 2024 | Version: 2.3</p>
      </section>

      {/* Content */}
      <section className="px-4 sm:px-8 pb-16 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 space-y-8">

          {/* Section 1 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">1. Scope and Agreement</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              By accessing, using, or registering on the PrivateCharterX (PCX) platform, you agree to be legally bound by these Terms and Conditions.
              These Terms govern all services provided by PCX, a US company registered in Miami, Florida, to you, the User.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">2. Our Services</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-2">PCX provides a comprehensive luxury travel ecosystem. Our services include:</p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 text-sm ml-4">
              <li>Private Jet, Helicopter, and Air Taxi Charter</li>
              <li>Yacht Charter (Q1 2026)</li>
              <li>Luxury Ground Transportation & Limousine Services</li>
              <li>AI-Powered Concierge Services (Sphera AI)</li>
              <li>Fixed Travel Packages</li>
              <li>Digital Assets: Membership NFTs, $PVCX Token ecosystem, and Carbon Offset Certificates</li>
              <li>Asset Tokenization and SPV Formation Services</li>
            </ul>
          </div>

          {/* Section 3 - AI Services */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">3. AI Services (Sphera AI)</h2>
            <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
              <p>Our platform utilizes Sphera AI, an artificial intelligence assistant, to enhance your experience:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-4">
                <li>AI provides recommendations and estimates based on available data, which may not always be accurate</li>
                <li>All pricing shown by AI are estimates until confirmed by our operations team</li>
                <li>AI-generated bookings require human verification before becoming binding contracts</li>
                <li>You retain the right to request human assistance at any point in the booking process</li>
                <li>PCX is not liable for errors in AI-generated information or recommendations</li>
              </ul>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">4. Booking and Confirmation</h2>
            <div className="space-y-2 text-gray-600 text-sm leading-relaxed">
              <p>A contract is formed only upon PCX's written booking confirmation.</p>
              <p>All bookings require full passenger details and a valid payment method.</p>
              <p>PCX reserves the right to decline any booking at its sole discretion.</p>
            </div>
          </div>

          {/* Section 5 - Detailed Cancellation Fees */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">5. Cancellation, Changes & No-Show Policy</h2>

            <h3 className="text-sm font-medium text-gray-700">5.1. Changes by PCX</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-2">We may modify schedules due to operational, safety, or weather reasons:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-700 font-medium">Change Type</th>
                    <th className="px-3 py-2 text-left text-gray-700 font-medium">Compensation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="px-3 py-2 text-gray-600">Change ≤2 hours</td><td className="px-3 py-2 text-gray-600">No compensation</td></tr>
                  <tr><td className="px-3 py-2 text-gray-600">Change 2-6 hours</td><td className="px-3 py-2 text-gray-600">25% service fee refund or alternative</td></tr>
                  <tr><td className="px-3 py-2 text-gray-600">Change &gt;6 hours</td><td className="px-3 py-2 text-gray-600">50% service fee refund or rebooking</td></tr>
                  <tr><td className="px-3 py-2 text-gray-600">Same-day cancellation</td><td className="px-3 py-2 text-gray-600">100% refund or priority rebooking</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-sm font-medium text-gray-700 pt-4">5.2. Private Jet Charter - Cancellation Fees</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-700 font-medium">Notice Period</th>
                    <th className="px-3 py-2 text-left text-gray-700 font-medium">Cancellation Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="px-3 py-2 text-gray-600">&gt;7 days before departure</td><td className="px-3 py-2 text-gray-600">5% of total booking</td></tr>
                  <tr><td className="px-3 py-2 text-gray-600">72h - 7 days</td><td className="px-3 py-2 text-gray-600">10% of total booking</td></tr>
                  <tr><td className="px-3 py-2 text-gray-600">48h - 72h</td><td className="px-3 py-2 text-gray-600">25% of total booking</td></tr>
                  <tr><td className="px-3 py-2 text-gray-600">24h - 48h</td><td className="px-3 py-2 text-gray-600">50% of total booking</td></tr>
                  <tr><td className="px-3 py-2 text-gray-600">&lt;24h before departure</td><td className="px-3 py-2 text-gray-600">75% of total booking</td></tr>
                  <tr className="bg-red-50"><td className="px-3 py-2 text-red-700 font-medium">No-Show</td><td className="px-3 py-2 text-red-700 font-medium">100% of total booking</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-sm font-medium text-gray-700 pt-4">5.3. Helicopter Charter - Cancellation Fees</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-700 font-medium">Notice Period</th>
                    <th className="px-3 py-2 text-left text-gray-700 font-medium">Cancellation Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="px-3 py-2 text-gray-600">&gt;48 hours</td><td className="px-3 py-2 text-gray-600">15% of total booking</td></tr>
                  <tr><td className="px-3 py-2 text-gray-600">24h - 48h</td><td className="px-3 py-2 text-gray-600">40% of total booking</td></tr>
                  <tr><td className="px-3 py-2 text-gray-600">&lt;24h before departure</td><td className="px-3 py-2 text-gray-600">80% of total booking</td></tr>
                  <tr className="bg-red-50"><td className="px-3 py-2 text-red-700 font-medium">No-Show</td><td className="px-3 py-2 text-red-700 font-medium">100% of total booking</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-sm font-medium text-gray-700 pt-4">5.4. Ground Transport - Cancellation Fees</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-700 font-medium">Notice Period</th>
                    <th className="px-3 py-2 text-left text-gray-700 font-medium">Cancellation Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="px-3 py-2 text-gray-600">&gt;24 hours</td><td className="px-3 py-2 text-gray-600">Free cancellation</td></tr>
                  <tr><td className="px-3 py-2 text-gray-600">12h - 24h</td><td className="px-3 py-2 text-gray-600">25% of total booking</td></tr>
                  <tr><td className="px-3 py-2 text-gray-600">&lt;12h before pickup</td><td className="px-3 py-2 text-gray-600">50% of total booking</td></tr>
                  <tr className="bg-red-50"><td className="px-3 py-2 text-red-700 font-medium">No-Show</td><td className="px-3 py-2 text-red-700 font-medium">100% of total booking</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-sm font-medium text-gray-700 pt-4">5.5. Special Conditions</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm ml-4">
              <li><strong>Empty Leg Flights:</strong> Non-refundable under any circumstances</li>
              <li><strong>Weather/Force Majeure:</strong> Full refund or free rebooking</li>
              <li><strong>Medical Emergency:</strong> Rebooking without fee (with documentation)</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">6. Safety and Security</h2>
            <div className="space-y-2 text-gray-600 text-sm leading-relaxed">
              <p>The pilot-in-command has final authority on all safety decisions.</p>
              <p>All passengers and baggage are subject to security screening.</p>
              <p>Passengers must comply with all crew instructions. Disruptive behavior may result in flight diversion and legal action.</p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">7. Luggage</h2>
            <div className="space-y-2 text-gray-600 text-sm leading-relaxed">
              <p>Standard weight allowances apply (e.g., Light Jet: 50kg, Heavy Jet: 200kg).</p>
              <p>Liability for lost or damaged baggage is limited by the Montreal Convention 1999 (~$1,700 per passenger). Valuable items should be declared and insured separately.</p>
            </div>
          </div>

          {/* Section 8 - GDPR/DSGVO */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">8. Data Protection & GDPR Compliance</h2>
            <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
              <p>PCX is fully committed to compliance with the General Data Protection Regulation (GDPR/DSGVO) and other applicable data protection laws.</p>

              <h3 className="text-sm font-medium text-gray-700 pt-2">8.1. Your Rights under GDPR</h3>
              <ul className="list-disc list-inside space-y-1.5 ml-4">
                <li><strong>Right of Access:</strong> Request a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your data ("Right to be Forgotten")</li>
                <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Right to Object:</strong> Object to processing, including automated decision-making</li>
              </ul>

              <h3 className="text-sm font-medium text-gray-700 pt-2">8.2. Legal Basis for Processing</h3>
              <ul className="list-disc list-inside space-y-1.5 ml-4">
                <li>Contract performance (booking and service delivery)</li>
                <li>Legal obligations (aviation regulations, tax laws)</li>
                <li>Legitimate interests (fraud prevention, service improvement)</li>
                <li>Consent (marketing communications, AI personalization)</li>
              </ul>

              <h3 className="text-sm font-medium text-gray-700 pt-2">8.3. Data Retention</h3>
              <p>Booking records: 7 years (legal requirement). AI chat history: 2 years. Marketing data: Until consent withdrawal.</p>

              <h3 className="text-sm font-medium text-gray-700 pt-2">8.4. Data Protection Officer</h3>
              <p>Contact: <a href="mailto:dpo@privatecharterx.com" className="text-gray-900 hover:underline">dpo@privatecharterx.com</a></p>
            </div>
          </div>

          {/* Section 9 - Sensitive Documents */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">9. Transmission of Sensitive Documents</h2>
            <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
              <p>For bookings requiring identity verification, visa assistance, or KYC compliance, you may need to submit sensitive documents (passports, IDs, proof of address).</p>

              <h3 className="text-sm font-medium text-gray-700 pt-2">9.1. Standard Transmission</h3>
              <p>Unless you explicitly request otherwise, all documents are transmitted via PCX's standard encrypted channels:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-4">
                <li>End-to-end encryption (TLS 1.3/AES-256)</li>
                <li>Secure cloud storage with access controls</li>
                <li>Automatic deletion after 90 days (unless legally required to retain)</li>
              </ul>

              <h3 className="text-sm font-medium text-gray-700 pt-2">9.2. Alternative Transmission Methods</h3>
              <p>Upon your explicit written request, documents may be transmitted via:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-4">
                <li>Unencrypted email (at your own risk)</li>
                <li>Third-party secure file sharing services</li>
                <li>Physical mail or courier</li>
              </ul>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mt-2">
                <p className="text-amber-800 text-sm">
                  <strong>Important:</strong> PCX is not liable for data breaches or loss resulting from transmission methods explicitly requested by you that deviate from our standard encrypted procedures.
                </p>
              </div>

              <h3 className="text-sm font-medium text-gray-700 pt-2">9.3. Document Handling</h3>
              <ul className="list-disc list-inside space-y-1.5 ml-4">
                <li>Documents are only shared with operators and authorities as strictly necessary</li>
                <li>Staff access is limited on a need-to-know basis</li>
                <li>You can request immediate deletion of documents after service completion</li>
              </ul>
            </div>
          </div>

          {/* Section 10 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">10. $PVCX Token Ecosystem</h2>
            <div className="space-y-2 text-gray-600 text-sm leading-relaxed">
              <p>Users earn 1.5 $PVCX tokens per kilometer flown on completed flights.</p>
              <p>Tokens can be used for payments within the PCX ecosystem and traded on authorized exchanges.</p>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mt-2">
                <p className="text-amber-800 text-sm">
                  <strong>Investment Warning:</strong> $PVCX tokens are subject to extreme price volatility and regulatory risks. PCX is not responsible for financial gains or losses.
                </p>
              </div>
            </div>
          </div>

          {/* Section 11 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">11. Membership NFT Program</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-2">Holders of a PCX Membership NFT are entitled to perpetual benefits:</p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 text-sm ml-4">
              <li>One Free (renewable) Empty Leg Flight</li>
              <li>Up to 10% permanent discount on Private Jet bookings</li>
              <li>Priority access to Empty Leg flights</li>
              <li>Complimentary limousine transfers</li>
              <li>24/7 Priority Support</li>
            </ul>
          </div>

          {/* Section 12 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">12. Payment Terms</h2>
            <div className="space-y-2 text-gray-600 text-sm leading-relaxed">
              <p><strong>Accepted Methods:</strong> Major credit/debit cards (via Stripe), bank transfers (SEPA, SWIFT), and cryptocurrencies (USDC, USDT, ETH, BTC, $PVCX).</p>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mt-2">
                <p className="text-amber-800 text-sm">
                  <strong>Volatility Warning:</strong> PCX is not responsible for gains/losses due to cryptocurrency price fluctuations between payment initiation and confirmation.
                </p>
              </div>
            </div>
          </div>

          {/* Section 13 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">13. Liability</h2>
            <div className="space-y-2 text-gray-600 text-sm leading-relaxed">
              <p>For international flights, liability is governed by the Montreal Convention 1999.</p>
              <p>PCX's total aggregate liability is limited to the service fees paid for the specific service, with a maximum of $100,000 per incident for non-aviation services.</p>
              <p>PCX guarantees service performance to Users regardless of Operator performance.</p>
            </div>
          </div>

          {/* Section 14 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">14. Governing Law and Jurisdiction</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              These Terms are governed by the laws of the State of Florida, United States. The courts of Miami-Dade County, Florida have exclusive jurisdiction.
              For EU residents, you may also bring claims in your country of residence under applicable consumer protection laws.
            </p>
          </div>

          {/* Section 15 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">15. Contact Information</h2>
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
              <p className="text-gray-600">
                General: <a href="mailto:info@privatecharterx.com" className="text-gray-900 hover:underline">info@privatecharterx.com</a>
              </p>
              <p className="text-gray-600">
                Support: <a href="mailto:support@privatecharterx.com" className="text-gray-900 hover:underline">support@privatecharterx.com</a>
              </p>
              <p className="text-gray-600">
                Data Protection: <a href="mailto:dpo@privatecharterx.com" className="text-gray-900 hover:underline">dpo@privatecharterx.com</a>
              </p>
              <p className="text-gray-600">
                Address: 1000 Brickell Ave., Suite 715, Miami, FL 33131, United States
              </p>
            </div>
          </div>

          {/* Acknowledgment */}
          <div className="bg-gray-900 text-white p-4 rounded-xl">
            <h3 className="font-medium mb-2">Acknowledgment</h3>
            <p className="text-gray-300 text-sm">
              By accessing or using PCX services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
