import React, { useState } from 'react';
import { useAuth } from '../../contexts/CRM/AuthContext';
import { Login } from './Login';
import { Sidebar } from './Layout/Sidebar';
import { Header } from './Layout/Header';
import { Dashboard } from './Dashboard/Dashboard';

const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          {/* Dashboard handles all tabs internally */}
          <Dashboard activeTab={activeSection} setActiveTab={setActiveSection} />
        </main>
      </div>
    </div>
  );
};

export default App;
