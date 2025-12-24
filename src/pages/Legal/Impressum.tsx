import React from 'react';
import LandingHeader from '../../components/Landingpagenew/LandingHeader';
import Footer from '../../components/Landingpagenew/Footer';

export default function Impressum() {
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
          Imprint
        </h1>
        <p className="text-gray-500 text-sm">Legal Notice & Company Information</p>
      </section>

      {/* Content */}
      <section className="px-4 sm:px-8 pb-16 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 space-y-8">

          {/* Company Information */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Company Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* US Headquarters */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                <h3 className="text-sm font-medium text-gray-900">US Headquarters</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  PrivateCharterX LLC<br />
                  1000 Brickell Ave., Suite 715<br />
                  Miami, FL 33131<br />
                  United States of America
                </p>
                <p className="text-gray-500 text-xs">Registration Nr: L24000299516</p>
              </div>

              {/* Swiss Branch */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                <h3 className="text-sm font-medium text-gray-900">Swiss Branch</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Bahnhofstrasse 10<br />
                  8001 Zurich<br />
                  Switzerland
                </p>
                <p className="text-gray-500 text-xs italic">
                  Operational address for business activities
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Contact</h2>
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
              <p className="text-gray-600">
                Email: <a href="mailto:info@privatecharterx.com" className="text-gray-900 hover:underline">info@privatecharterx.com</a>
              </p>
              <p className="text-gray-600">
                Phone: <a href="tel:+442045920778" className="text-gray-900 hover:underline">+44 20 4592 0778</a>
              </p>
              <p className="text-gray-600">
                Website: <a href="https://privatecharterx.com" className="text-gray-900 hover:underline">privatecharterx.com</a>
              </p>
            </div>
          </div>

          {/* Management */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Management</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              <strong>Managing Director:</strong> Lorenzo Vanza
            </p>
          </div>

          {/* Registration */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Registration</h2>
            <div className="text-gray-600 text-sm leading-relaxed space-y-1">
              <p><strong>Register Court:</strong> Miami-Dade County, Florida</p>
              <p><strong>Registration Number:</strong> L24000299516</p>
              <p><strong>Date of Registration:</strong> September 10, 2023</p>
            </div>
          </div>

          {/* Responsible for Content */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Responsible for Content</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              According to § 55 Abs. 2 RStV:<br />
              PrivateCharterX LLC<br />
              1000 Brickell Ave., Suite 715<br />
              Miami, FL 33131, USA
            </p>
          </div>

          {/* Disclaimer */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h2 className="text-lg font-medium text-gray-900">Disclaimer</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Liability for Contents</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  The contents of our pages were created with great care. However, we cannot guarantee the correctness,
                  completeness, and up-to-dateness of the contents. As a service provider, we are responsible for our own
                  content on these pages under general law. However, we are not obligated to monitor transmitted or stored
                  third-party information or to investigate circumstances that indicate illegal activity.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Liability for Links</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Our offer contains links to external websites of third parties, over whose contents we have no influence.
                  Therefore, we cannot assume any liability for these external contents. The respective provider or operator
                  of the pages is always responsible for the contents of the linked pages.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Copyright</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  The content and works on these pages created by the site operators are subject to copyright law.
                  Duplication, processing, distribution and any form of commercialization of such material beyond the
                  scope of the copyright law require prior written consent of the respective author or creator.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">AI-Generated Content</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Our platform utilizes artificial intelligence (Sphera AI) to assist users. AI-generated recommendations,
                  estimates, and content are provided for informational purposes only and should not be considered as
                  professional advice. Users should verify all information independently before making decisions.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
