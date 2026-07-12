import { Home, TrendingUp, Users, PieChart, Database, Box, FileText, Settings } from 'lucide-react';
import sidebarImg from '../assets/sidebar.png';

const navItems = [
  { label: 'Dashboard', icon: Home, key: 'dashboard' },
  { label: 'Predict Performance', icon: TrendingUp, key: 'predict' },
  { label: 'Students', icon: Users, key: 'students' },
  { label: 'Analytics', icon: PieChart, key: 'analytics' },
  { label: 'Dataset', icon: Database, key: 'dataset' },
  { label: 'Models', icon: Box, key: 'models' },
  { label: 'Reports', icon: FileText, key: 'reports' },
  { label: 'Settings', icon: Settings, key: 'settings' },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="p-6 pb-8">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-lg"
            style={{ background: 'linear-gradient(to bottom right, #6366F1, #3B82F6)' }} />
          <span className="text-xl font-semibold">Edu<span className="text-indigo-600">Predict</span></span>
        </div>
        <p className="text-xs text-gray-400 mt-1">ML Student Performance Predictor</p>
      </div>
      <nav className="px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.key;
          return (
            <button key={item.key} onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              style={isActive ? { background: 'linear-gradient(to right, #6366F1, #A5B4FC)' } : {}}>
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto p-4 pt-8">
        <img src={sidebarImg} alt="Empowering educators" className="w-full object-contain" />
      </div>
    </aside>
  );
}
