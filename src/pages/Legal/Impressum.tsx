import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function Impressum() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* Main Content */}
      <main className="flex-1 pt-[88px]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            <h1 className="text-3xl font-bold mb-8">Impressum</h1>
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Information according to § 5 TMG</h2>
              <div className="space-y-2">
                <h3 className="font-medium">PrivatecharterX Headquarters:</h3>
                <p>1000 Brickell Ave., Suite 715<br />Miami, FL 33131<br />United States</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Swiss Branch:</h3>
                <p>Bahnhofstrasse 10<br />8001 Zurich<br />Switzerland</p>
                <p className="text-sm text-gray-500 italic">
                  The operational address for business activities is Bahnhofstrasse 10, 8001 Zurich.
                  The registered administrative address for legal and regulatory purposes is Bahnhofstrasse 37/10, 8001 Zurich.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Contact:</h3>
                <p>Email: info@privatecharterx.com</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Represented by:</h3>
                <p>Lorenzo Vanza, Managing Director</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Register Entry:</h3>
                <p>10 Sept. 2023<br />Register court: Miami-Dade County<br />Registration number: 15340661</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Responsible for content according to § 55 Abs. 2 RStV:</h3>
                <p>PrivatecharterX LLC<br />1000 Brickell ave., 715 ste.<br />33131 Miami, Florida, United States of America</p>
              </div>
            </section>
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Disclaimer</h2>
              <div className="space-y-4">
                <h3 className="font-medium">Liability for Contents</h3>
                <p className="text-gray-600">
                  The contents of our pages were created with great care. However, we cannot guarantee the correctness,
                  completeness, and up-to-dateness of the contents. As a service provider, we are responsible for our own content on these pages under general law...
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">Liability for Links</h3>
                <p className="text-gray-600">
                  Our offer contains links to external websites of third parties, over whose contents we have no influence.
                  Therefore, we cannot assume any liability for these external contents...
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
