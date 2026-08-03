import { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, LogOut, User, Settings, X, Info, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { getActivity } from '../services/api';

const ICONS = {
  alert:   { icon: <AlertTriangle size={14} className="text-orange-500" />, bg: 'bg-orange-50' },
  success: { icon: <CheckCircle2 size={14} className="text-green-500" />,   bg: 'bg-green-50' },
  info:    { icon: <Info size={14} className="text-indigo-500" />,          bg: 'bg-indigo-50' },
  report:  { icon: <FileText size={14} className="text-blue-500" />,        bg: 'bg-blue-50' },
};

export default function Header({ user, searchQuery, onSearch, onLogout, onNavigate }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [events, setEvents] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('edupredict_read_events') || '[]'); }
    catch { return []; }
  });
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('edupredict_dismissed_events') || '[]'); }
    catch { return []; }
  });

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const keyOf = (e) => `${e.title}|${e.desc}|${e.time}`;

  const loadActivity = () => {
    getActivity()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  // Load on mount, then poll every 20s so new predictions show up live
  useEffect(() => {
    loadActivity();
    const t = setInterval(loadActivity, 20000);
    return () => clearInterval(t);
  }, []);

  // Refresh the moment the bell is opened
  useEffect(() => {
    if (showNotifications) loadActivity();
  }, [showNotifications]);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const visible = events.filter((e) => !dismissed.includes(keyOf(e)));
  const unreadCount = visible.filter((e) => !readIds.includes(keyOf(e))).length;

  const markAllRead = () => {
    const all = [...new Set([...readIds, ...visible.map(keyOf)])];
    setReadIds(all);
    localStorage.setItem('edupredict_read_events', JSON.stringify(all));
  };

  const dismiss = (e) => {
    const next = [...dismissed, keyOf(e)];
    setDismissed(next);
    localStorage.setItem('edupredict_dismissed_events', JSON.stringify(next));
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-end gap-5 px-8 sticky top-0 z-10">
      <div className="flex items-center gap-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm rounded-full px-4 py-2 w-72">
        <Search size={16} className="text-gray-500 dark:text-gray-300 shrink-0" />
        <input
          type="text"
          placeholder="Search students..."
          value={searchQuery || ''}
          onChange={(e) => onSearch && onSearch(e.target.value)}
          className="bg-transparent outline-none text-sm flex-1 text-gray-700 dark:text-gray-100 placeholder:text-gray-400"
        />
        {searchQuery && (
          <button onClick={() => onSearch('')} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
        )}
      </div>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
          className="relative text-gray-500 dark:text-gray-300 hover:text-gray-700 p-1">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-blue-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-80 z-30">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">Mark all read</button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {visible.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  No activity yet — make a prediction to see notifications here.
                </p>
              ) : visible.map((e, i) => {
                const style = ICONS[e.type] || ICONS.info;
                const isUnread = !readIds.includes(keyOf(e));
                return (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${isUnread ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                    <div className={`w-7 h-7 rounded-full ${style.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">{e.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{e.desc}</p>
                      <p className="text-xs text-gray-400 mt-1">{e.time}</p>
                    </div>
                    <button onClick={() => dismiss(e)} className="text-gray-300 hover:text-gray-500 shrink-0">
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-2 py-1 transition-colors">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
            style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>
            {initials}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-tight">{user?.full_name || 'Admin'}</p>
            <p className="text-xs text-gray-400 leading-tight">{user?.role || 'Administrator'}</p>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </button>

        {showProfile && (
          <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 w-64 z-30">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 mt-1 inline-block">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => { setShowProfile(false); onNavigate && onNavigate('settings'); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <User size={15} /> My Profile
            </button>
            <button onClick={() => { setShowProfile(false); onNavigate && onNavigate('settings'); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <Settings size={15} /> Settings
            </button>
            <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
              <button onClick={() => { setShowProfile(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
