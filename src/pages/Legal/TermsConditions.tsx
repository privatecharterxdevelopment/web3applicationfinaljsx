import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function TermsConditions() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-[88px]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-light">General Terms & Conditions</h1>
              <p className="text-gray-600 mt-2">Last Updated: September 2025 | Version: 2.1</p>
            </div>

            <section className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">1. Scope and Agreement</h2>
                <p className="text-gray-600">
                  By accessing, using, or registering on the PrivatecharterX (PCX) platform, you agree to be legally bound by these Terms and Conditions. These Terms govern all services provided by PCX, a Swiss company, to you, the User.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">2. Our Services</h2>
                <p className="text-gray-600 mb-2">PCX provides a comprehensive luxury travel ecosystem. Our services include, but are not limited to:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                  <li>Private Jet, Helicopter, and Air Taxi Charter</li>
                  <li>Yacht Charter</li>
                  <li>Luxury Ground Transportation & Limousine Services</li>
                  <li>Concierge Services</li>
                  <li>Fixed Travel Packages</li>
                  <li>Digital Assets: Membership NFTs, $PVCX Token ecosystem, and Carbon Offset Certificates</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">3. Booking and Confirmation</h2>
                <div className="space-y-3 text-gray-600">
                  <p>A contract is formed only upon PCX's written booking confirmation.</p>
                  <p>All bookings require full passenger details and a valid payment method.</p>
                  <p>PCX reserves the right to decline any booking at its sole discretion.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">4. Changes and Cancellations</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-medium mb-2">4.1. Changes by PCX:</h3>
                    <p className="text-gray-600 mb-2">We may modify schedules due to operational, safety, or weather reasons. Our compensation policy is:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                      <li>Change ≤2 hours: No compensation.</li>
                      <li>Change 2-6 hours: 25% service fee refund or alternative arrangement.</li>
                      <li>Change &gt;6 hours: 50% service fee refund or full rebooking.</li>
                      <li>Same-day cancellation: 100% refund or priority rebooking.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">4.2. Cancellation by You:</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                      <li>Private Jets: &gt;72h: 10% fee | 48-72h: 25% fee | 24-48h: 50% fee | &lt;24h: 75% fee | No-show: 100% fee.</li>
                      <li>Helicopters/Air Taxis: &gt;48h: 15% fee | 24-48h: 40% fee | &lt;24h: 80% fee.</li>
                      <li>Cancellations due to weather or force majeure events receive a full refund or rebooking.</li>
                      <li>Empty Leg Flights are non-refundable under any circumstances.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">5. Safety and Security</h2>
                <div className="space-y-3 text-gray-600">
                  <p>The pilot-in-command has final authority on all safety decisions.</p>
                  <p>All passengers and baggage are subject to security screening.</p>
                  <p>Passengers must comply with all crew instructions. Disruptive behavior may result in flight diversion and legal action.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">6. Luggage</h2>
                <div className="space-y-3 text-gray-600">
                  <p>Standard weight allowances apply (e.g., Light Jet: 50kg, Heavy Jet: 200kg).</p>
                  <p>Liability for lost or damaged baggage is limited by the Montreal Convention 1999 (approx. $1,700 per passenger). Valuable items should be declared and insured separately.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">7. $PVCX Token Ecosystem</h2>
                <div className="space-y-3 text-gray-600">
                  <p>Users earn 1.5 $PVCX tokens per kilometer flown on completed flights.</p>
                  <p>Tokens can be used for payments within the PCX ecosystem and traded on authorized exchanges.</p>
                  <p className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <strong>Cryptocurrency Investment Warning:</strong> $PVCX tokens are subject to extreme price volatility and regulatory risks. PCX is not responsible for financial gains or losses.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">8. Membership NFT Program</h2>
                <p className="text-gray-600 mb-2">Holders of a PCX Membership NFT are entitled to perpetual benefits, including:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                  <li>One Free (renewable) Empty Leg Flight</li>
                  <li>Up to 10% permanent discount on Private Jet bookings</li>
                  <li>Priority access to Empty Leg flights</li>
                  <li>Complimentary limousine transfers in Switzerland</li>
                  <li>24/7 Priority Support</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">9. Carbon Offset Program</h2>
                <div className="space-y-3 text-gray-600">
                  <p>PCX facilitates the creation of project-specific carbon offset certificates for any flight. Certificates are:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Created through officially recognized NGOs (VCS, Gold Standard).</li>
                    <li>Minted as NFTs on the blockchain for maximum transparency and to prevent fraud.</li>
                    <li>Permanently retired in the official registry upon purchase.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">10. Payment Terms</h2>
                <div className="space-y-3 text-gray-600">
                  <p><strong>Accepted Methods:</strong> Major credit/debit cards (via Stripe), bank transfers (SEPA, SWIFT), and cryptocurrencies (USDC, USDT, ETH, BTC, $PVCX).</p>
                  <p className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <strong>Volatility Warning:</strong> PCX is not responsible for gains/losses due to cryptocurrency price fluctuations between payment initiation and confirmation.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">11. Liability</h2>
                <div className="space-y-3 text-gray-600">
                  <p>For international flights, liability is governed by the Montreal Convention 1999.</p>
                  <p>PCX's total aggregate liability is limited to the service fees paid for the specific service, with a maximum of CHF 100,000 (more on request depending on location in accordance with insurance and PrivatecharterX) per incident for non-aviation services.</p>
                  <p>PCX guarantees service performance to Users regardless of Operator performance, assuming direct contractual responsibility for all service obligations.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">12. Data Protection</h2>
                <div className="space-y-3 text-gray-600">
                  <p>We process your personal data to perform our contract and comply with the law. We employ stringent security measures (AES-256/TLS 1.3 encryption). You have rights to access, rectify, and erase your data, subject to legal limitations. Data written to the blockchain is immutable and cannot be erased.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">13. Governing Law and Jurisdiction</h2>
                <p className="text-gray-600">These Terms are governed exclusively by Swiss law. The courts of Zurich, Switzerland, have exclusive jurisdiction.</p>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">14. Contact Information</h2>
                <div className="space-y-2 text-gray-600">
                  <p>General Inquiries: <a href="mailto:info@privatecharterx.com" className="text-black hover:underline">info@privatecharterx.com</a></p>
                  <p>Customer Support: <a href="mailto:support@privatecharterx.com" className="text-black hover:underline">support@privatecharterx.com</a></p>
                  <p>Order our detailed multi-page charter agreement: <a href="mailto:admin@privatecharterx.com" className="text-black hover:underline">admin@privatecharterx.com</a></p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-xl">
                <h3 className="font-semibold text-blue-900 mb-2">Acknowledgment</h3>
                <p className="text-blue-800 text-sm">
                  By accessing or using PCX services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
