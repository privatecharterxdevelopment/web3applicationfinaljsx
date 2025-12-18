import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ClientsManagement } from './components/Clients/ClientsManagement';
import { BookingsManagement } from './components/Bookings/BookingsManagement';
import { OrdersManagement } from './components/Orders/OrdersManagement';
import { TeamChat } from './components/Chat/TeamChat';
import { ReportsSystem } from './components/Reports/ReportsSystem';
import { JetsService } from './components/Services/JetsService';
import { YachtsService } from './components/Services/YachtsService';
import { HelicoptersService } from './components/Services/HelicoptersService';
import { LuxuryCarsService } from './components/Services/LuxuryCarsService';
import { EmptyLegsService } from './components/Services/EmptyLegsService';
import { UserManagement } from './components/Admin/UserManagement';
import { EmployeeManagement } from './components/Admin/EmployeeManagement';
import { SalesCRM } from './components/Sales/SalesCRM';
import { CalendarSystem } from './components/Calendar/CalendarSystem';
import { ActivityMonitoringDashboard } from './components/Admin/ActivityMonitoringDashboard';
import { NewsletterSystem } from './components/Marketing/NewsletterSystem';
import { StorageSystem } from './components/Storage/StorageSystem';
import { SupportSystem } from './components/Support/SupportSystem';

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

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <ClientsManagement />;
      case 'bookings':
        return <BookingsManagement />;
      case 'orders':
        return <OrdersManagement />;
      case 'support':
        return <SupportSystem />;
      case 'sales-crm':
        return <SalesCRM />;
      case 'newsletter':
        return <NewsletterSystem />;
      case 'calendar':
        return <CalendarSystem />;
      case 'chat':
        return <TeamChat />;
      case 'reports':
        return <ReportsSystem />;
      case 'jets':
        return <JetsService />;
      case 'yachts':
        return <YachtsService />;
      case 'helicopters':
        return <HelicoptersService />;
      case 'cars':
        return <LuxuryCarsService />;
      case 'emptylegs':
        return <EmptyLegsService />;
      case 'users':
        return <UserManagement />;
      case 'employees':
        return <EmployeeManagement />;
      case 'activity':
        return <ActivityMonitoringDashboard />;
      case 'storage':
        return <StorageSystem />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;