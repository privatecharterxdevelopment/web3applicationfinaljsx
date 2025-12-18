import React from 'react';
import { 
  Users, 
  Calendar, 
  Activity,
  User,
  Building2,
  CheckCircle,
  Clock,
  FileText,
  DollarSign,
  Mail,
  Video,
  RefreshCw
} from 'lucide-react';

interface UserActivity {
  id: string;
  action: string;
  details: any;
  created_at: string;
  system_users?: {
    name: string;
    email: string;
    role: string;
  };
}

interface RecentUserActivityProps {
  activities: UserActivity[];
}

export const RecentUserActivity: React.FC<RecentUserActivityProps> = ({ activities }) => {
  const formatActivityMessage = (activity: UserActivity) => {
    switch (activity.action) {
      case 'order_created':
        return `created a new order for ${activity.details?.service_name || 'service'}`;
      case 'client_added':
        return `added a new client: ${activity.details?.client_name || 'Unknown'}`;
      case 'deal_closed':
        return `closed a deal worth $${activity.details?.amount?.toLocaleString() || '0'}`;
      case 'company_added':
        return `added a new company: ${activity.details?.company_name || 'Unknown'}`;
      case 'partner_deal_status_change':
        return `updated ${activity.details?.company_name || 'a company'} to ${activity.details?.new_status || 'new status'}`;
      case 'client_status_change':
        return `updated ${activity.details?.client_name || 'a client'} to ${activity.details?.new_status || 'new status'}`;
      case 'booking_created':
        return `created a new booking for ${activity.details?.client_name || 'a client'}`;
      case 'status_change':
        return `changed status from ${activity.details?.old_status || 'unknown'} to ${activity.details?.new_status || 'unknown'}`;
      case 'password_reset':
        return `reset password for ${activity.details?.user_email || 'a user'}`;
      case 'user_login':
        return `logged in to the system`;
      case 'user_logout':
        return `logged out of the system`;
      case 'file_uploaded':
        return `uploaded a file: ${activity.details?.file_name || 'unknown file'}`;
      default:
        return activity.action.replace(/_/g, ' ');
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'client_added':
      case 'client_status_change':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'company_added':
      case 'partner_deal_status_change':
        return <Building2 className="w-4 h-4 text-purple-600" />;
      case 'deal_closed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'order_created':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'booking_created':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'status_change':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'user_login':
      case 'user_logout':
        return <User className="w-4 h-4 text-gray-600" />;
      case 'password_reset':
        return <FileText className="w-4 h-4 text-red-600" />;
      case 'file_uploaded':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'email_sent':
        return <Mail className="w-4 h-4 text-blue-600" />;
      case 'meeting_scheduled':
        return <Video className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600" />
          Recent User Activities
        </h2>
        <button 
          onClick={() => window.location.hash = "#activity"}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>
      
      <div className="p-6">
        {activities.length > 0 ? (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-black">
                        <span className="font-medium">{activity.system_users?.name || 'Unknown User'}</span>{' '}
                        {formatActivityMessage(activity)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.system_users?.role && (
                          <span className="capitalize">{activity.system_users.role}</span>
                        )}
                        {activity.system_users?.role && ' • '}
                        {getTimeAgo(activity.created_at)}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No recent activities</p>
          </div>
        )}
      </div>
    </div>
  );
};