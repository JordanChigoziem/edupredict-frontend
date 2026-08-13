import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import PredictPerformance from './pages/PredictPerformance';
import Students from './pages/Students';
import Analytics from './pages/Analytics';
import Dataset from './pages/Dataset';
import Models from './pages/Models';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import { getMe, getSettings } from './services/api';
import { initTheme, applyTheme } from './utils/theme';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [authPage, setAuthPage] = useState('login');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [toast, setToast] = useState('');

  /*
   * Initialize the saved theme immediately when the app starts.
   * This uses localStorage so the user's previous theme is restored
   * without waiting for the backend request.
   */
  useEffect(() => {
    initTheme();
  }, []);

  /*
   * Sync the theme with the backend after the app starts.
   * The local theme is already applied, so there is no need to wait
   * for this request before rendering the application.
   */
  useEffect(() => {
    getSettings()
      .then((settings) => {
        if (settings?.theme) {
          applyTheme(settings.theme);
        }
      })
      .catch(() => {
        // Keep the locally saved theme if the backend is unavailable.
      });
  }, []);

  /*
   * Check authentication.
   */
  useEffect(() => {
    const token = localStorage.getItem('edupredict_token');

    if (token) {
      getMe()
        .then((userData) => {
          setUser(userData);
          setAuthChecked(true);
        })
        .catch(() => {
          localStorage.removeItem('edupredict_token');
          setAuthChecked(true);
        });
    } else {
      setAuthChecked(true);
    }
  }, []);

  const showToast = (msg) => {
    setToast(msg);

    setTimeout(() => {
      setToast('');
    }, 3000);
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('edupredict_token');
    setUser(null);
    setActivePage('dashboard');
    setAuthPage('login');
  };

  const handleNavigate = (page) => {
    setActivePage(page);
    setHeaderSearch('');
  };

  /*
   * Wait until authentication has been checked.
   */
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-400 dark:text-gray-500 text-sm">
          Loading...
        </div>
      </div>
    );
  }

  /*
   * Authentication pages.
   */
  if (!user) {
    if (authPage === 'register') {
      return (
        <Register
          onGoLogin={() => setAuthPage('login')}
          onLogin={handleLogin}
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onGoRegister={() => setAuthPage('register')}
      />
    );
  }

  /*
   * Main application.
   */
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {toast && (
        <div className="fixed top-6 right-6 bg-gray-800 dark:bg-gray-700 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50 max-w-xs">
          {toast}
        </div>
      )}

      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={user}
          searchQuery={headerSearch}
          onSearch={(q) => {
            setHeaderSearch(q);

            if (q && activePage !== 'students') {
              setActivePage('students');
            }
          }}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />

        <main className="px-8 pb-8 pt-3 overflow-auto">
          {activePage === 'dashboard' && (
            <Dashboard showToast={showToast} />
          )}

          {activePage === 'predict' && (
            <PredictPerformance showToast={showToast} />
          )}

          {activePage === 'students' && (
            <Students
              headerSearch={headerSearch}
              showToast={showToast}
            />
          )}

          {activePage === 'analytics' && (
            <Analytics />
          )}

          {activePage === 'dataset' && (
            <Dataset showToast={showToast} />
          )}

          {activePage === 'models' && (
            <Models showToast={showToast} />
          )}

          {activePage === 'reports' && (
            <Reports showToast={showToast} />
          )}

          {activePage === 'settings' && (
            <Settings
              user={user}
              onUserUpdate={setUser}
              showToast={showToast}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;