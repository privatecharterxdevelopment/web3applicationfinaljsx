import React from 'react';
import { format } from 'date-fns';
import {
  Plane,
  Anchor,
  Mountain,
  Car,
  Calendar,
  Building2,
  Coins,
  Leaf,
  Users,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';

/**
 * RecentActivity Component
 *
 * Displays a list of recent user activities (bookings, requests, transactions)
 *
 * Props:
 * - activities: Array of activity objects
 * - loading: Loading state
 * - onViewAll: Handler for "View All" button
 */
const RecentActivity = ({ activities = [], loading = false, onViewAll }) => {
  // Map activity types to icons
  const getIcon = (type) => {
    const iconMap = {
      private_jet_charter: Plane,
      helicopter_charter: Plane,
      empty_leg: Plane,
      adventure_package: Mountain,
      luxury_car_rental: Car,
      yacht_charter: Anchor,
      event_booking: Calendar,
      spv_formation: Building2,
      tokenization: Coins,
      co2_certificate: Leaf,
      dao_participation: Users
    };
    return iconMap[type] || Calendar;
  };

  // Map activity types to readable labels
  const getLabel = (type) => {
    const labelMap = {
      private_jet_charter: 'Private Jet Charter',
      helicopter_charter: 'Helicopter Charter',
      empty_leg: 'Empty Leg Flight',
      adventure_package: 'Adventure Package',
      luxury_car_rental: 'Luxury Car Rental',
      yacht_charter: 'Yacht Charter',
      event_booking: 'Event Booking',
      spv_formation: 'SPV Formation',
      tokenization: 'Asset Tokenization',
      co2_certificate: 'CO2 Certificate',
      dao_participation: 'DAO Participation'
    };
    return labelMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Map status to badge styling
  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { icon: Clock, color: 'bg-amber-100 text-amber-700', label: 'Pending' },
      approved: { icon: CheckCircle2, color: 'bg-green-100 text-green-700', label: 'Approved' },
      completed: { icon: CheckCircle2, color: 'bg-blue-100 text-blue-700', label: 'Completed' },
      confirmed: { icon: CheckCircle2, color: 'bg-green-100 text-green-700', label: 'Confirmed' },
      cancelled: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Cancelled' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Rejected' },
      manual_review: { icon: AlertCircle, color: 'bg-purple-100 text-purple-700', label: 'Review' }
    };
    return statusMap[status] || { icon: Clock, color: 'bg-gray-100 text-gray-700', label: status };
  };

  if (loading) {
    return (
      <div className="bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-2xl p-6">
        <div className="h-6 w-48 bg-gray-300 rounded mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-gray-200/50 rounded-xl animate-pulse">
              <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-300 rounded"></div>
                <div className="h-3 w-48 bg-gray-300 rounded"></div>
              </div>
              <div className="h-5 w-16 bg-gray-300 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-2xl p-8 text-center">
        <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
        <p className="text-sm text-gray-600 mb-2">No recent activity</p>
        <p className="text-xs text-gray-500">
          Your bookings and requests will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
          >
            View All
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Activity List */}
      <div className="space-y-2">
        {activities.map((activity, index) => {
          const Icon = getIcon(activity.type);
          const statusBadge = getStatusBadge(activity.status);
          const StatusIcon = statusBadge.icon;

          return (
            <div
              key={activity.id || index}
              className="flex items-center gap-4 p-4 bg-white/40 hover:bg-white/60
                rounded-xl border border-gray-200/50 transition-all duration-200
                hover:shadow-md group cursor-pointer"
            >
              {/* Icon */}
              <div className="p-2.5 bg-gray-900/5 rounded-lg group-hover:bg-gray-900/10 transition-colors">
                <Icon size={20} className="text-gray-900" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-0.5">
                  {getLabel(activity.type)}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {activity.description || `${getLabel(activity.type)} request`}
                  {activity.data?.origin && activity.data?.destination && (
                    <> • {activity.data.origin} → {activity.data.destination}</>
                  )}
                  {activity.data?.asset_name && (
                    <> • {activity.data.asset_name}</>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(activity.created_at), 'MMM dd, yyyy • h:mm a')}
                </p>
              </div>

              {/* Status Badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                <StatusIcon size={14} />
                <span>{statusBadge.label}</span>
              </div>

              {/* Amount (if available) */}
              {activity.data?.total_price && (
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    €{Number(activity.data.total_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              {/* Arrow */}
              <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;
