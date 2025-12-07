import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthScreen from './components/AuthScreen';
import MainApp from './components/MainApp';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [auth, setAuth] = useState(() => {
    try {
      const saved = localStorage.getItem('auth');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.token) {
          // FIX:  Write token in axios before first renders
          axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return { token: null, user: null };
  });

  // just in case
  useEffect(() => {
    if (auth.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [auth.token]);

  const handleAuth = (data) => {
    setAuth(data);               // { token, user }
    localStorage.setItem('auth', JSON.stringify(data));
  };

  const handleLogout = () => {
    setAuth({ token: null, user: null });
    localStorage.removeItem('auth');
  };

  if (!auth.token || !auth.user) {
    return <AuthScreen onAuth={handleAuth} apiUrl={API_URL} />;
  }

  return (
    <MainApp
      user={auth.user}
      onLogout={handleLogout}
      apiUrl={API_URL}
    />
  );
}

export default App;