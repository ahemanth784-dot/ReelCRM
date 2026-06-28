import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Menu, ChevronDown, User, Settings, LogOut, CheckCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export default function TopNavbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [lastReadId, setLastReadId] = useState(() => Number(localStorage.getItem('reelcrm_notifications_read_id') || 0));
  const [search, setSearch] = useState('');
  const notificationsRef = useRef(null);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const handleLogout = () => { logout(); navigate('/login'); };
  const loadNotifications = useCallback(async (showError = false) => {
    setNotificationsLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch (error) {
      setNotifications([]);
      if (showError) addToast(error.response?.data?.message || 'Failed to load notifications', 'error');
    } finally {
      setNotificationsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const closeDropdown = event => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', closeDropdown);
    return () => document.removeEventListener('mousedown', closeDropdown);
  }, []);

  const unreadCount = notifications.filter(notification => Number(notification.id) > lastReadId).length;
  const markAllRead = () => {
    const newestId = Math.max(lastReadId, ...notifications.map(notification => Number(notification.id) || 0));
    setLastReadId(newestId);
    localStorage.setItem('reelcrm_notifications_read_id', String(newestId));
  };
  const openNotifications = () => {
    setShowNotifications(value => !value);
    setShowProfile(false);
    if (!showNotifications) loadNotifications();
  };
  const openNotification = notification => {
    if (Number(notification.id) > lastReadId) {
      setLastReadId(Number(notification.id));
      localStorage.setItem('reelcrm_notifications_read_id', String(notification.id));
    }
    setShowNotifications(false);
    if (notification.client_id) navigate(`/clients/${notification.client_id}`);
    else if (notification.type === 'lead_added') navigate('/leads');
    else navigate('/dashboard');
  };
  const formatNotificationTime = date => {
    if (!date) return '';
    return new Date(date).toLocaleString('en-IN', {
      day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'
    });
  };

  return (
    <header className="topbar">
      {/* Hamburger (mobile) */}
      <button onClick={onMenuClick} className="btn btn-icon btn-secondary" style={{ display: 'none' }} id="hamburger-btn">
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
        <Search size={16} color="var(--text-muted)" />
        <input
          placeholder="Search clients, leads, events…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Date */}
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, display: 'none' }} className="desktop-date">
          {dateStr}
        </div>

        {/* Theme toggle */}
        <button onClick={toggle} className="btn btn-icon btn-secondary" title={dark ? 'Light mode' : 'Dark mode'}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button onClick={openNotifications} className="btn btn-icon btn-secondary" title="Notifications" aria-label="Notifications">
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-dot" />}
          </button>
          {showNotifications && (
            <div style={{
              position:'absolute',top:'calc(100% + 8px)',right:0,width:360,maxWidth:'calc(100vw - 24px)',
              background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,
              boxShadow:'var(--shadow-xl)',zIndex:600,overflow:'hidden'
            }}>
              <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border-light)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                <div>
                  <div style={{fontWeight:700,fontSize:15,color:'var(--text-primary)'}}>Notifications</div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>{unreadCount} unread</div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <button className="btn btn-icon btn-secondary btn-sm" title="Refresh notifications" aria-label="Refresh notifications" onClick={()=>loadNotifications(true)}>
                    <RefreshCw size={14} style={notificationsLoading?{animation:'spin 0.8s linear infinite'}:undefined}/>
                  </button>
                  <button className="btn btn-icon btn-secondary btn-sm" title="Mark all as read" aria-label="Mark all as read" onClick={markAllRead} disabled={!unreadCount}>
                    <CheckCheck size={14}/>
                  </button>
                </div>
              </div>
              <div style={{maxHeight:360,overflowY:'auto'}}>
                {notificationsLoading && notifications.length===0 ? (
                  <div style={{padding:28,textAlign:'center',color:'var(--text-muted)',fontSize:13}}>Loading notifications…</div>
                ) : notifications.length===0 ? (
                  <div style={{padding:28,textAlign:'center',color:'var(--text-muted)',fontSize:13}}>No notifications yet</div>
                ) : notifications.map(notification => {
                  const unread = Number(notification.id) > lastReadId;
                  return (
                    <button key={notification.id} onClick={()=>openNotification(notification)} style={{
                      width:'100%',textAlign:'left',padding:'12px 16px',border:'none',
                      borderBottom:'1px solid var(--border-light)',cursor:'pointer',
                      background:unread?'rgba(99,102,241,0.08)':'var(--bg-card)',display:'flex',gap:10
                    }}>
                      <span style={{width:8,height:8,borderRadius:'50%',background:unread?'var(--primary)':'transparent',marginTop:6,flexShrink:0}}/>
                      <span style={{minWidth:0}}>
                        <span style={{display:'block',fontSize:13,fontWeight:unread?700:500,color:'var(--text-primary)',lineHeight:1.4}}>
                          {notification.description}
                        </span>
                        <span style={{display:'block',fontSize:11,color:'var(--text-muted)',marginTop:3}}>
                          {formatNotificationTime(notification.created_at)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: 10, background: 'var(--border-light)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'var(--transition)' }}
          >
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div style={{ textAlign: 'left', display: 'none' }} className="desktop-user">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'Admin'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role || 'Admin'}</div>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {showProfile && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 12, boxShadow: 'var(--shadow-xl)', minWidth: 200, zIndex: 500,
              animation: 'slideUp 0.2s ease', overflow: 'hidden'
            }} onMouseLeave={() => setShowProfile(false)}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
              {[
                ...(user?.role === 'admin' ? [
                  { icon: User, label: 'Profile', action: () => { navigate('/settings'); setShowProfile(false); } },
                  { icon: Settings, label: 'Settings', action: () => { navigate('/settings'); setShowProfile(false); } },
                ] : []),
                { icon: LogOut, label: 'Logout', action: handleLogout, danger: true },
              ].map(({ icon: Icon, label, action, danger }) => (
                <button key={label} onClick={action} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 16px', background: 'none', border: 'none',
                  color: danger ? '#EF4444' : 'var(--text-primary)', fontSize: 14,
                  cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontWeight: 500,
                  transition: 'background 0.15s ease'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--border-light)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #hamburger-btn { display: flex !important; }
        }
        @media (min-width: 1024px) {
          .desktop-date { display: block !important; }
          .desktop-user { display: block !important; }
        }
      `}</style>
    </header>
  );
}
