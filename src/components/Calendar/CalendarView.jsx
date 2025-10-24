import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  Clock, MapPin, Users, X, Check, AlertCircle, ExternalLink,
  Settings, Download, Upload
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { GoogleCalendarService } from '../../services/googleCalendarService';
import CreateEventModal from './CreateEventModal';
import EventDetailsModal from './EventDetailsModal';

const CalendarView = ({ user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, year, 3years
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prefillEventData, setPrefillEventData] = useState(null);

  useEffect(() => {
    if (user) {
      fetchEvents();
      checkGoogleConnection();
      checkForPrefillData();
    }
  }, [user, currentDate, view]);

  const checkForPrefillData = () => {
    const eventDataStr = sessionStorage.getItem('calendarEventToAdd');
    if (eventDataStr) {
      try {
        const eventData = JSON.parse(eventDataStr);
        setPrefillEventData(eventData);
        setShowCreateModal(true);
        sessionStorage.removeItem('calendarEventToAdd');
      } catch (error) {
        console.error('Error parsing prefill data:', error);
      }
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          event_attendees(*)
        `)
        .eq('user_id', user.id)
        .gte('start_date', startDate.toISOString())
        .lte('end_date', endDate.toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkGoogleConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('google_calendar_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setGoogleConnected(true);
      }
    } catch (error) {
      setGoogleConnected(false);
    }
  };

  const getDateRange = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    switch (view) {
      case 'month':
        return {
          startDate: new Date(year, month, 1),
          endDate: new Date(year, month + 1, 0, 23, 59, 59)
        };
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return { startDate: weekStart, endDate: weekEnd };
      case 'year':
        return {
          startDate: new Date(year, 0, 1),
          endDate: new Date(year, 11, 31, 23, 59, 59)
        };
      case '3years':
        return {
          startDate: new Date(year, 0, 1),
          endDate: new Date(year + 2, 11, 31, 23, 59, 59)
        };
      default:
        return {
          startDate: new Date(year, month, 1),
          endDate: new Date(year, month + 1, 0)
        };
    }
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);

    switch (view) {
      case 'month':
        newDate.setMonth(currentDate.getMonth() + direction);
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction * 7));
        break;
      case 'year':
        newDate.setFullYear(currentDate.getFullYear() + direction);
        break;
      case '3years':
        newDate.setFullYear(currentDate.getFullYear() + (direction * 3));
        break;
    }

    setCurrentDate(newDate);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'completed':
        return 'bg-gray-400';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">✓ Confirmed</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">⏳ Pending</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">✕ Cancelled</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">✓ Completed</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">{status}</span>;
    }
  };

  const formatDateHeader = () => {
    const options = { month: 'long', year: 'numeric' };

    switch (view) {
      case 'month':
        return currentDate.toLocaleDateString('en-US', options);
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'year':
        return currentDate.getFullYear();
      case '3years':
        return `${currentDate.getFullYear()} - ${currentDate.getFullYear() + 2}`;
      default:
        return '';
    }
  };

  return (
    <div className="w-full h-full p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter font-['DM_Sans']">Calendar</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Google Calendar Button */}
          {!googleConnected ? (
            <button
              onClick={async () => {
                try {
                  const googleService = new GoogleCalendarService(user.id);
                  await googleService.connectGoogleCalendar();
                } catch (error) {
                  console.error('Error connecting Google Calendar:', error);
                  alert('Failed to connect Google Calendar. Please try again.');
                }
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <ExternalLink size={16} />
              Connect Google Calendar
            </button>
          ) : (
            <button
              className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700 flex items-center gap-2"
            >
              <Check size={16} />
              Google Calendar Connected
            </button>
          )}

          {/* Create Event Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            New Event
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="mb-4 flex items-center justify-between bg-white rounded-xl p-3 border border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate(-1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <h2 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
            {formatDateHeader()}
          </h2>

          <button
            onClick={() => navigateDate(1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={18} />
          </button>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="ml-3 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            Today
          </button>
        </div>

        {/* View Selector */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {['month', 'week', 'year', '3years'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                view === v
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {v === '3years' ? '3Y' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {view === 'month' && <MonthView events={events} currentDate={currentDate} onEventClick={setSelectedEvent} />}
        {view === 'week' && <WeekView events={events} currentDate={currentDate} onEventClick={setSelectedEvent} />}
        {view === 'year' && <YearView events={events} currentDate={currentDate} onEventClick={setSelectedEvent} />}
        {view === '3years' && <ThreeYearView events={events} currentDate={currentDate} onEventClick={setSelectedEvent} />}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEventUpdated={fetchEvents}
          onEventDeleted={fetchEvents}
          user={user}
          getStatusBadge={getStatusBadge}
        />
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => {
            setShowCreateModal(false);
            setPrefillEventData(null);
          }}
          onEventCreated={fetchEvents}
          user={user}
          prefillData={prefillEventData}
        />
      )}
    </div>
  );
};

// Month View Component
const MonthView = ({ events, currentDate, onEventClick }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dayDate = new Date(year, month, day);
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.getDate() === day &&
             eventDate.getMonth() === month &&
             eventDate.getFullYear() === year;
    });
  };

  return (
    <div className="p-3">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-semibold text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isToday = day &&
            new Date().getDate() === day &&
            new Date().getMonth() === month &&
            new Date().getFullYear() === year;

          return (
            <div
              key={index}
              className={`min-h-[80px] p-2 rounded-lg border transition-all ${
                day
                  ? isToday
                    ? 'bg-gray-100 border-gray-300'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                  : 'bg-gray-50 border-transparent'
              }`}
            >
              {day && (
                <>
                  <div className={`text-sm font-semibold mb-1 ${
                    isToday ? 'text-gray-900' : 'text-gray-900'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={`text-xs px-2 py-1 rounded cursor-pointer transition-all ${
                          event.status === 'confirmed' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                          event.status === 'pending' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                          event.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 px-2">
                        +{dayEvents.length - 2} more
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
  );
};

// Week View Component
const WeekView = ({ events, currentDate, onEventClick }) => {
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  return (
    <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
      <div className="grid grid-cols-8 gap-px bg-gray-200">
        <div className="bg-white p-2"></div>
        {weekDays.map((date, i) => (
          <div key={i} className="bg-white p-2 text-center border-b">
            <div className="text-xs text-gray-500">
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className="text-sm font-semibold">
              {date.getDate()}
            </div>
          </div>
        ))}

        {hours.map(hour => (
          <React.Fragment key={hour}>
            <div className="bg-white p-2 text-xs text-gray-500 text-right">
              {hour}:00
            </div>
            {weekDays.map((date, i) => (
              <div key={i} className="bg-white p-1 min-h-[60px] hover:bg-gray-50">
                {/* Events for this time slot */}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Year View Component
const YearView = ({ events, currentDate, onEventClick }) => {
  const year = currentDate.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => i);

  const getEventsForMonth = (monthIndex) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.getMonth() === monthIndex && eventDate.getFullYear() === year;
    });
  };

  return (
    <div className="p-4 grid grid-cols-4 gap-4">
      {months.map(month => {
        const monthEvents = getEventsForMonth(month);
        const monthDate = new Date(year, month, 1);

        return (
          <div key={month} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              {monthDate.toLocaleDateString('en-US', { month: 'long' })}
            </h3>
            <div className="space-y-1">
              {monthEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="text-xs px-2 py-1 bg-white rounded cursor-pointer hover:bg-gray-100"
                >
                  {event.title}
                </div>
              ))}
              {monthEvents.length > 3 && (
                <div className="text-xs text-gray-500 px-2">
                  +{monthEvents.length - 3} more
                </div>
              )}
              {monthEvents.length === 0 && (
                <div className="text-xs text-gray-400 italic px-2">No events</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 3 Year View Component
const ThreeYearView = ({ events, currentDate, onEventClick }) => {
  const startYear = currentDate.getFullYear();
  const years = [startYear, startYear + 1, startYear + 2];

  const getEventsForYear = (year) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.getFullYear() === year;
    });
  };

  return (
    <div className="p-4 space-y-6">
      {years.map(year => {
        const yearEvents = getEventsForYear(year);
        const months = Array.from({ length: 12 }, (_, i) => i);

        return (
          <div key={year} className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{year}</h2>
            <div className="grid grid-cols-6 gap-3">
              {months.map(month => {
                const monthEvents = yearEvents.filter(event => {
                  const eventDate = new Date(event.start_date);
                  return eventDate.getMonth() === month;
                });
                const monthDate = new Date(year, month, 1);

                return (
                  <div key={month} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-900 mb-1">
                      {monthDate.toLocaleDateString('en-US', { month: 'short' })}
                    </h4>
                    <div className="text-xs text-gray-600">
                      {monthEvents.length} {monthEvents.length === 1 ? 'event' : 'events'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarView;
