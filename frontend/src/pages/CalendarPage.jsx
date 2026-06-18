import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Camera, User, Loader2, Plus, Info } from 'lucide-react';
import api from '../api/axios';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 18)); // July 2026 for demo sync
  const [events, setEvents] = useState([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [loading, setLoading] = useState(true);

  const MOCK_EVENTS = [
    { id: 1, title: 'Priya Sharma (Wedding)', event_date: '2026-07-15', time: '10:00 AM', location: 'Grand Hyatt, Mumbai', event_type: 'Wedding', client_name: 'Priya Sharma' },
    { id: 2, title: 'Rahul & Meena (Wedding)', event_date: '2026-07-28', time: '04:00 PM', location: 'Sea Breeze Lawn, Alibaug', event_type: 'Wedding', client_name: 'Rahul Verma' },
    { id: 4, title: 'Rohan Mehta (Pre-Wedding)', event_date: '2026-07-05', time: '06:00 AM', location: 'Gateway of India, Mumbai', event_type: 'Pre-Wedding', client_name: 'Rohan Mehta' },
    { id: 7, title: 'Arjun Singh (Engagement)', event_date: '2026-07-20', time: '05:00 PM', location: 'St. Regis, Lower Parel', event_type: 'Engagement', client_name: 'Arjun Singh' },
    { id: 10, title: 'Karthik Nair (Pre-Wedding)', event_date: '2026-07-15', time: '05:30 PM', location: 'Marine Drive, Mumbai', event_type: 'Pre-Wedding', client_name: 'Karthik Nair' },
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
        const res = await api.get(`/calendar?start=${start}&end=${end}`);
        setEvents(res.data.length ? res.data : MOCK_EVENTS);
      } catch {
        setEvents(MOCK_EVENTS);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [currentDate]);

  // Set selected date's events
  useEffect(() => {
    const todayStr = currentDate.toISOString().split('T')[0];
    const filtered = events.filter(e => e.event_date.split('T')[0] === todayStr);
    setSelectedDayEvents(filtered);
    setSelectedDateStr(currentDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
  }, [events, currentDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const calendarCells = [];

  // Previous month padding days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      dayNum: prevMonthTotalDays - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevMonthTotalDays - i)
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    calendarCells.push({
      dayNum: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    });
  }

  // Next month padding days to fill 42 cells
  const remaining = 42 - calendarCells.length;
  for (let i = 1; i <= remaining; i++) {
    calendarCells.push({
      dayNum: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDaySelect = (cell) => {
    setCurrentDate(cell.date);
  };

  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.event_date.split('T')[0] === dateStr);
  };

  const getEventTypeColor = (type) => {
    const m = {
      'Wedding': '#6366F1',
      'Pre-Wedding': '#8B5CF6',
      'Engagement': '#EC4899',
      'Maternity': '#F59E0B',
      'Baby Shower': '#10B981'
    };
    return m[type] || '#64748B';
  };

  if (loading && events.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <Loader2 className="animate-spin" size={36} color="var(--primary)" />
    </div>
  );

  return (
    <div style={{ padding: '16px 20px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>Shoot Calendar</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Schedule shoots, track bookings, and coordinate assignments.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr', gap: 24 }} className="calendar-layout">
        {/* Left Side: Calendar Month View */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          {/* Header Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
              {MONTHS[month]} {year}
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handlePrevMonth} className="btn btn-secondary btn-icon" style={{ padding: 8 }}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: 12 }}>
                Today
              </button>
              <button onClick={handleNextMonth} className="btn btn-secondary btn-icon" style={{ padding: 8 }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: 10, marginBottom: 8 }}>
            {DAYS.map(d => (
              <div key={d} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', gap: 6, flex: 1, minHeight: 400 }}>
            {calendarCells.map((cell, idx) => {
              const cellEvents = getEventsForDate(cell.date);
              const isSelected = isSameDay(cell.date, currentDate);
              const isToday = isSameDay(cell.date, new Date());
              
              return (
                <div 
                  key={idx}
                  onClick={() => handleDaySelect(cell)}
                  style={{
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    borderRadius: 12,
                    padding: 8,
                    cursor: 'pointer',
                    minHeight: 65,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: cell.isCurrentMonth ? (isSelected ? 'rgba(99,102,241,0.06)' : 'var(--bg-card)') : 'rgba(0,0,0,0.02)',
                    opacity: cell.isCurrentMonth ? 1 : 0.4,
                    transition: 'all 0.2s ease',
                  }}
                  className="calendar-cell"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: 13, 
                      fontWeight: isSelected || isToday ? '700' : '500', 
                      color: isToday ? 'var(--primary)' : 'var(--text-primary)',
                      background: isToday ? 'rgba(99,102,241,0.12)' : 'transparent',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {cell.dayNum}
                    </span>
                  </div>

                  {/* Event Dots */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                    {cellEvents.map(e => (
                      <div 
                        key={e.id}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: getEventTypeColor(e.event_type)
                        }}
                        title={e.title}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Day Details & Upcoming Events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Selected Date Details */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Schedule for {selectedDateStr}
            </h3>

            {selectedDayEvents.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                <Calendar size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontSize: 13 }}>No shoots scheduled on this day</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedDayEvents.map(e => (
                  <div 
                    key={e.id} 
                    style={{ 
                      padding: 12, 
                      borderRadius: 12, 
                      borderLeft: `4px solid ${getEventTypeColor(e.event_type)}`, 
                      background: 'rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{e.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                      <Clock size={12} />
                      <span>{e.time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                      <MapPin size={12} />
                      <span>{e.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* List of all Monthly Events */}
          <div className="card" style={{ padding: 20, flex: 1 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
              All Shoots in {MONTHS[month]}
            </h3>

            {events.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No shoots booked this month.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                {events.map(e => (
                  <div key={e.id} style={{ display: 'flex', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 10, 
                      background: `${getEventTypeColor(e.event_type)}12`, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Camera size={16} color={getEventTypeColor(e.event_type)} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{e.client_name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {new Date(e.event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {e.event_type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .calendar-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
