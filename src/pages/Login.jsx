import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Brain, TrendingUp, PieChart, Shield, BookOpen, GraduationCap } from 'lucide-react';
import { login } from '../services/api';

export default function Login({ onLogin, onGoRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      localStorage.setItem('edupredict_token', data.token);
      if (rememberMe) localStorage.setItem('edupredict_remember', email);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
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
            Leverage machine learning to predict student performance and drive better academic outcomes.
          </p>

          {/* Dashboard preview card */}
          <div className="bg-white rounded-2xl p-5 shadow-lg mb-4 relative">
            {/* Improvement badge */}
            <div className="absolute -top-3 right-4 bg-white rounded-xl px-3 py-1.5 shadow-md flex items-center gap-1.5">
              <TrendingUp size={13} className="text-green-500" />
              <span className="text-xs font-bold text-green-600">↑ 12.5%</span>
              <span className="text-xs text-gray-400">Improvement</span>
            </div>

            <p className="text-xs font-semibold text-gray-600 mb-3">Predicted Performance</p>
            <div className="flex items-center gap-4">
              {/* Mini gauge */}
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="30" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                  <circle cx="40" cy="40" r="30" fill="none" stroke="#6366F1" strokeWidth="8"
                    strokeDasharray={`${0.85 * 2 * Math.PI * 30} ${2 * Math.PI * 30}`}
                    strokeLinecap="round" transform="rotate(-90 40 40)" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-lg font-black text-gray-800">85%</span>
                  <span className="text-xs text-indigo-500 font-medium">High</span>
                </div>
              </div>

              {/* Mini bar chart */}
              <div className="flex-1 flex items-end gap-1.5 h-14">
                {[40, 55, 45, 65, 70, 80, 75].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm"
                    style={{ height: `${h}%`, background: i === 6 ? '#6366F1' : i >= 4 ? '#A5B4FC' : '#E0E7FF' }} />
                ))}
              </div>

              {/* Plant illustration */}
              <div className="text-3xl shrink-0">🌿</div>
            </div>

            {/* Icon row */}
            <div className="flex items-center gap-2 mt-3">
              {[<Brain size={12} />, <TrendingUp size={12} />, <PieChart size={12} />].map((icon, i) => (
                <div key={i} className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Books illustration */}
          <div className="text-4xl mt-2">📚</div>
        </div>

        {/* Feature badges */}
        <div className="flex items-center gap-6">
          {[
            { icon: <Brain size={18} className="text-indigo-500" />, label: 'AI-Powered', sub: 'Predictions' },
            { icon: <TrendingUp size={18} className="text-indigo-500" />, label: 'Actionable', sub: 'Insights' },
            { icon: <Shield size={18} className="text-indigo-500" />, label: 'Data-Driven', sub: 'Decisions' },
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

      {/* Right panel — login form */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-black text-gray-900 mb-1">Welcome back!</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to continue to EduPredict</p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Email Address</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 hover:border-indigo-300 transition-colors">
                <Mail size={16} className="text-gray-400 shrink-0" />
                <input type="email" placeholder="Enter your email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required
                  className="flex-1 py-3 outline-none text-sm text-gray-700 placeholder:text-gray-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <button type="button" className="text-xs text-indigo-600 hover:underline font-medium">
                  Forgot password?
                </button>
              </div>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 gap-3 hover:border-indigo-300 transition-colors">
                <Lock size={16} className="text-gray-400 shrink-0" />
                <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password}
                  onChange={(e) => setPassword(e.target.value)} required
                  className="flex-1 py-3 outline-none text-sm text-gray-700 placeholder:text-gray-400" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded" />
              <label htmlFor="remember" className="text-sm text-gray-600">Remember me</label>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60 transition-opacity"
              style={{ background: 'linear-gradient(to right, #6366F1, #4F46E5)' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or continue with</span>
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
              Sign in with Google
            </button>
            <button className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#00A4EF" d="M13 1h10v10H13z"/>
                <path fill="#7FBA00" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/>
              </svg>
              Sign in with Microsoft
            </button>
          </div>

          <p className="text-sm text-center text-gray-500 mt-6">
            Don't have an account?{' '}
            <button onClick={onGoRegister} className="text-indigo-600 font-semibold hover:underline">Sign up</button>
          </p>
        </div>
      </div>
    </div>
  );
}
