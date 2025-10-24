import React from 'react';

interface ServicesProps {
  setCurrentPage: (page: string) => void;
}

function Services({ setCurrentPage }: ServicesProps) {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <button
        onClick={() => setCurrentPage('home')}
        className="mb-4 text-blue-600 hover:text-blue-800"
      >
        ← Back to Home
      </button>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Services</h1>
      <p className="text-gray-600">Services page content will go here.</p>
    </div>
  );
}

export default Services;