import { useState, useEffect, useRef } from 'react';
import {
  Settings as SettingsIcon, User, SlidersHorizontal, Bell, Shield, Mail,
  AlertTriangle, RefreshCw, Megaphone, ChevronRight, Database, Clock,
  Trash2, Lock, KeyRound, Monitor, School, Cloud, Code, Pencil, X, Moon, Sun, Info,
} from 'lucide-react';
import { getSettings, updateSettings, updateProfile, changePassword } from '../services/api';
import { applyTheme } from '../utils/theme';

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

/* Marks a control that isn't implemented yet, so nothing pretends to work. */
function SoonBadge() {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
      Coming soon
    </span>
  );
}

function Toggle({ on, onChange, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onChange}
      aria-pressed={on}
      disabled={disabled}
      className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      style={{ background: on && !disabled ? '#6366F1' : '#D1D5DB' }}>
      <span className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all"
        style={{ left: on && !disabled ? '20px' : '2px' }} />
    </button>
  );
}

function ToggleRow({ icon, label, desc, on, onChange, soon }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          {soon && <SoonBadge />}
        </div>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <Toggle on={on} onChange={onChange} disabled={soon} />
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

  const sectionRefs = {
    profile: useRef(null), preferences: useRef(null), notifications: useRef(null),
    security: useRef(null), system: useRef(null), integrations: useRef(null), danger: useRef(null),
  };

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      if (s?.theme) applyTheme(s.theme);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) setProfile({ full_name: user.full_name, email: user.email });
  }, [user]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    sectionRefs[tabId]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const persist = (updated, message) => {
    setSettings(updated);
    updateSettings(updated)
      .then(() => showToast(message || 'Settings saved.'))
      .catch(() => showToast('Could not save — check your connection.'));
  };

  const flipToggle = (key) => {
    if (!settings) return;
    persist({ ...settings, [key]: settings[key] ? 0 : 1 });
  };

  const handlePrefChange = (key, value) => {
    if (!settings) return;
    // Theme is applied to the DOM immediately, then persisted
    if (key === 'theme') applyTheme(value);
    persist({ ...settings, [key]: value },
      key === 'theme' ? `Switched to ${value} theme.` : 'Preference saved.');
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
    if (passwords.new.length < 8) { showToast('New password must be at least 8 characters'); return; }
    if (passwords.new !== passwords.confirm) { showToast('New passwords do not match'); return; }
    try {
      await changePassword({ current_password: passwords.current, new_password: passwords.new });
      showToast('Password changed successfully.');
      setShowPasswordModal(false);
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) { showToast(err.message || 'Failed to change password'); }
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'A';

  const isDark = settings?.theme === 'Dark';

  const quickCards = [
    { id: 'profile', icon: <User size={20} className="text-indigo-500" />, iconBg: 'bg-indigo-50', title: 'Profile', desc: 'Manage your profile information and account details.', btn: 'Update Profile', btnClass: 'bg-indigo-100 text-indigo-700' },
    { id: 'preferences', icon: <SlidersHorizontal size={20} className="text-green-500" />, iconBg: 'bg-green-50', title: 'Preferences', desc: 'Customize application behavior and appearance.', btn: 'Manage Preferences', btnClass: 'bg-green-100 text-green-700' },
    { id: 'notifications', icon: <Bell size={20} className="text-orange-500" />, iconBg: 'bg-orange-50', title: 'Notifications', desc: 'Control which alerts appear in your notification bell.', btn: 'Configure', btnClass: 'bg-orange-100 text-orange-700' },
    { id: 'security', icon: <Shield size={20} className="text-blue-500" />, iconBg: 'bg-blue-50', title: 'Security', desc: 'Manage your password and security preferences.', btn: 'Manage Security', btnClass: 'bg-blue-100 text-blue-700' },
  ];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          Settings <SettingsIcon size={22} className="text-indigo-500" />
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account, preferences and application settings.</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {quickCards.map((c) => (
          <div key={c.id} onClick={() => handleTabClick(c.id)}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col cursor-pointer hover:border-indigo-300 transition-colors">
            <div className={`w-11 h-11 rounded-full ${c.iconBg} flex items-center justify-center mb-3`}>{c.icon}</div>
            <p className="text-sm font-semibold text-gray-800 mb-1">{c.title}</p>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">{c.desc}</p>
            <button className={`text-xs font-semibold px-3 py-1.5 rounded-lg mt-auto ${c.btnClass}`}>{c.btn}</button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-6 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => handleTabClick(tab.id)}
            className={`pb-3 text-sm whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE ─────────────────────────────────────────────── */}
      <div ref={sectionRefs.profile} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User size={18} className="text-indigo-500" /> Profile Information
        </h2>
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
            <input type="text" value={profile.full_name}
              onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} className={inputClass} /></div>
          <div><label className={labelClass}>Email Address</label>
            <input type="email" value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} className={inputClass} /></div>
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

      {/* ── PREFERENCES ─────────────────────────────────────────── */}
      <div ref={sectionRefs.preferences} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-green-500" /> Application Preferences
        </h2>
        {settings ? (
          <>
            {/* Theme — a real, working control */}
            <div className="flex items-center gap-3 py-3 border-b border-gray-50 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                {isDark ? <Moon size={15} /> : <Sun size={15} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Appearance</p>
                <p className="text-xs text-gray-400">Switch between light and dark interface</p>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {['Light', 'Dark', 'System'].map((t) => (
                  <button key={t} onClick={() => handlePrefChange('theme', t)}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${settings.theme === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Default page — real */}
              <div>
                <label className={labelClass}>Default Landing Page</label>
                <select value={settings.default_page}
                  onChange={(e) => handlePrefChange('default_page', e.target.value)} className={inputClass}>
                  <option value="dashboard">Dashboard</option>
                  <option value="predict">Predict Performance</option>
                  <option value="students">Students</option>
                  <option value="analytics">Analytics</option>
                  <option value="reports">Reports</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Opens automatically when you sign in</p>
              </div>

              {/* Language — not implemented, and says so */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className={labelClass + ' mb-0'}>Language</label>
                  <SoonBadge />
                </div>
                <select value="English" disabled
                  className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`}>
                  <option>English</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Additional languages planned for a future release</p>
              </div>

              {/* Timezone — not implemented */}
              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <label className={labelClass + ' mb-0'}>Timezone</label>
                  <SoonBadge />
                </div>
                <select value={settings.timezone} disabled
                  className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`}>
                  <option>{settings.timezone}</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Timestamps currently follow your device clock. Configurable timezones planned.
                </p>
              </div>
            </div>
          </>
        ) : <p className="text-sm text-gray-400">Loading preferences...</p>}
      </div>

      {/* ── NOTIFICATIONS ───────────────────────────────────────── */}
      <div ref={sectionRefs.notifications} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
          <Bell size={18} className="text-orange-500" /> Notification Preferences
        </h2>
        <p className="text-xs text-gray-400 mb-2">Controls which events appear in your notification bell.</p>
        {settings ? (
          <>
            <ToggleRow icon={<AlertTriangle size={15} />} label="At-Risk Alerts"
              desc="Show a notification when a prediction flags a student as at risk"
              on={!!settings.performance_alerts} onChange={() => flipToggle('performance_alerts')} />
            <ToggleRow icon={<RefreshCw size={15} />} label="Prediction Activity"
              desc="Show notifications when predictions complete"
              on={!!settings.model_updates} onChange={() => flipToggle('model_updates')} />
            <ToggleRow icon={<Megaphone size={15} />} label="Report Activity"
              desc="Show notifications when reports are generated"
              on={!!settings.system_announcements} onChange={() => flipToggle('system_announcements')} />
            <ToggleRow icon={<Mail size={15} />} label="Email Notifications"
              desc="Send these alerts to your email address" soon
              on={false} onChange={() => {}} />
          </>
        ) : <p className="text-sm text-gray-400">Loading...</p>}
      </div>

      {/* ── SECURITY ────────────────────────────────────────────── */}
      <div ref={sectionRefs.security} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Shield size={18} className="text-blue-500" /> Security Settings
        </h2>
        <div className="flex items-center gap-3 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 rounded-lg px-1 -mx-1"
          onClick={() => setShowPasswordModal(true)}>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0"><Lock size={15} /></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">Change Password</p>
            <p className="text-xs text-gray-400">Update your account password</p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </div>
        <ToggleRow icon={<KeyRound size={15} />} label="Two-Factor Authentication"
          desc="Requires an SMS or authenticator app integration" soon
          on={false} onChange={() => {}} />
      </div>

      {/* ── SYSTEM ──────────────────────────────────────────────── */}
      <div ref={sectionRefs.system} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
          <Monitor size={18} className="text-gray-500" /> System Settings
        </h2>
        <p className="text-xs text-gray-400 mb-2">
          These require scheduled server-side jobs and are planned for institutional deployment.
        </p>
        <ToggleRow icon={<Cloud size={15} />} label="Automatic Backups"
          desc="Scheduled database snapshots" soon on={false} onChange={() => {}} />
        <div className="flex items-center gap-3 py-3 border-b border-gray-50">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0"><Clock size={15} /></div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-800">Data Retention</p>
              <SoonBadge />
            </div>
            <p className="text-xs text-gray-400">Automatic purging of old prediction records</p>
          </div>
          <select value={settings?.data_retention || '365 days'} disabled
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-gray-50 text-gray-400 cursor-not-allowed">
            <option>{settings?.data_retention || '365 days'}</option>
          </select>
        </div>
        <ToggleRow icon={<Monitor size={15} />} label="Maintenance Mode"
          desc="Temporarily restrict access during updates" soon on={false} onChange={() => {}} />
      </div>

      {/* ── INTEGRATIONS ────────────────────────────────────────── */}
      <div ref={sectionRefs.integrations} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
          <Cloud size={18} className="text-indigo-500" /> Integrations
        </h2>
        <p className="text-xs text-gray-400 mb-2">
          Planned connections to external systems. Each requires institutional credentials and API access.
        </p>
        {[
          { icon: <School size={15} />, label: 'School Management System', desc: 'Import student records and class lists automatically' },
          { icon: <Mail size={15} />, label: 'Email Service', desc: 'Deliver at-risk alerts to staff inboxes' },
          { icon: <Cloud size={15} />, label: 'Cloud Storage', desc: 'Archive generated reports off-site' },
          { icon: <Code size={15} />, label: 'Public API Access', desc: 'Allow external systems to request predictions' },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-3 py-3 border-b border-gray-50">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">{row.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-800">{row.label}</p>
                <SoonBadge />
              </div>
              <p className="text-xs text-gray-400">{row.desc}</p>
            </div>
            <button disabled
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed shrink-0">
              Connect
            </button>
          </div>
        ))}
      </div>

      {/* ── DANGER ZONE ─────────────────────────────────────────── */}
      <div ref={sectionRefs.danger} className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-red-600 mb-2">Danger Zone</h2>

        <div className="flex items-center gap-3 py-3 border-b border-red-50">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0"><RefreshCw size={15} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">Reset Preferences</p>
            <p className="text-xs text-gray-400">Restore theme and landing page to their defaults</p>
          </div>
          <button
            onClick={() => {
              if (!settings) return;
              if (window.confirm('Reset your preferences to default? Your students, predictions and reports will not be affected.')) {
                applyTheme('Light');
                persist({ ...settings, theme: 'Light', default_page: 'dashboard' }, 'Preferences reset to default.');
              }
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 shrink-0">
            Reset
          </button>
        </div>

        <div className="flex items-center gap-3 py-3 border-b border-red-50">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0"><Database size={15} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">Clear Local Cache</p>
            <p className="text-xs text-gray-400">Clears dismissed notifications and signs you out</p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Clear local cache? You will be signed out and need to log in again.')) {
                localStorage.clear();
                onLogout();
              }
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 shrink-0">
            Clear
          </button>
        </div>

        <div className="flex items-center gap-3 py-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0"><Trash2 size={15} /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-800">Delete Account</p>
              <SoonBadge />
            </div>
            <p className="text-xs text-gray-400">Permanent account and data deletion</p>
          </div>
          <button disabled
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed shrink-0">
            Delete
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-indigo-50 rounded-xl px-4 py-3 mb-6">
        <Info size={14} className="text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-600 leading-relaxed">
          Settings marked <span className="font-semibold">Coming soon</span> are documented in the project's
          future work section. They require infrastructure beyond the current scope — scheduled jobs,
          email delivery, and third-party API credentials.
        </p>
      </div>

      <p className="text-xs text-gray-400 text-center mb-6">© 2026 EduPredict. All rights reserved. — Version 1.0.0</p>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Change Password</h2>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div><label className={labelClass}>Current Password</label>
                <input type="password" value={passwords.current}
                  onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>New Password</label>
                <input type="password" value={passwords.new}
                  onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))} className={inputClass} />
                <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p></div>
              <div><label className={labelClass}>Confirm New Password</label>
                <input type="password" value={passwords.confirm}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} className={inputClass} /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowPasswordModal(false)}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleChangePassword}
                className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm"
                style={{ background: 'linear-gradient(to right, #6366F1, #A5B4FC)' }}>Change Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
