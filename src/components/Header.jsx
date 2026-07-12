import { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, LogOut, User, Settings, X, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'alert', icon: <AlertTriangle size={14} className="text-orange-500" />, bg: 'bg-orange-50', title: 'At-Risk Student Detected', desc: 'A new prediction flagged a student as High Risk.', time: 'Just now', unread: true },
  { id: 2, type: 'success', icon: <CheckCircle2 size={14} className="text-green-500" />, bg: 'bg-green-50', title: 'Prediction Complete', desc: 'Performance prediction completed successfully.', time: '5 min ago', unread: true },
  { id: 3, type: 'info', icon: <Info size={14} className="text-indigo-500" />, bg: 'bg-indigo-50', title: 'Model Ready', desc: 'Random Forest model is deployed and active.', time: '1 hr ago', unread: false },
];

export default function Header({ user, searchQuery, onSearch, onLogout, onNavigate }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  const dismiss = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-end gap-5 px-8 sticky top-0 z-10">
      {/* Search */}
      <div className="flex items-center gap-3 bg-white border border-gray-200 shadow-sm rounded-full px-4 py-2 w-72">
        <Search size={16} className="text-gray-500 shrink-0" />
        <input
          type="text"
          placeholder="Search students..."
          value={searchQuery || ''}
          onChange={(e) => onSearch && onSearch(e.target.value)}
          className="bg-transparent outline-none text-sm flex-1 text-gray-700 placeholder:text-gray-400"
        />
        {searchQuery && (
          <button onClick={() => onSearch('')} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
          className="relative text-gray-500 hover:text-gray-700 p-1">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-lg w-80 z-30">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">Mark all read</button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No notifications</p>
              ) : notifications.map((n) => (
                <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${n.unread ? 'bg-blue-50/30' : ''}`}>
                  <div className={`w-7 h-7 rounded-full ${n.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-500 leading-tight">{n.desc}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                  </div>
                  <button onClick={() => dismiss(n.id)} className="text-gray-300 hover:text-gray-500 shrink-0">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-gray-100">
              <button className="text-xs text-indigo-600 hover:underline w-full text-center">View all notifications</button>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
            style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>
            {initials}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-tight">{user?.full_name || 'Admin'}</p>
            <p className="text-xs text-gray-400 leading-tight">{user?.role || 'Administrator'}</p>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </button>

        {showProfile && (
          <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-lg py-2 w-64 z-30">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 mt-1 inline-block">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => { setShowProfile(false); onNavigate && onNavigate('settings'); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
              <User size={15} /> My Profile
            </button>
            <button onClick={() => { setShowProfile(false); onNavigate && onNavigate('settings'); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
              <Settings size={15} /> Settings
            </button>
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button onClick={() => { setShowProfile(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
