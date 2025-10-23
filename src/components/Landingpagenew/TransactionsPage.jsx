import React from 'react';
import LaunchpadTransactions from './LaunchpadTransactions';
import PageHeader from './PageHeader';

export default function TransactionsPage() {
  return (
    <div className="w-full h-full bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <PageHeader
          title="Launchpad Transactions"
          subtitle="All your signed waitlist transactions"
        />

        {/* Content */}
        <LaunchpadTransactions showHeader={false} />
      </div>
    </div>
  );
}
