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
        <p className="text-gray-500 text-sm">Last Updated: December 2024 | Version: 2.2</p>
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

          {/* Section 5 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">5. Changes and Cancellations</h2>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">5.1. Changes by PCX:</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">We may modify schedules due to operational, safety, or weather reasons:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm ml-4">
                <li>Change ≤2 hours: No compensation</li>
                <li>Change 2-6 hours: 25% service fee refund or alternative arrangement</li>
                <li>Change &gt;6 hours: 50% service fee refund or full rebooking</li>
                <li>Same-day cancellation: 100% refund or priority rebooking</li>
              </ul>
              <h3 className="text-sm font-medium text-gray-700 pt-2">5.2. Cancellation by You:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm ml-4">
                <li>Private Jets: &gt;72h: 10% | 48-72h: 25% | 24-48h: 50% | &lt;24h: 75% | No-show: 100%</li>
                <li>Helicopters: &gt;48h: 15% | 24-48h: 40% | &lt;24h: 80%</li>
                <li>Weather/force majeure: Full refund or rebooking</li>
                <li>Empty Leg Flights are non-refundable</li>
              </ul>
            </div>
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

          {/* Section 8 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">8. $PVCX Token Ecosystem</h2>
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

          {/* Section 9 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">9. Membership NFT Program</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-2">Holders of a PCX Membership NFT are entitled to perpetual benefits:</p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 text-sm ml-4">
              <li>One Free (renewable) Empty Leg Flight</li>
              <li>Up to 10% permanent discount on Private Jet bookings</li>
              <li>Priority access to Empty Leg flights</li>
              <li>Complimentary limousine transfers</li>
              <li>24/7 Priority Support</li>
            </ul>
          </div>

          {/* Section 10 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">10. Payment Terms</h2>
            <div className="space-y-2 text-gray-600 text-sm leading-relaxed">
              <p><strong>Accepted Methods:</strong> Major credit/debit cards (via Stripe), bank transfers (SEPA, SWIFT), and cryptocurrencies (USDC, USDT, ETH, BTC, $PVCX).</p>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mt-2">
                <p className="text-amber-800 text-sm">
                  <strong>Volatility Warning:</strong> PCX is not responsible for gains/losses due to cryptocurrency price fluctuations between payment initiation and confirmation.
                </p>
              </div>
            </div>
          </div>

          {/* Section 11 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">11. Liability</h2>
            <div className="space-y-2 text-gray-600 text-sm leading-relaxed">
              <p>For international flights, liability is governed by the Montreal Convention 1999.</p>
              <p>PCX's total aggregate liability is limited to the service fees paid for the specific service, with a maximum of $100,000 per incident for non-aviation services.</p>
              <p>PCX guarantees service performance to Users regardless of Operator performance.</p>
            </div>
          </div>

          {/* Section 12 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">12. Data Protection</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We process your personal data to perform our contract and comply with the law. We employ stringent security measures (AES-256/TLS 1.3 encryption).
              You have rights to access, rectify, and erase your data, subject to legal limitations. Data written to the blockchain is immutable and cannot be erased.
              See our Privacy Policy for full details.
            </p>
          </div>

          {/* Section 13 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">13. Governing Law and Jurisdiction</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              These Terms are governed by the laws of the State of Florida, United States. The courts of Miami-Dade County, Florida have exclusive jurisdiction.
            </p>
          </div>

          {/* Section 14 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">14. Contact Information</h2>
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
              <p className="text-gray-600">
                General: <a href="mailto:info@privatecharterx.com" className="text-gray-900 hover:underline">info@privatecharterx.com</a>
              </p>
              <p className="text-gray-600">
                Support: <a href="mailto:support@privatecharterx.com" className="text-gray-900 hover:underline">support@privatecharterx.com</a>
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
