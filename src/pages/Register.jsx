import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Brain, TrendingUp, PieChart, Shield, GraduationCap } from 'lucide-react';

const BASE_URL = 'http://localhost:5000/api';

export default function Register({ onGoLogin, onLogin }) {
  const [form, setForm] = useState({
    full_name: '', role: '', email: '', password: '', confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const validatePassword = (pw) => {
    return pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.full_name.trim() || !form.email || !form.password || !form.role) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!validatePassword(form.password)) {
      setError('Password must be at least 8 characters and include a number, uppercase letter, and special character.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      localStorage.setItem('edupredict_token', data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#F0EFFF' }}>

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] p-12" style={{ background: '#F0EFFF' }}>
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">Edu<span className="text-indigo-600">Predict</span></p>
            <p className="text-xs text-gray-400">ML Student Performance Predictor</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="flex-1 flex flex-col justify-center max-w-md">
          <h1 className="text-4xl font-black text-gray-900 leading-tight mb-4">
            Predict. Understand.<br />
            <span className="text-indigo-600">Empower Students.</span>
          </h1>
          <p className="text-gray-500 text-base mb-10">
            Join EduPredict and leverage the power of machine learning to improve academic outcomes.
          </p>

          {/* Dashboard preview card */}
          <div className="bg-white rounded-2xl p-5 shadow-lg mb-4 relative">
            <div className="absolute -top-3 right-4 bg-white rounded-xl px-3 py-1.5 shadow-md flex items-center gap-1.5">
              <TrendingUp size={13} className="text-green-500" />
              <span className="text-xs font-bold text-green-600">↑ 14.6%</span>
              <span className="text-xs text-gray-400">Improvement</span>
            </div>

            <p className="text-xs font-semibold text-gray-600 mb-3">Student Performance Overview</p>
            <div className="flex items-center gap-4">
              {/* Mini gauge */}
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="30" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                  <circle cx="40" cy="40" r="30" fill="none" stroke="#6366F1" strokeWidth="8"
                    strokeDasharray={`${0.78 * 2 * Math.PI * 30} ${2 * Math.PI * 30}`}
                    strokeLinecap="round" transform="rotate(-90 40 40)" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-lg font-black text-gray-800">78%</span>
                  <span className="text-xs text-gray-500">Avg Score</span>
                </div>
              </div>

              {/* Mini bar chart */}
              <div className="flex-1 flex items-end gap-1.5 h-14">
                {[35, 50, 40, 60, 65, 75, 70].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm"
                    style={{ height: `${h}%`, background: i === 5 ? '#6366F1' : i >= 3 ? '#A5B4FC' : '#E0E7FF' }} />
                ))}
              </div>

              <div className="text-3xl shrink-0">🌿</div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              {[<Brain size={12} />, <TrendingUp size={12} />, <PieChart size={12} />].map((icon, i) => (
                <div key={i} className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                  {icon}
                </div>
              ))}
            </div>
          </div>

          <div className="text-4xl mt-2">📚</div>
        </div>

        {/* Feature badges */}
        <div className="flex items-center gap-6">
          {[
            { icon: <Brain size={18} className="text-indigo-500" />, label: 'AI-Powered', sub: 'Predictions' },
            { icon: <TrendingUp size={18} className="text-indigo-500" />, label: 'Actionable', sub: 'Insights' },
            { icon: <Shield size={18} className="text-indigo-500" />, label: 'Secure &', sub: 'Reliable' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center">{f.icon}</div>
              <div>
                <p className="text-xs font-semibold text-gray-700">{f.label}</p>
                <p className="text-xs text-gray-400">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — register form */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-4">
          <h2 className="text-3xl font-black text-gray-900 mb-1">Create your account</h2>
          <p className="text-gray-500 text-sm mb-7">Get started with EduPredict</p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name + Role */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Full Name</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 hover:border-indigo-300 transition-colors">
                  <User size={15} className="text-gray-400 shrink-0" />
                  <input type="text" placeholder="Enter your full name" value={form.full_name}
                    onChange={set('full_name')} required
                    className="flex-1 py-3 outline-none text-sm text-gray-700 placeholder:text-gray-400" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Role</label>
                <select value={form.role} onChange={set('role')} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none hover:border-indigo-300 transition-colors">
                  <option value="">Select your role</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Academic Advisor">Academic Advisor</option>
                  <option value="Researcher">Researcher</option>
                </select>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Email Address</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 hover:border-indigo-300 transition-colors">
                <Mail size={15} className="text-gray-400 shrink-0" />
                <input type="email" placeholder="Enter your email" value={form.email}
                  onChange={set('email')} required
                  className="flex-1 py-3 outline-none text-sm text-gray-700 placeholder:text-gray-400" />
              </div>
            </div>

            {/* Password + Confirm */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Password</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 hover:border-indigo-300 transition-colors">
                  <Lock size={15} className="text-gray-400 shrink-0" />
                  <input type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={form.password}
                    onChange={set('password')} required
                    className="flex-1 py-3 outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Confirm Password</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 hover:border-indigo-300 transition-colors">
                  <Lock size={15} className="text-gray-400 shrink-0" />
                  <input type={showConfirm ? 'text' : 'password'} placeholder="Confirm your password" value={form.confirm_password}
                    onChange={set('confirm_password')} required
                    className="flex-1 py-3 outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password hint */}
            <div className="flex items-start gap-2 bg-indigo-50 rounded-xl px-4 py-3">
              <Shield size={14} className="text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">
                Password must be at least 8 characters long and include a number, uppercase letter, and special character.
              </p>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input type="checkbox" id="agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 mt-0.5 shrink-0" />
              <label htmlFor="agree" className="text-sm text-gray-600">
                I agree to the{' '}
                <span className="text-indigo-600 font-medium cursor-pointer hover:underline">Terms of Service</span>
                {' '}and{' '}
                <span className="text-indigo-600 font-medium cursor-pointer hover:underline">Privacy Policy</span>
              </label>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60 transition-opacity mt-1"
              style={{ background: 'linear-gradient(to right, #6366F1, #4F46E5)' }}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or sign up with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="flex flex-col gap-3">
            <button className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>
            <button className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#00A4EF" d="M13 1h10v10H13z"/>
                <path fill="#7FBA00" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/>
              </svg>
              Sign up with Microsoft
            </button>
          </div>

          <p className="text-sm text-center text-gray-500 mt-6">
            Already have an account?{' '}
            <button onClick={onGoLogin} className="text-indigo-600 font-semibold hover:underline">Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}
