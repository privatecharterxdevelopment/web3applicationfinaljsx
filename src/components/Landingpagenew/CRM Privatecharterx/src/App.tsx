import React, { useState, useRef, lazy, Suspense, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { MessageSquare, X, Send } from 'lucide-react';

// Lazy load components to improve initial load time
const ClientsManagement = lazy(() => import('./components/Clients/ClientsManagement').then(module => ({ default: module.ClientsManagement })));
const PartnersManagement = lazy(() => import('./components/Partners/PartnersManagement').then(module => ({ default: module.PartnersManagement })));
const PartnerMap = lazy(() => import('./components/Partners/PartnerMap').then(module => ({ default: module.PartnerMap })));
const BookingsManagement = lazy(() => import('./components/Bookings/BookingsManagement').then(module => ({ default: module.BookingsManagement })));
const OrdersManagement = lazy(() => import('./components/Orders/OrdersManagement').then(module => ({ default: module.OrdersManagement })));
const TeamChat = lazy(() => import('./components/Chat/TeamChat').then(module => ({ default: module.TeamChat })));
const ReportsSystem = lazy(() => import('./components/Reports/ReportsSystem').then(module => ({ default: module.ReportsSystem })));
const JetsService = lazy(() => import('./components/Services/JetsService').then(module => ({ default: module.JetsService })));
const YachtsService = lazy(() => import('./components/Services/YachtsService').then(module => ({ default: module.YachtsService })));
const HelicoptersService = lazy(() => import('./components/Services/HelicoptersService').then(module => ({ default: module.HelicoptersService })));
const LuxuryCarsService = lazy(() => import('./components/Services/LuxuryCarsService').then(module => ({ default: module.LuxuryCarsService })));
const EmptyLegsService = lazy(() => import('./components/Services/EmptyLegsService').then(module => ({ default: module.EmptyLegsService })));
const FixedOffersService = lazy(() => import('./components/Services/FixedOffersService').then(module => ({ default: module.FixedOffersService })));
const MultiBookingService = lazy(() => import('./components/Services/MultiBookingService').then(module => ({ default: module.MultiBookingService })));
const UserManagement = lazy(() => import('./components/Admin/UserManagement').then(module => ({ default: module.UserManagement })));
const EmployeeManagement = lazy(() => import('./components/Admin/EmployeeManagement').then(module => ({ default: module.EmployeeManagement })));
const SalesCRM = lazy(() => import('./components/Sales/SalesCRM').then(module => ({ default: module.SalesCRM })));
const CalendarSystem = lazy(() => import('./components/Calendar/CalendarSystem').then(module => ({ default: module.CalendarSystem })));
const ActivityMonitoringDashboard = lazy(() => import('./components/Admin/ActivityMonitoringDashboard').then(module => ({ default: module.ActivityMonitoringDashboard })));
const NewsletterSystem = lazy(() => import('./components/Marketing/NewsletterSystem').then(module => ({ default: module.NewsletterSystem })));
const StorageSystem = lazy(() => import('./components/Storage/StorageSystem').then(module => ({ default: module.StorageSystem })));
const SupportSystem = lazy(() => import('./components/Support/SupportSystem').then(module => ({ default: module.SupportSystem })));
const AccountingSystem = lazy(() => import('./components/Accounting/AccountingSystem').then(module => ({ default: module.AccountingSystem })));

const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiConversation, setAiConversation] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Memoize the handleSendMessage function to prevent unnecessary re-renders
  const handleSendMessage = useCallback(() => {
    if (!aiMessage.trim()) return;
    
    // Add user message to conversation
    const userMessage = aiMessage.trim();
    setAiConversation(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiMessage('');
    setIsAiTyping(true);
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponses = [
        "I can help with that! Let me check our system for the information you need.",
        "Great question. Based on our company policies, here's what I can tell you.",
        "I understand your query. Let me provide you with the relevant details from our knowledge base.",
        "I've found some information that might help. According to our records...",
        "That's a common question. Here's what our documentation says about it."
      ];
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      setAiConversation(prev => [...prev, { role: 'assistant', content: randomResponse }]);
      setIsAiTyping(false);
    }, 1500);
  }, [aiMessage]);

  // Memoize the renderContent function to prevent unnecessary re-renders
  const renderContent = useCallback(() => {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading content...</p>
          </div>
        </div>
      }>
        {(() => {
          switch (activeSection) {
            case 'dashboard':
              return <Dashboard />;
            case 'clients':
              return <ClientsManagement />;
            case 'partners':
              return <PartnersManagement />;
            case 'partner-map':
              return <PartnerMap standalone={true} />;
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
            case 'accounting':
              return <AccountingSystem />;
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
            case 'fixedoffers':
              return <FixedOffersService />;
            case 'multibooking':
              return <MultiBookingService />;
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
        })()}
      </Suspense>
    );
  }, [activeSection]);

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
          {renderContent()}
        </main>
      </div>

      {/* AI Assistant Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => {
            setShowAiChat(!showAiChat);
            if (!showAiChat) {
              setTimeout(() => messageInputRef.current?.focus(), 100);
            }
          }}
          className="bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-colors gpu-accelerated"
          aria-label="AI Assistant"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>

      {/* AI Chat Interface */}
      {showAiChat && (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50 gpu-accelerated">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-black">AI Assistant</h3>
            <button
              onClick={() => setShowAiChat(false)}
              className="text-gray-400 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto optimize-scroll">
            {aiConversation.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                <h4 className="text-lg font-medium text-gray-700 mb-2">How can I help you?</h4>
                <p className="text-gray-500 text-sm max-w-xs">
                  Ask me anything about our services, bookings, clients, or system features.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {aiConversation.map((message, index) => (
                  <div 
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-black text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                ref={messageInputRef}
                type="text"
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your question..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!aiMessage.trim() || isAiTyping}
                className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This is a demo AI assistant. In a real implementation, it would connect to a knowledge base.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;