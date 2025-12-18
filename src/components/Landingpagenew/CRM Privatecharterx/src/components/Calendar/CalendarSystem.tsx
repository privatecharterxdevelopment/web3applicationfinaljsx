import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  Clock, 
  MapPin, 
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  User,
  Building2,
  Bell,
  Info,
  Check,
  AlertTriangle,
  Tag,
  Circle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  event_type: 'meeting' | 'call' | 'appointment' | 'reminder' | 'other';
  created_by: string;
  attendees: string[];
  client_id: string | null;
  is_all_day: boolean;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  client_name?: string;
  color?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string | null;
}

interface Client {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

export const CalendarSystem: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'meeting' | 'call' | 'appointment' | 'reminder' | 'other'>('all');
  const [invitationSent, setInvitationSent] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [newEventData, setNewEventData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    location: '',
    event_type: 'meeting' as 'meeting' | 'call' | 'appointment' | 'reminder' | 'other',
    attendees: [] as string[],
    client_id: '',
    is_all_day: false,
    color: ''
  });

  const colorOptions = [
    { name: 'Default', value: '' },
    { name: 'Red', value: 'bg-red-100 text-red-800 border-red-200' },
    { name: 'Blue', value: 'bg-blue-100 text-blue-800 border-blue-200' },
    { name: 'Green', value: 'bg-green-100 text-green-800 border-green-200' },
    { name: 'Yellow', value: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { name: 'Purple', value: 'bg-purple-100 text-purple-800 border-purple-200' },
    { name: 'Pink', value: 'bg-pink-100 text-pink-800 border-pink-200' },
    { name: 'Indigo', value: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { name: 'Teal', value: 'bg-teal-100 text-teal-800 border-teal-200' },
    { name: 'Orange', value: 'bg-orange-100 text-orange-800 border-orange-200' },
    { name: 'Gray', value: 'bg-gray-100 text-gray-800 border-gray-200' }
  ];

  useEffect(() => {
    fetchEvents();
    fetchEmployees();
    fetchClients();
    
    // Set up real-time subscription for calendar events
    const subscription = supabase
      .channel('calendar-events-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'calendar_events' 
        }, 
        (payload) => {
          if (payload.eventType === 'DELETE') {
            // Remove the deleted event from the state
            setEvents(prev => prev.filter(event => event.id !== payload.old.id));
          } else if (payload.eventType === 'INSERT') {
            // Fetch the new event with all related data
            fetchSingleEvent(payload.new.id);
          } else if (payload.eventType === 'UPDATE') {
            // Update the event in the state
            fetchSingleEvent(payload.new.id);
          }
        }
      )
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          system_users!created_by (name),
          clients (name, company)
        `)
        .gte('start_date', startOfMonth.toISOString().split('T')[0])
        .lte('start_date', endOfMonth.toISOString().split('T')[0])
        .order('start_date', { ascending: true });

      if (error) throw error;

      const formattedEvents = data?.map(event => ({
        ...event,
        creator_name: event.system_users?.name || 'Unknown',
        client_name: event.clients?.name || null,
        attendees: event.attendees || []
      })) || [];

      setEvents(formattedEvents);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      showError('Error', 'Failed to fetch calendar events');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSingleEvent = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          system_users!created_by (name),
          clients (name, company)
        `)
        .eq('id', eventId)
        .single();

      if (error) throw error;

      if (data) {
        const formattedEvent = {
          ...data,
          creator_name: data.system_users?.name || 'Unknown',
          client_name: data.clients?.name || null,
          attendees: data.attendees || []
        };

        // Update the events array by replacing the event if it exists, or adding it if it's new
        setEvents(prev => {
          const eventIndex = prev.findIndex(e => e.id === eventId);
          if (eventIndex >= 0) {
            const newEvents = [...prev];
            newEvents[eventIndex] = formattedEvent;
            return newEvents;
          } else {
            return [...prev, formattedEvent];
          }
        });
      }
    } catch (err: any) {
      console.error('Error fetching single event:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('system_users')
        .select('id, name, email, department')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, company')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
    }
  };

  const createEvent = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      const { data: newEvent, error } = await supabase
        .from('calendar_events')
        .insert([{
          title: newEventData.title,
          description: newEventData.description || null,
          start_date: newEventData.start_date,
          end_date: newEventData.end_date || newEventData.start_date,
          start_time: newEventData.is_all_day ? null : newEventData.start_time,
          end_time: newEventData.is_all_day ? null : newEventData.end_time,
          location: newEventData.location || null,
          event_type: newEventData.event_type,
          created_by: systemUser.id,
          attendees: newEventData.attendees,
          client_id: newEventData.client_id || null,
          is_all_day: newEventData.is_all_day,
          color: newEventData.color || null
        }])
        .select()
        .single();

      if (error) throw error;

      if (newEventData.attendees.length > 0) {
        setInvitationSent(true);
        setTimeout(() => setInvitationSent(false), 3000);
      }

      showSuccess('Event Created!', `"${newEventData.title}" has been scheduled successfully`);
      setShowAddModal(false);
      resetForm();
      fetchEvents();
    } catch (err: any) {
      showError('Error', err.message || 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', selectedEvent.id);

      if (error) throw error;

      // Remove the event from the state immediately
      setEvents(prev => prev.filter(event => event.id !== selectedEvent.id));
      
      showSuccess('Event Deleted', 'The event has been removed from the calendar');
      setShowDeleteConfirm(false);
      setSelectedEvent(null);
    } catch (err: any) {
      showError('Error', 'Failed to delete event');
      console.error('Error deleting event:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setNewEventData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      location: '',
      event_type: 'meeting',
      attendees: [],
      client_id: '',
      is_all_day: false,
      color: ''
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.start_date === dateStr);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || event.event_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getEventTypeColor = (type: string, customColor?: string) => {
    if (customColor) return customColor;
    
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'call': return 'bg-green-100 text-green-800 border-green-200';
      case 'appointment': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'reminder': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Calendar</h1>
            <p className="text-gray-600">Manage your schedule and team events</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>

        {/* Calendar Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="p-2 text-gray-400 hover:text-black transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-black min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="p-2 text-gray-400 hover:text-black transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent text-sm"
              >
                <option value="all">All Types</option>
                <option value="meeting">Meetings</option>
                <option value="call">Calls</option>
                <option value="appointment">Appointments</option>
                <option value="reminder">Reminders</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 bg-gray-50">
              {dayNames.map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Body */}
            <div className="grid grid-cols-7">
              {getDaysInMonth(currentDate).map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isToday = date && date.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-r border-b border-gray-200 last:border-r-0 ${
                      date ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                    } ${isToday ? 'bg-blue-50' : ''}`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${
                          isToday ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className={`text-xs p-1 rounded cursor-pointer truncate ${event.color || getEventTypeColor(event.event_type)}`}
                            >
                              <div className="flex items-center space-x-1">
                                {event.client_id && <Building2 className="w-3 h-3" />}
                                <span>{event.title}</span>
                              </div>
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-black">Upcoming Events</h3>
            </div>
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {filteredEvents.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${event.color || getEventTypeColor(event.event_type)}`}>
                      {event.event_type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.start_date).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-medium text-black text-sm mb-1">{event.title}</h4>
                  {event.client_name && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
                      <Building2 className="w-3 h-3" />
                      <span>Client: {event.client_name}</span>
                    </div>
                  )}
                  {!event.is_all_day && event.start_time && event.end_time && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{event.start_time} - {event.end_time}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                      <Users className="w-3 h-3" />
                      <span>{event.attendees.length} attendees</span>
                    </div>
                  )}
                </div>
              ))}
              {filteredEvents.length === 0 && (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No events found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Add New Event</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {invitationSent && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center mb-4">
                  <Check className="w-5 h-5 mr-2" />
                  <span>Invitations will be sent to attendees when you create this event</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={newEventData.title}
                    onChange={(e) => setNewEventData({ ...newEventData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type *
                  </label>
                  <select
                    value={newEventData.event_type}
                    onChange={(e) => setNewEventData({ ...newEventData, event_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="call">Call</option>
                    <option value="appointment">Appointment</option>
                    <option value="reminder">Reminder</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newEventData.description}
                  onChange={(e) => setNewEventData({ ...newEventData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newEventData.start_date}
                    onChange={(e) => setNewEventData({ ...newEventData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newEventData.end_date}
                    onChange={(e) => setNewEventData({ ...newEventData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newEventData.is_all_day}
                    onChange={(e) => setNewEventData({ ...newEventData, is_all_day: e.target.checked })}
                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                  />
                  <span className="ml-2 text-sm text-gray-700">All day event</span>
                </label>
              </div>

              {!newEventData.is_all_day && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={newEventData.start_time}
                      onChange={(e) => setNewEventData({ ...newEventData, start_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required={!newEventData.is_all_day}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={newEventData.end_time}
                      onChange={(e) => setNewEventData({ ...newEventData, end_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required={!newEventData.is_all_day}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={newEventData.location}
                  onChange={(e) => setNewEventData({ ...newEventData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Meeting room, address, or online"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Event Color
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewEventData({ ...newEventData, color: color.value })}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                        newEventData.color === color.value ? 'ring-2 ring-black' : 'border-gray-200'
                      } ${color.value || 'bg-white'}`}
                    >
                      {color.value ? (
                        <Circle className="w-4 h-4" fill="currentColor" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                      <span>{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Client (Optional)
                </label>
                <select
                  value={newEventData.client_id}
                  onChange={(e) => setNewEventData({ ...newEventData, client_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">No client associated</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.company && `(${client.company})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Users className="w-4 h-4 inline mr-1" />
                  Invite Employees
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center text-sm text-blue-700">
                    <Info className="w-4 h-4 mr-2" />
                    <p>Invitees will receive a notification when the event is created</p>
                  </div>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {employees.map((employee) => (
                    <label key={employee.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newEventData.attendees.includes(employee.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewEventData({
                              ...newEventData,
                              attendees: [...newEventData.attendees, employee.id]
                            });
                          } else {
                            setNewEventData({
                              ...newEventData,
                              attendees: newEventData.attendees.filter(id => id !== employee.id)
                            });
                          }
                        }}
                        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                      />
                      <div className="ml-2 flex-1">
                        <span className="text-sm text-gray-700">{employee.name}</span>
                        <div className="text-xs text-gray-500">
                          {employee.email} {employee.department && `• ${employee.department}`}
                        </div>
                      </div>
                      <Bell className="w-4 h-4 text-gray-400" />
                    </label>
                  ))}
                </div>
                {newEventData.attendees.length > 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    {newEventData.attendees.length} employee(s) will receive notifications
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createEvent}
                disabled={!newEventData.title || !newEventData.start_date || isLoading}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && !showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Event Details</h2>
              <div className="flex items-center space-x-2">
                {(user?.role === 'admin' || selectedEvent.created_by === user?.id) && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 text-gray-400 hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-black">{selectedEvent.title}</h3>
                <span className={`inline-block text-xs px-2 py-1 rounded-full mt-2 ${selectedEvent.color || getEventTypeColor(selectedEvent.event_type)}`}>
                  {selectedEvent.event_type}
                </span>
              </div>

              {selectedEvent.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.client_name && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Client</p>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-700">{selectedEvent.client_name}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Start Date</p>
                  <p className="text-gray-700">{new Date(selectedEvent.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">End Date</p>
                  <p className="text-gray-700">{new Date(selectedEvent.end_date).toLocaleDateString()}</p>
                </div>
              </div>

              {!selectedEvent.is_all_day && selectedEvent.start_time && selectedEvent.end_time && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Start Time</p>
                    <p className="text-gray-700">{selectedEvent.start_time}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">End Time</p>
                    <p className="text-gray-700">{selectedEvent.end_time}</p>
                  </div>
                </div>
              )}

              {selectedEvent.location && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="text-gray-700">{selectedEvent.location}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 mb-1">Created by</p>
                <p className="text-gray-700">{selectedEvent.creator_name}</p>
              </div>

              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Attendees ({selectedEvent.attendees.length})</p>
                  <div className="space-y-1">
                    {selectedEvent.attendees.map((attendeeId) => {
                      const attendee = employees.find(e => e.id === attendeeId);
                      return attendee ? (
                        <div key={attendeeId} className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{attendee.name}</span>
                          <span className="text-xs text-gray-500">({attendee.email})</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Delete Event</h2>
            </div>
            
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-red-700 font-medium">Are you sure you want to delete this event?</p>
                    <p className="text-red-600 mt-1 text-sm">This action cannot be undone.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-black">{selectedEvent.title}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(selectedEvent.start_date).toLocaleDateString()}
                  {selectedEvent.start_time && ` at ${selectedEvent.start_time}`}
                </p>
                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedEvent.attendees.length} attendees will be notified of the cancellation
                  </p>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteEvent}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Event</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};