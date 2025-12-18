import React, { useState, useEffect } from 'react';
import { Settings, Save, X, Edit2, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface DashboardMetric {
  id: string;
  title: string;
  value: number;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
  editable: boolean;
}

interface AdminDashboardSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated: () => void;
}

export const AdminDashboardSettings: React.FC<AdminDashboardSettingsProps> = ({
  isOpen,
  onClose,
  onSettingsUpdated
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [metrics, setMetrics] = useState<DashboardMetric[]>([
    {
      id: 'total_clients',
      title: 'Total Clients',
      value: 0,
      change: '+12% from last month',
      changeType: 'positive',
      icon: 'users',
      editable: true
    },
    {
      id: 'active_bookings',
      title: 'Active Bookings',
      value: 0,
      change: '+8% from last month',
      changeType: 'positive',
      icon: 'calendar',
      editable: true
    },
    {
      id: 'monthly_revenue',
      title: 'Monthly Revenue',
      value: 0,
      change: '+15% from last month',
      changeType: 'positive',
      icon: 'dollar-sign',
      editable: true
    },
    {
      id: 'pending_requests',
      title: 'Pending Requests',
      value: 0,
      change: '-5% from last month',
      changeType: 'negative',
      icon: 'trending-up',
      editable: true
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrentSettings();
    }
  }, [isOpen]);

  const loadCurrentSettings = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('settings')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.settings?.dashboard) {
        const dashboardSettings = data.settings.dashboard;
        setMetrics(prev => prev.map(metric => ({
          ...metric,
          value: dashboardSettings[metric.id] || metric.value
        })));
      }
    } catch (err: any) {
      console.error('Error loading dashboard settings:', err);
    }
  };

  const updateMetricValue = (metricId: string, value: number) => {
    setMetrics(prev => prev.map(metric => 
      metric.id === metricId ? { ...metric, value } : metric
    ));
  };

  const saveSettings = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Get existing settings
      const { data: existingSettings } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const dashboardSettings = metrics.reduce((acc, metric) => {
        acc[metric.id] = metric.value;
        return acc;
      }, {} as Record<string, number>);

      const settingsData = {
        ...existingSettings?.settings,
        dashboard: dashboardSettings
      };

      if (existingSettings) {
        await supabase
          .from('admin_settings')
          .update({ 
            settings: settingsData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('admin_settings')
          .insert([{
            user_id: user.id,
            settings: settingsData
          }]);
      }

      showSuccess('Success', 'Dashboard settings updated successfully');
      onSettingsUpdated();
      onClose();
    } catch (err: any) {
      showError('Error', 'Failed to save dashboard settings');
      console.error('Error saving dashboard settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'users': return <Users className="w-5 h-5" />;
      case 'calendar': return <Calendar className="w-5 h-5" />;
      case 'dollar-sign': return <DollarSign className="w-5 h-5" />;
      case 'trending-up': return <TrendingUp className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">Dashboard Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-black mb-2">Dashboard Metrics</h3>
            <p className="text-gray-600 text-sm">
              Customize the values displayed on your dashboard. These settings will override automatic calculations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metrics.map((metric) => (
              <div key={metric.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      {getIcon(metric.icon)}
                    </div>
                    <h4 className="font-medium text-black">{metric.title}</h4>
                  </div>
                  <Edit2 className="w-4 h-4 text-gray-400" />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value
                    </label>
                    <input
                      type="number"
                      value={metric.value}
                      onChange={(e) => updateMetricValue(metric.id, parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Change Description
                    </label>
                    <input
                      type="text"
                      value={metric.change}
                      onChange={(e) => {
                        setMetrics(prev => prev.map(m => 
                          m.id === metric.id ? { ...m, change: e.target.value } : m
                        ));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="e.g., +12% from last month"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Change Type
                    </label>
                    <select
                      value={metric.changeType}
                      onChange={(e) => {
                        setMetrics(prev => prev.map(m => 
                          m.id === metric.id ? { ...m, changeType: e.target.value as 'positive' | 'negative' } : m
                        ));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="positive">Positive (Green)</option>
                      <option value="negative">Negative (Red)</option>
                    </select>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Preview:</p>
                  <p className="text-xl font-bold text-black">{metric.value.toLocaleString()}</p>
                  <p className={`text-xs ${
                    metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Note</h4>
            <p className="text-sm text-blue-800">
              These custom values will be displayed on your dashboard instead of automatically calculated metrics. 
              You can update these values anytime to reflect your current business status.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveSettings}
            disabled={isLoading}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};