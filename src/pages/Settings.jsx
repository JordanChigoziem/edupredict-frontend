import { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, User, SlidersHorizontal, Bell, Shield, Mail, AlertTriangle, RefreshCw, Megaphone, ChevronRight, Database, Clock, Trash2, Lock, KeyRound, Monitor, School, Cloud, Code, Pencil, X } from 'lucide-react';
import { getSettings, updateSettings, updateProfile, changePassword } from '../services/api';

const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 outline-none text-gray-700 text-sm";
const labelClass = "text-xs text-gray-500 block mb-1";

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
  { id: 'system', label: 'System' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'danger', label: 'Danger Zone' },
];

function Toggle({ on, onChange }) {
  return (
    <button onClick={onChange} aria-pressed={on}
      className="relative w-10 h-[22px] rounded-full transition-colors shrink-0"
      style={{ background: on ? '#6366F1' : '#D1D5DB' }}>
      <span className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all"
        style={{ left: on ? '20px' : '2px' }} />
    </button>
  );
}

function ToggleRow({ icon, label, desc, on, onChange }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

export default function Settings({ user, onUserUpdate, showToast, onLogout }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState(null);
  const [profile, setProfile] = useState({ full_name: user?.full_name || '', email: user?.email || '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  // Section refs for scroll-to
  const sectionRefs = {
    profile: useRef(null),
    preferences: useRef(null),
    notifications: useRef(null),
    security: useRef(null),
    system: useRef(null),
    integrations: useRef(null),
    danger: useRef(null),
  };

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) setProfile({ full_name: user.full_name, email: user.email });
  }, [user]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    sectionRefs[tabId]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const flipToggle = (key) => {
    if (!settings) return;
    const updated = { ...settings, [key]: settings[key] ? 0 : 1 };
    setSettings(updated);
    updateSettings(updated).then(() => showToast('Settings saved.')).catch(() => showToast('Failed to save settings'));
  };

  const handlePrefChange = (key, value) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    updateSettings(updated).then(() => showToast('Preference saved.')).catch(() => showToast('Failed to save'));
  };

  const handleSaveProfile = async () => {
    if (!profile.full_name || !profile.email) { showToast('Name and email are required'); return; }
    setSaving(true);
    try {
      const updated = await updateProfile(profile);
      onUserUpdate({ ...user, ...updated });
      showToast('Profile updated successfully.');
    } catch (err) { showToast(err.message || 'Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new) { showToast('Please fill in all password fields'); return; }
    if (passwords.new !== passwords.confirm) { showToast('New passwords do not match'); return; }
    try {
      await changePassword({ current_password: passwords.current, new_password: passwords.new });
      showToast('Password changed successfully.');
      setShowPasswordModal(false);
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) { showToast(err.message || 'Failed to change password'); }
  };

  const initials = user?.full_name ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'A';

  // Quick access cards at top — each navigates to relevant tab
  const quickCards = [
    { id: 'profile', icon: <User size={20} className="text-indigo-500" />, iconBg: 'bg-indigo-50', title: 'Profile', desc: 'Manage your profile information and account details.', btn: 'Update Profile', btnClass: 'bg-indigo-100 text-indigo-700' },
    { id: 'preferences', icon: <SlidersHorizontal size={20} className="text-green-500" />, iconBg: 'bg-green-50', title: 'Preferences', desc: 'Customize application behavior and default preferences.', btn: 'Manage Preferences', btnClass: 'bg-green-100 text-green-700' },
    { id: 'notifications', icon: <Bell size={20} className="text-orange-500" />, iconBg: 'bg-orange-50', title: 'Notifications', desc: 'Control how and when you receive notifications.', btn: 'Configure', btnClass: 'bg-orange-100 text-orange-700' },
    { id: 'security', icon: <Shield size={20} className="text-blue-500" />, iconBg: 'bg-blue-50', title: 'Security', desc: 'Manage password, 2FA and security preferences.', btn: 'Manage Security', btnClass: 'bg-blue-100 text-blue-700' },
  ];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          Settings <SettingsIcon size={22} className="text-indigo-500" />
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account, preferences and application settings.</p>
      </div>

      {/* Quick access cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {quickCards.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col cursor-pointer hover:border-indigo-200 transition-colors"
            onClick={() => handleTabClick(c.id)}>
            <div className={`w-11 h-11 rounded-full ${c.iconBg} flex items-center justify-center mb-3`}>{c.icon}</div>
            <p className="text-sm font-semibold text-gray-800 mb-1">{c.title}</p>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">{c.desc}</p>
            <button className={`text-xs font-semibold px-3 py-1.5 rounded-lg mt-auto ${c.btnClass}`}>{c.btn}</button>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => handleTabClick(tab.id)}
            className={`pb-3 text-sm whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Section */}
      <div ref={sectionRefs.profile} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><User size={18} className="text-indigo-500" /> Profile Information</h2>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
            style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>{initials}</div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{user?.full_name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 mt-1 inline-block">{user?.role}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Full Name</label>
            <input type="text" value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} className={inputClass} /></div>
          <div><label className={labelClass}>Email Address</label>
            <input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} className={inputClass} /></div>
          <div><label className={labelClass}>Role</label>
            <input type="text" value={user?.role || ''} disabled className={`${inputClass} bg-gray-50 text-gray-400`} /></div>
          <div><label className={labelClass}>Joined On</label>
            <input type="text" value={user?.joined_on || '—'} disabled className={`${inputClass} bg-gray-50 text-gray-400`} /></div>
        </div>
        <button onClick={handleSaveProfile} disabled={saving}
          className="flex items-center gap-2 mt-4 text-xs font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>
          <Pencil size={13} /> {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Preferences Section */}
      <div ref={sectionRefs.preferences} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><SlidersHorizontal size={18} className="text-green-500" /> Application Preferences</h2>
        {settings ? (
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Default Dashboard</label>
              <select value={settings.default_page} onChange={(e) => handlePrefChange('default_page', e.target.value)} className={inputClass}>
                <option value="dashboard">Dashboard</option><option value="predict">Predict Performance</option>
                <option value="students">Students</option><option value="analytics">Analytics</option>
              </select></div>
            <div><label className={labelClass}>Theme</label>
              <select value={settings.theme} onChange={(e) => handlePrefChange('theme', e.target.value)} className={inputClass}>
                <option>Light</option><option>Dark</option><option>System</option>
              </select></div>
            <div><label className={labelClass}>Language</label>
              <select value={settings.language} onChange={(e) => handlePrefChange('language', e.target.value)} className={inputClass}>
                <option>English</option><option>French</option><option>Spanish</option>
              </select></div>
            <div><label className={labelClass}>Timezone</label>
              <select value={settings.timezone} onChange={(e) => handlePrefChange('timezone', e.target.value)} className={inputClass}>
                <option>(UTC+01:00) West Africa Time</option><option>(UTC+00:00) GMT</option><option>(UTC-05:00) Eastern Time</option>
              </select></div>
          </div>
        ) : <p className="text-sm text-gray-400">Loading preferences...</p>}
      </div>

      {/* Notifications Section */}
      <div ref={sectionRefs.notifications} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2"><Bell size={18} className="text-orange-500" /> Notification Preferences</h2>
        {settings ? (
          <>
            <ToggleRow icon={<Mail size={15} />} label="Email Notifications" desc="Receive email notifications" on={!!settings.email_notifications} onChange={() => flipToggle('email_notifications')} />
            <ToggleRow icon={<AlertTriangle size={15} />} label="Performance Alerts" desc="Get alerts for at-risk students" on={!!settings.performance_alerts} onChange={() => flipToggle('performance_alerts')} />
            <ToggleRow icon={<RefreshCw size={15} />} label="Model Updates" desc="Notifications about model activities" on={!!settings.model_updates} onChange={() => flipToggle('model_updates')} />
            <ToggleRow icon={<Megaphone size={15} />} label="System Announcements" desc="Important system updates" on={!!settings.system_announcements} onChange={() => flipToggle('system_announcements')} />
          </>
        ) : <p className="text-sm text-gray-400">Loading...</p>}
      </div>

      {/* Security Section */}
      <div ref={sectionRefs.security} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2"><Shield size={18} className="text-blue-500" /> Security Settings</h2>
        <div className="flex items-center gap-3 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 rounded-lg px-1 -mx-1" onClick={() => setShowPasswordModal(true)}>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0"><Lock size={15} /></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">Change Password</p>
            <p className="text-xs text-gray-400">Update your account password</p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </div>
        {settings && (
          <ToggleRow icon={<KeyRound size={15} />} label="Two-Factor Authentication" desc="Add an extra layer of security" on={!!settings.two_factor} onChange={() => flipToggle('two_factor')} />
        )}
      </div>

      {/* System Section */}
      <div ref={sectionRefs.system} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2"><Monitor size={18} className="text-gray-500" /> System Settings</h2>
        {settings && (
          <>
            <ToggleRow icon={<Cloud size={15} />} label="Auto Backup" desc="Automatically backup system data" on={!!settings.auto_backup} onChange={() => flipToggle('auto_backup')} />
            <div className="flex items-center gap-3 py-3 border-b border-gray-50">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0"><Clock size={15} /></div>
              <div className="flex-1"><p className="text-sm font-medium text-gray-800">Data Retention</p></div>
              <select value={settings.data_retention} onChange={(e) => handlePrefChange('data_retention', e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none">
                <option>365 days</option><option>180 days</option><option>90 days</option>
              </select>
            </div>
            <ToggleRow icon={<Monitor size={15} />} label="Maintenance Mode" desc="Temporarily disable new logins" on={!!settings.maintenance_mode} onChange={() => flipToggle('maintenance_mode')} />
          </>
        )}
      </div>

      {/* Integrations Section */}
      <div ref={sectionRefs.integrations} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2"><Cloud size={18} className="text-indigo-500" /> Integrations</h2>
        {[
          { icon: <School size={15} />, label: 'School Management System', desc: 'Sync student and class data' },
          { icon: <Mail size={15} />, label: 'Email Service', desc: 'Send notifications and reports' },
          { icon: <Cloud size={15} />, label: 'Cloud Storage', desc: 'Backup and export data' },
          { icon: <Code size={15} />, label: 'API Access', desc: 'Access API for external apps' },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-3 py-3 border-b border-gray-50">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">{row.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{row.label}</p>
              <p className="text-xs text-gray-400">{row.desc}</p>
            </div>
            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 shrink-0">Connect</button>
          </div>
        ))}
      </div>

      {/* Danger Zone */}
      <div ref={sectionRefs.danger} className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-red-600 mb-2">Danger Zone</h2>
        {[
          { icon: <RefreshCw size={15} />, label: 'Reset Application', desc: 'Reset all application settings to default', btn: 'Reset' },
          { icon: <Database size={15} />, label: 'Clear Cache & Logs', desc: 'Permanently clear all cache and logs', btn: 'Clear' },
          { icon: <Trash2 size={15} />, label: 'Delete Account', desc: 'Permanently delete your account and all data', btn: 'Delete' },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-3 py-3 border-b border-red-50">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0">{row.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{row.label}</p>
              <p className="text-xs text-gray-400">{row.desc}</p>
            </div>
            <button onClick={() => {
              if (window.confirm(`Are you sure you want to ${row.label.toLowerCase()}? This cannot be undone.`)) {
                if (row.label === 'Delete Account') onLogout();
                else showToast(`${row.label} requires backend connection to execute.`);
              }
            }} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 shrink-0">{row.btn}</button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center mt-2 mb-6">© 2026 EduPredict. All rights reserved. — Version 1.0.0</p>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Change Password</h2>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div><label className={labelClass}>Current Password</label>
                <input type="password" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>New Password</label>
                <input type="password" value={passwords.new} onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>Confirm New Password</label>
                <input type="password" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} className={inputClass} /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleChangePassword} className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm" style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>Change Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
