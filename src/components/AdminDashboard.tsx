import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, FileText, Calendar, Package, Plane, Gift, Wallet, Search, Sparkles } from "lucide-react";

// Supabase client
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const navItems = [
  { id: "users", label: "Users", icon: Users },
  { id: "user_requests", label: "Requests", icon: FileText },
  { id: "tokenizations", label: "Tokenizations", icon: Sparkles },
  { id: "booking_requests", label: "Bookings", icon: Calendar },
  { id: "booking_items", label: "Items", icon: Package },
  { id: "emptylegs", label: "Empty Legs", icon: Plane },
  { id: "fixed_offers", label: "Offers", icon: Gift },
  { id: "wallet", label: "Wallet", icon: Wallet }
];

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [tokenizations, setTokenizations] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [bookingItems, setBookingItems] = useState([]);
  const [emptylegs, setEmptylegs] = useState([]);
  const [fixedOffers, setFixedOffers] = useState([]);
  const [walletTransactions, setWalletTransactions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tables = [
        { key: "users", setter: setUsers },
        { key: "user_requests", setter: setUserRequests },
        { key: "tokenization_drafts", setter: setTokenizations },
        { key: "booking_requests", setter: setBookingRequests },
        { key: "booking_request_items", setter: setBookingItems },
        { key: "emptylegs", setter: setEmptylegs },
        { key: "fixed_offers", setter: setFixedOffers },
        { key: "wallet_transactions", setter: setWalletTransactions },
      ];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table.key)
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) {
          console.error(`Error fetching ${table.key}:`, error);
        } else if (data) {
          table.setter(data);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filter = (arr, fields) => {
    const term = searchTerm.toLowerCase();
    return arr.filter((item) => fields.some((field) => item[field]?.toString().toLowerCase().includes(term)));
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'completed':
      case 'confirmed':
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-red-100 text-red-800`;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filter(users, ["email", "name", "user_role"]).map((user) => (
              <div key={user.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">{user.name?.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  {user.is_admin && <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Admin</span>}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Role</span>
                    <span className="capitalize">{user.user_role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Referrals</span>
                    <span>{user.referral_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Earnings</span>
                    <span className="font-medium text-green-600">{user.referral_earnings}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case "user_requests":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filter(userRequests, ["type", "status", "client_name", "client_email"]).map((req) => (
              <div key={req.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{req.client_name}</h3>
                  <span className={getStatusBadge(req.status)}>{req.status}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span>{req.client_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="capitalize">{req.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span>{req.created_at}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case "booking_requests":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filter(bookingRequests, ["name", "email", "from", "to", "status"]).map((req) => (
              <div key={req.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{req.name}</h3>
                  <span className={getStatusBadge(req.status)}>{req.status}</span>
                </div>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="font-medium text-gray-900">{req.from}</span>
                  <Plane className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{req.to}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Passengers</span>
                    <span>{req.no_passengers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span>{req.created_at}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case "booking_items":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filter(bookingItems, ["title", "type", "location", "currency"]).map((item) => (
              <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">{item.title}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="capitalize">{item.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location</span>
                    <span>{item.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price</span>
                    <span className="font-semibold text-green-600">{item.price} {item.currency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case "emptylegs":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filter(emptylegs, ["from", "to", "aircraft_type", "currency"]).map((item) => (
              <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="font-medium text-gray-900">{item.from}</span>
                  <Plane className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{item.to}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Aircraft</span>
                    <span>{item.aircraft_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price</span>
                    <span className="font-semibold text-green-600">{item.price} {item.currency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case "fixed_offers":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filter(fixedOffers, ["title", "origin", "destination", "currency"]).map((item) => (
              <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">{item.title}</h3>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-sm text-gray-900">{item.origin}</span>
                  <Plane className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{item.destination}</span>
                </div>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price</span>
                    <span className="font-semibold text-green-600">{item.price} {item.currency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case "wallet":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filter(walletTransactions, ["wallet_address", "transaction_type", "status"]).map((tx) => (
              <div key={tx.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 capitalize">{tx.transaction_type}</h3>
                  <span className={getStatusBadge(tx.status)}>{tx.status}</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500 block mb-1">Wallet</span>
                    <p className="font-mono text-xs bg-white p-2 rounded border">{tx.wallet_address.slice(0, 20)}...{tx.wallet_address.slice(-10)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">TX Hash</span>
                    <p className="font-mono text-xs bg-white p-2 rounded border text-blue-600">{tx.blockchain_tx_hash?.slice(0, 20)}...</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return <div>Select a section</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Admin Dashboard</CardTitle>
                <p className="text-gray-500 text-sm mt-1">PrivateCharterX Management</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 border-gray-200"
                />
              </div>
            </div>
          </CardHeader>
          
          <div className="p-6">
            {/* Simple Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <span className="ml-2 text-gray-600">Loading data...</span>
                </div>
              ) : (
                renderContent()
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}