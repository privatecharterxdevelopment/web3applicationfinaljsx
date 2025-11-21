const features = [
  {
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80',
    title: 'Gnosis Safe Escrow',
    description: 'All funds locked in battle-tested multisig wallets. Automatic unlock at 100% goal or full refunds.',
  },
  {
    image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&q=80',
    title: 'USDC Payments',
    description: 'Stable, predictable fundraising with USDC on Base Chain. Low fees, fast transactions.',
  },
  {
    image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&q=80',
    title: 'All-or-Nothing',
    description: 'Campaigns only succeed at 100% funding goal. Builds confidence for backers and creators.',
  },
  {
    image: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800&q=80',
    title: '100% On-Chain',
    description: 'Fully decentralized with smart contracts. No intermediaries, no custody, full transparency.',
  },
  {
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    title: 'Creator Dashboard',
    description: 'Track your campaigns, view analytics, post updates, and engage with your community.',
  },
  {
    image: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=800&q=80',
    title: 'Instant Launch',
    description: 'Pay 299 USDC fee and go live immediately. No approvals, no waiting, fully permissionless.',
  },
];

export default function Features() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl text-gray-900 mb-3">
            Built for <span className="font-medium">Web3</span>
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Everything you need to launch and fund decentralized projects with confidence.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-100 hover:shadow-sm transition-all duration-300 overflow-hidden group"
            >
              {/* Header Image */}
              <div className="h-48 overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-medium text-black mb-2 group-hover:text-gray-700 transition-colors">
                  {feature.title}
                </h3>

                <p className="text-sm text-gray-600 font-light leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mt-12">
          <button className="bg-black text-white px-8 py-4 rounded-xl hover:bg-gray-800 transition-colors font-medium text-base">
            Launch Campaign or Contribute Now
          </button>
        </div>

        {/* How It Works */}
        <div className="mt-20">
          <h3 className="text-3xl text-gray-900 text-center mb-12">
            How It <span className="font-medium">Works</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                1
              </div>
              <h4 className="text-base font-medium text-gray-900 mb-2">Create Campaign</h4>
              <p className="text-sm text-gray-600">
                Fill out form, upload images, set funding goal & duration.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                2
              </div>
              <h4 className="text-base font-medium text-gray-900 mb-2">Pay 299 USDC</h4>
              <p className="text-sm text-gray-600">
                One-time launch fee. Campaign goes live instantly on Launchpad.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                3
              </div>
              <h4 className="text-base font-medium text-gray-900 mb-2">Backers Fund</h4>
              <p className="text-sm text-gray-600">
                Contributors send USDC. Funds locked in Gnosis Safe escrow.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                4
              </div>
              <h4 className="text-base font-medium text-gray-900 mb-2">Unlock or Refund</h4>
              <p className="text-sm text-gray-600">
                100% goal: funds unlock. Under 100%: automatic refunds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
